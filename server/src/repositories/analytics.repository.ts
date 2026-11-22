import { prisma } from "../db/prisma.js";
import type { AnalyticsEdge, AnalyticsTask, StatusTransition } from "../lib/graph/analytics.js";

export async function loadProjectAnalytics(workspaceId: string, projectId: string) {
  const project = await prisma.projects.findFirst({ where: { id: projectId, workspace_id: workspaceId }, select: { id: true, name: true, outcome_id: true, outcomes: { select: { target_date: true, delivery_contracts: { orderBy: { version: "desc" }, take: 1, select: { deadline: true } } } } } });
  if (!project) return null;
  const tasks = await prisma.tasks.findMany({ where: { workspace_id: workspaceId, project_id: projectId }, orderBy: { created_at: "asc" }, select: { id: true, title: true, status: true, completed: true, assigned_to: true, created_at: true, updated_at: true, completed_at: true, due_date: true } });
  const [edges, history, members, baseline] = await Promise.all([
    prisma.task_dependencies.findMany({ where: { workspace_id: workspaceId, project_id: projectId }, select: { predecessor_task_id: true, successor_task_id: true, dependency_type: true } }),
    prisma.task_status_history.findMany({ where: { workspace_id: workspaceId, task_id: { in: tasks.map((task) => task.id) } }, orderBy: { changed_at: "asc" }, take: 10_000, select: { task_id: true, from_status: true, to_status: true, changed_at: true } }),
    prisma.workspace_members.findMany({ where: { workspace_id: workspaceId }, select: { user_id: true, users: { select: { name: true } } } }),
    project.outcome_id ? prisma.execution_plans.findFirst({ where: { workspace_id: workspaceId, outcome_id: project.outcome_id }, orderBy: { version: "desc" }, include: { tasks: { select: { task_id: true, duration_days: true, planned_end: true } } } }) : Promise.resolve(null),
  ]);
  const membersById = new Map(members.map((member) => [member.user_id, member.users.name]));
  const baselineByTask = new Map((baseline?.tasks ?? []).filter((task) => task.task_id).map((task) => [task.task_id!, task]));
  const analyticsTasks: AnalyticsTask[] = tasks.map((task) => {
    const plan = baselineByTask.get(task.id);
    return { id: task.id, title: task.title, status: task.completed ? "DONE" : task.status, assignedTo: task.assigned_to, assigneeName: task.assigned_to ? membersById.get(task.assigned_to) ?? null : null, durationDays: plan?.duration_days ?? 3, createdAt: task.created_at, updatedAt: task.updated_at, dueDate: task.due_date, completedAt: task.completed_at, plannedEnd: plan?.planned_end ?? null };
  });
  const analyticsEdges: AnalyticsEdge[] = edges.map((edge) => ({ from: edge.predecessor_task_id, to: edge.successor_task_id, type: (edge.dependency_type ?? "FINISH_TO_START") as NonNullable<AnalyticsEdge["type"]> }));
  const transitions: StatusTransition[] = history.map((item) => ({ taskId: item.task_id, fromStatus: item.from_status, toStatus: item.to_status, changedAt: item.changed_at }));
  const deliveryDeadline = project.outcomes?.delivery_contracts[0]?.deadline ?? project.outcomes?.target_date ?? null;
  return { project: { id: project.id, name: project.name, outcome_id: project.outcome_id }, deliveryDeadline, tasks: analyticsTasks, edges: analyticsEdges, history: transitions, baselineVersion: baseline?.version ?? null };
}

export async function createAnalyticsSnapshot(workspaceId: string, projectId: string, userId: string, snapshot: unknown) {
  const rows = await prisma.$queryRaw<Array<{ id: string; created_at: Date }>>`
    INSERT INTO execution_history_snapshots (workspace_id, project_id, captured_by, snapshot)
    VALUES (${workspaceId}::uuid, ${projectId}::uuid, ${userId}::uuid, ${JSON.stringify(snapshot)}::jsonb)
    RETURNING id, created_at
  `;
  return rows[0]!;
}

export async function listAnalyticsSnapshots(workspaceId: string, projectId: string) {
  return prisma.$queryRaw<Array<{ id: string; created_at: Date; snapshot: unknown }>>`
    SELECT id, created_at, snapshot
    FROM execution_history_snapshots
    WHERE workspace_id = ${workspaceId}::uuid AND project_id = ${projectId}::uuid
    ORDER BY created_at DESC
    LIMIT 50
  `;
}
