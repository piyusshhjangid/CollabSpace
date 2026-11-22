import { createHash } from "node:crypto";
import { badRequest, forbidden } from "../lib/AppError.js";
import { calculateExecutionAnalytics } from "../lib/graph/analytics.js";
import { simulateScenario, type ScenarioChanges } from "../lib/simulation.js";
import { hasPermission } from "../policy/permissionMatrix.js";
import { normalizeRole } from "../types/role.js";
import { findWorkspaceMembership } from "../repositories/workspace.repository.js";
import { loadProjectAnalytics } from "../repositories/analytics.repository.js";
import { createRecoveryPlan, decideRecoveryPlan as decidePlan, executeRecoveryPlanChanges, findRecoveryPlan, listRecoveryPlans, loadRecoveryPlanForWorker, finishRecoveryJob, retryRecoveryJob, type RecoveryPlanRecord } from "../repositories/recovery.repository.js";
import { writeAuditLog } from "./audit.service.js";
import { getProjectDeliveryHealth } from "./delivery-health.service.js";

interface RecoveryOption {
  key: string;
  title: string;
  explanation: string;
  executable: boolean;
  score: number;
  impact: { finishDateChangeDays: number; workloadSpreadChange: number };
  risk: string;
  changes: ScenarioChanges;
  simulation: unknown;
}

async function requireMember(workspaceId: string, projectId: string, userId: string) {
  if (!(await findWorkspaceMembership(workspaceId, userId))) throw forbidden("You are not a member of this workspace");
  const project = await loadProjectAnalytics(workspaceId, projectId);
  if (!project) throw badRequest("Project not found");
  return project;
}

export async function generateRecoveryPlan(workspaceId: string, projectId: string, userId: string, name?: string) {
  const project = await requireMember(workspaceId, projectId, userId);
  const [health, analytics] = await Promise.all([
    getProjectDeliveryHealth(workspaceId, projectId, userId),
    Promise.resolve(calculateExecutionAnalytics({ tasks: project.tasks, edges: project.edges, history: project.history })),
  ]);
  const rootCause = {
    health: { score: health.health.score, label: health.health.label, risks: health.riskFactors },
    bottlenecks: analytics.bottlenecks,
    criticalTaskIds: analytics.graph.criticalPath.map((task) => task.taskId),
    evidenceConfidence: health.health.averageEvidenceConfidence,
    baselineVersion: project.baselineVersion,
    analyzedAt: analytics.capturedAt,
  };
  const options: RecoveryOption[] = [];
  const baselineDays = analytics.graph.estimatedDurationDays;

  for (const edge of project.edges) {
    const changes: ScenarioChanges = { removeDependencies: [{ from: edge.from, to: edge.to }] };
    try {
      const simulation = simulateScenario({ tasks: project.tasks, edges: project.edges, changes, existingDeadline: project.deliveryDeadline });
      const gain = baselineDays - simulation.scenario.durationDays;
      if (gain < 1) continue;
      const key = `parallelize-${createHash("sha1").update(`${edge.from}:${edge.to}`).digest("hex").slice(0, 12)}`;
      options.push({ key, title: "Parallelize a blocked task", explanation: `Removing this dependency reduces the modeled finish by ${gain} business day${gain === 1 ? "" : "s"}. Confirm the work can safely start earlier before approval.`, executable: true, score: gain * 10 - 4, impact: { finishDateChangeDays: -gain, workloadSpreadChange: 0 }, risk: "HIGH: the dependency may represent a real sequencing constraint.", changes, simulation });
    } catch {
      // A cyclic or stale candidate is not offered for approval.
    }
  }

  const openTasks = project.tasks.filter((task) => task.status.toUpperCase() !== "DONE");
  const load = [...analytics.workload].sort((a, b) => b.openTasks - a.openTasks);
  if (load.length > 1 && load[0]!.openTasks - load.at(-1)!.openTasks > 0) {
    const overloadedId = load[0]!.personId;
    const availableId = load.at(-1)!.personId;
    const centralityByTask = new Map(analytics.dependencyCentrality.map((item) => [item.taskId, item.centrality]));
    const candidateTask = openTasks.filter((task) => task.assignedTo === overloadedId).sort((a, b) => (centralityByTask.get(a.id) ?? 0) - (centralityByTask.get(b.id) ?? 0))[0];
    if (candidateTask) {
      const changes: ScenarioChanges = { reassignTasks: [{ taskId: candidateTask.id, assigneeId: availableId }] };
      const simulation = simulateScenario({ tasks: project.tasks, edges: project.edges, changes, existingDeadline: project.deliveryDeadline });
      const spreadGain = simulation.workload.before.spread - simulation.workload.after.spread;
      if (spreadGain > 0) options.push({ key: `rebalance-${createHash("sha1").update(candidateTask.id).digest("hex").slice(0, 12)}`, title: "Rebalance an open task", explanation: `Moves “${candidateTask.title}” from the most-loaded member to a member with fewer open tasks. The date forecast stays unchanged because capacity data is not configured.`, executable: true, score: spreadGain * 3, impact: { finishDateChangeDays: 0, workloadSpreadChange: -spreadGain }, risk: "LOW: confirm the new owner has the right context and skills.", changes, simulation });
    }
  }

  options.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  const fallback: RecoveryOption = { key: "review-only", title: "Review delivery risks", explanation: "The engine did not find a safe schedule or workload change to propose. Review the cited risks and update the plan manually.", executable: false, score: 0, impact: { finishDateChangeDays: 0, workloadSpreadChange: 0 }, risk: "No changes can be executed from this option.", changes: {}, simulation: null };
  const selectedOptions = options.length ? options.slice(0, 5) : [fallback];
  const row = await createRecoveryPlan(workspaceId, projectId, userId, name?.trim() || `Recovery review · ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`, rootCause, selectedOptions);
  await writeAuditLog({ workspaceId, actorId: userId, action: "RECOVERY_PLAN_CREATED", targetType: "RECOVERY_PLAN", targetId: row.id, metadata: { projectId, optionCount: selectedOptions.filter((option) => option.executable).length, health: health.health.label } });
  return row;
}

