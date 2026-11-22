import { prisma } from "../db/prisma.js";
import { conflict, forbidden } from "../lib/AppError.js";
import { buildGraph, topologicalSort, type GraphEdge } from "../lib/graph/graph.js";

export interface RecoveryPlanRecord {
  id: string;
  workspace_id: string;
  project_id: string;
  created_by: string;
  name: string;
  status: string;
  root_cause: unknown;
  options: unknown;
  selected_option_key: string | null;
  decided_by: string | null;
  decided_at: Date | null;
  verification: unknown;
  created_at: Date;
  updated_at: Date;
}

export async function createRecoveryPlan(workspaceId: string, projectId: string, userId: string, name: string, rootCause: unknown, options: unknown) {
  const rows = await prisma.$queryRaw<RecoveryPlanRecord[]>`
    INSERT INTO recovery_plans (workspace_id, project_id, created_by, name, root_cause, options)
    VALUES (${workspaceId}::uuid, ${projectId}::uuid, ${userId}::uuid, ${name}, ${JSON.stringify(rootCause)}::jsonb, ${JSON.stringify(options)}::jsonb)
    RETURNING *
  `;
  return rows[0]!;
}

export async function listRecoveryPlans(workspaceId: string, projectId: string) {
  return prisma.$queryRaw<RecoveryPlanRecord[]>`
    SELECT * FROM recovery_plans
    WHERE workspace_id = ${workspaceId}::uuid AND project_id = ${projectId}::uuid
    ORDER BY created_at DESC LIMIT 100
  `;
}

export async function findRecoveryPlan(workspaceId: string, projectId: string, planId: string) {
  const rows = await prisma.$queryRaw<RecoveryPlanRecord[]>`
    SELECT * FROM recovery_plans
    WHERE id = ${planId}::uuid AND workspace_id = ${workspaceId}::uuid AND project_id = ${projectId}::uuid
  `;
  return rows[0] ?? null;
}

export async function decideRecoveryPlan(workspaceId: string, projectId: string, planId: string, userId: string, decision: "APPROVE" | "REJECT", optionKey?: string) {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<RecoveryPlanRecord[]>`
      SELECT * FROM recovery_plans
      WHERE id = ${planId}::uuid AND workspace_id = ${workspaceId}::uuid AND project_id = ${projectId}::uuid AND status = 'PENDING'
      FOR UPDATE
    `;
    const plan = rows[0];
    if (!plan) throw conflict("Recovery plan is missing or has already been decided");
    if (decision === "APPROVE" && plan.created_by === userId) throw forbidden("A different workspace member must approve a recovery plan you created");
    const options = Array.isArray(plan.options) ? plan.options as Array<{ key?: unknown }> : [];
    if (decision === "APPROVE" && (!optionKey || !options.some((option) => option.key === optionKey))) throw conflict("Choose a recovery option from this plan before approving it");
    const status = decision === "APPROVE" ? "QUEUED" : "REJECTED";
    const updated = await tx.$queryRaw<RecoveryPlanRecord[]>`
      UPDATE recovery_plans
      SET status = ${status}, selected_option_key = ${decision === "APPROVE" ? optionKey! : null}, decided_by = ${userId}::uuid, decided_at = now(), updated_at = now()
      WHERE id = ${planId}::uuid AND status = 'PENDING'
      RETURNING *
    `;
    if (!updated[0]) throw conflict("Recovery plan has already been decided");
    if (decision === "APPROVE") {
      await tx.$executeRaw`
        INSERT INTO recovery_jobs (plan_id, workspace_id) VALUES (${planId}::uuid, ${workspaceId}::uuid)
        ON CONFLICT (plan_id) DO NOTHING
      `;
    }
    return updated[0];
  });
}

export async function claimRecoveryJob() {
  const rows = await prisma.$queryRaw<Array<{ id: string; plan_id: string; workspace_id: string; attempts: number }>>`
    WITH next_job AS (
      SELECT id FROM recovery_jobs
      WHERE (status = 'PENDING' AND available_at <= now())
         OR (status = 'PROCESSING' AND locked_at < now() - interval '2 minutes')
      ORDER BY available_at, created_at
      FOR UPDATE SKIP LOCKED LIMIT 1
    )
    UPDATE recovery_jobs j
    SET status = 'PROCESSING', attempts = attempts + 1, locked_at = now()
    FROM next_job
    WHERE j.id = next_job.id
    RETURNING j.id, j.plan_id, j.workspace_id, j.attempts
  `;
  return rows[0] ?? null;
}

export async function finishRecoveryJob(jobId: string) {
  await prisma.$executeRaw`UPDATE recovery_jobs SET status = 'DONE', locked_at = NULL, last_error = NULL WHERE id = ${jobId}::uuid`;
}

export async function retryRecoveryJob(jobId: string, planId: string, attempts: number, errorCode: string) {
  if (attempts >= 5) {
    await prisma.$transaction([
      prisma.$executeRaw`UPDATE recovery_jobs SET status = 'DEAD', locked_at = NULL, last_error = ${errorCode} WHERE id = ${jobId}::uuid`,
      prisma.$executeRaw`UPDATE recovery_plans SET status = 'FAILED', verification = jsonb_build_object('reason', 'Recovery job exceeded its retry limit', 'errorCode', ${errorCode}), updated_at = now() WHERE id = ${planId}::uuid AND status IN ('QUEUED','EXECUTING')`,
    ]);
    return;
  }
  const delaySeconds = Math.min(60, 2 ** Math.max(0, attempts));
  await prisma.$executeRaw`
    UPDATE recovery_jobs SET status = 'PENDING', locked_at = NULL, last_error = ${errorCode}, available_at = now() + (${delaySeconds} * interval '1 second')
    WHERE id = ${jobId}::uuid
  `;
}