export async function getRecoveryPlans(workspaceId: string, projectId: string, userId: string) {
  await requireMember(workspaceId, projectId, userId);
  return listRecoveryPlans(workspaceId, projectId);
}

export async function decideRecoveryPlan(workspaceId: string, projectId: string, planId: string, userId: string, decision: "APPROVE" | "REJECT", optionKey?: string) {
  await requireMember(workspaceId, projectId, userId);
  if (decision === "APPROVE") {
    const plan = await findRecoveryPlan(workspaceId, projectId, planId);
    if (!plan) throw badRequest("Recovery plan not found");
    const options = Array.isArray(plan.options) ? plan.options as RecoveryOption[] : [];
    const option = options.find((candidate) => candidate.key === optionKey);
    if (!option?.executable) throw badRequest("This review-only option cannot be approved for execution");
  }
  const updated = await decidePlan(workspaceId, projectId, planId, userId, decision, optionKey);
  await writeAuditLog({ workspaceId, actorId: userId, action: `RECOVERY_PLAN_${decision}`, targetType: "RECOVERY_PLAN", targetId: planId, metadata: { projectId, optionKey: optionKey ?? null, status: updated.status } });
  return updated;
}

export async function executeRecoveryJob(job: { id: string; plan_id: string; workspace_id: string; attempts: number }) {
  const plan = await loadRecoveryPlanForWorker(job.plan_id, job.workspace_id);
  try {
    if (!plan) throw badRequest("Recovery plan was removed before execution");
    if (plan.status === "SUCCEEDED") {
      await finishRecoveryJob(job.id);
      return;
    }
    if (!plan.decided_by) throw forbidden("Approved actor is missing");
    const membership = await findWorkspaceMembership(job.workspace_id, plan.decided_by);
    const approverRole = membership ? normalizeRole(membership.role) : null;
    if (!approverRole || !hasPermission(approverRole, "MANAGE_OUTCOMES")) throw forbidden("The approving member no longer has permission");
    const options = Array.isArray(plan.options) ? plan.options as RecoveryOption[] : [];
    const option = options.find((candidate) => candidate.key === plan.selected_option_key);
    if (!option?.executable) throw badRequest("Approved recovery option is invalid");
    const verification = await executeRecoveryPlanChanges(plan, option);
    await writeAuditLog({ workspaceId: job.workspace_id, actorId: plan.decided_by, action: "RECOVERY_PLAN_EXECUTED", targetType: "RECOVERY_PLAN", targetId: plan.id, metadata: { projectId: plan.project_id, optionKey: option.key } });
    await finishRecoveryJob(job.id);
    return verification;
  } catch (error) {
    await retryRecoveryJob(job.id, job.plan_id, job.attempts, error instanceof Error && error.message.includes("permission") ? "APPROVER_PERMISSION_CHANGED" : "RECOVERY_EXECUTION_FAILED");
    throw error;
  }
}