export async function loadRecoveryPlanForWorker(planId: string, workspaceId: string) {
  const rows = await prisma.$queryRaw<RecoveryPlanRecord[]>`
    SELECT * FROM recovery_plans WHERE id = ${planId}::uuid AND workspace_id = ${workspaceId}::uuid
  `;
  return rows[0] ?? null;
}

export async function executeRecoveryPlanChanges(plan: RecoveryPlanRecord, option: { changes: { reassignTasks?: Array<{ taskId: string; assigneeId: string }>; removeDependencies?: Array<{ from: string; to: string }> } }) {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<RecoveryPlanRecord[]>`
      SELECT * FROM recovery_plans WHERE id = ${plan.id}::uuid AND workspace_id = ${plan.workspace_id}::uuid FOR UPDATE
    `;
    const currentPlan = rows[0];
    if (!currentPlan) throw conflict("Recovery plan no longer exists");
    if (currentPlan.status === "SUCCEEDED") return currentPlan.verification;
    if (currentPlan.status !== "QUEUED" && currentPlan.status !== "EXECUTING") throw conflict("Recovery plan is no longer queued for execution");
    await tx.$executeRaw`UPDATE recovery_plans SET status = 'EXECUTING', updated_at = now() WHERE id = ${plan.id}::uuid`;

    const tasks = await tx.tasks.findMany({ where: { workspace_id: plan.workspace_id, project_id: plan.project_id }, select: { id: true, status: true, completed: true } });
    const taskById = new Map(tasks.map((task) => [task.id, task]));
    const reassignments = option.changes.reassignTasks ?? [];
    for (const change of reassignments) {
      const task = taskById.get(change.taskId);
      if (!task || task.completed || task.status.toUpperCase() === "DONE") throw conflict("A recovery task changed or completed since approval. Generate a fresh plan.");
    }
    const memberIds = reassignments.length ? await tx.workspace_members.findMany({ where: { workspace_id: plan.workspace_id, user_id: { in: [...new Set(reassignments.map((item) => item.assigneeId))] } }, select: { user_id: true } }) : [];
    if (memberIds.length !== new Set(reassignments.map((item) => item.assigneeId)).size) throw conflict("A proposed assignee is no longer in this workspace");

    const currentEdges = await tx.task_dependencies.findMany({ where: { workspace_id: plan.workspace_id, project_id: plan.project_id }, select: { predecessor_task_id: true, successor_task_id: true, dependency_type: true } });
    const removePairs = option.changes.removeDependencies ?? [];
    for (const pair of removePairs) if (!currentEdges.some((edge) => edge.predecessor_task_id === pair.from && edge.successor_task_id === pair.to)) throw conflict("A proposed dependency changed since approval. Generate a fresh plan.");
    const taskIds = tasks.map((task) => task.id);
    const remainingEdges: GraphEdge[] = currentEdges.filter((edge) => !removePairs.some((pair) => pair.from === edge.predecessor_task_id && pair.to === edge.successor_task_id)).map((edge) => ({ from: edge.predecessor_task_id, to: edge.successor_task_id, type: (edge.dependency_type ?? "FINISH_TO_START") as NonNullable<GraphEdge["type"]> }));
    if (topologicalSort(buildGraph(taskIds, remainingEdges)).cyclicNodes.length) throw conflict("The current project graph is not valid. Recovery was not applied.");

    for (const change of reassignments) {
      const updated = await tx.tasks.updateMany({ where: { id: change.taskId, workspace_id: plan.workspace_id, project_id: plan.project_id, completed: false, status: { not: "DONE" } }, data: { assigned_to: change.assigneeId } });
      if (updated.count !== 1) throw conflict("A task changed while the recovery plan was being applied");
    }
    let dependencyCount = 0;
    for (const pair of removePairs) {
      const deleted = await tx.task_dependencies.deleteMany({ where: { workspace_id: plan.workspace_id, project_id: plan.project_id, predecessor_task_id: pair.from, successor_task_id: pair.to } });
      dependencyCount += deleted.count;
      if (deleted.count !== 1) throw conflict("A dependency changed while the recovery plan was being applied");
    }
    const verification = { appliedAt: new Date().toISOString(), taskAssignmentsUpdated: reassignments.length, dependenciesRemoved: dependencyCount, postconditions: ["All changed tasks remain inside the approved project and workspace", "The dependency graph remains acyclic", "Every requested update was applied atomically"] };
    const updated = await tx.$queryRaw<RecoveryPlanRecord[]>`
      UPDATE recovery_plans SET status = 'SUCCEEDED', verification = ${JSON.stringify(verification)}::jsonb, updated_at = now()
      WHERE id = ${plan.id}::uuid AND status = 'EXECUTING' RETURNING *
    `;
    return updated[0]?.verification ?? verification;
  });
}
