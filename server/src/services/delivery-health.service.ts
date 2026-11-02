import { prisma } from "../db/prisma.js";
import { badRequest, forbidden } from "../lib/AppError.js";
import { buildGraph, criticalPath, type GraphEdge } from "../lib/graph/graph.js";
import { findWorkspaceMembership } from "../repositories/workspace.repository.js";

function plusBusinessDays(start: Date, days: number) {
  const date = new Date(start);
  let remaining = Math.max(0, Math.ceil(days));
  while (remaining > 0) {
    date.setUTCDate(date.getUTCDate() + 1);
    if (date.getUTCDay() !== 0 && date.getUTCDay() !== 6) remaining--;
  }
  return date;
}

export async function getProjectDeliveryHealth(workspaceId: string, projectId: string, userId: string) {
  if (!(await findWorkspaceMembership(workspaceId, userId))) throw forbidden("You are not a member of this workspace");
  const project = await prisma.projects.findFirst({ where: { id: projectId, workspace_id: workspaceId }, select: { id: true, outcome_id: true, name: true } });
  if (!project) throw badRequest("Project not found");
  const now = new Date();
  const windowStart = new Date(now.getTime() - 28 * 86_400_000);
  const [tasks, edges, completions, baseline, truths, evidence] = await Promise.all([
    prisma.tasks.findMany({ where: { workspace_id: workspaceId, project_id: projectId }, select: { id: true, title: true, status: true, completed: true, created_at: true, updated_at: true, due_date: true, plan_snapshots: { select: { duration_days: true, planned_end: true }, orderBy: { order_index: "asc" }, take: 1 } } }),
    prisma.task_dependencies.findMany({ where: { workspace_id: workspaceId, project_id: projectId }, select: { predecessor_task_id: true, successor_task_id: true, dependency_type: true } }),
    prisma.task_status_history.groupBy({ by: ["task_id"], where: { workspace_id: workspaceId, to_status: "DONE", changed_at: { gte: windowStart } }, _count: { task_id: true } }),
    project.outcome_id ? prisma.execution_plans.findFirst({ where: { workspace_id: workspaceId, outcome_id: project.outcome_id }, orderBy: { version: "desc" }, include: { tasks: { select: { planned_end: true } } } }) : Promise.resolve(null),
    prisma.task_truth.findMany({ where: { workspace_id: workspaceId, project_id: projectId } }),
    prisma.task_evidence.findMany({ where: { workspace_id: workspaceId, project_id: projectId }, select: { task_id: true, captured_at: true } }),
  ]);
  const completedCount = tasks.filter((task) => task.completed || task.status.toUpperCase() === "DONE").length;
  const remaining = tasks.filter((task) => !task.completed && task.status.toUpperCase() !== "DONE");
  const weeklyThroughput = completions.length / 4;
  const hasHistory = completions.length > 0;
  const fallbackVelocity = Math.max(0.25, completedCount / 4);
  const velocity = hasHistory ? weeklyThroughput : fallbackVelocity;
  const ids = tasks.map((task) => task.id);
  const graph = buildGraph(ids, edges.map((edge) => ({ from: edge.predecessor_task_id, to: edge.successor_task_id, type: (edge.dependency_type ?? "FINISH_TO_START") as NonNullable<GraphEdge["type"]> })));
  let criticalPathDays = 0;
  let graphIsValid = true;
  try {
    const taskDuration = Object.fromEntries(tasks.map((task) => [task.id, task.plan_snapshots[0]?.duration_days ?? 3]));
    criticalPathDays = criticalPath(graph, taskDuration).duration;
  } catch {
    graphIsValid = false;
  }
  const remainingIds = new Set(remaining.map((task) => task.id));
  const remainingGraph = buildGraph(remainingIds, edges.filter((edge) => remainingIds.has(edge.predecessor_task_id) && remainingIds.has(edge.successor_task_id)).map((edge) => ({ from: edge.predecessor_task_id, to: edge.successor_task_id, type: (edge.dependency_type ?? "FINISH_TO_START") as NonNullable<GraphEdge["type"]> })));
  let remainingCriticalPath = 0;
  try {
    remainingCriticalPath = criticalPath(remainingGraph, Object.fromEntries(remaining.map((task) => [task.id, task.plan_snapshots[0]?.duration_days ?? 3]))).duration;
  } catch {
    graphIsValid = false;
  }
  const remainingDuration = remainingCriticalPath || (remaining.length ? remaining.reduce((sum, task) => sum + (task.plan_snapshots[0]?.duration_days ?? 3), 0) : 0);
  const throughputDays = Math.ceil((remaining.length / velocity) * 5);
  const baselineDays = Math.max(remainingDuration, throughputDays);
  const sampleCount = completions.length;
  const completedSet = new Set(tasks.filter((task) => task.completed || task.status.toUpperCase() === "DONE").map((task) => task.id));
  const predecessorMap = new Map<string, string[]>();
  for (const edge of edges) predecessorMap.set(edge.successor_task_id, [...(predecessorMap.get(edge.successor_task_id) ?? []), edge.predecessor_task_id]);
  const blocked = remaining.filter((task) => task.status.toUpperCase() === "BLOCKED");
  const overdue = remaining.filter((task) => task.due_date && task.due_date < now);
  const stale = remaining.filter((task) => task.updated_at < new Date(now.getTime() - 14 * 86_400_000));
  const waiting = remaining.filter((task) => (predecessorMap.get(task.id) ?? []).some((prior) => !completedSet.has(prior)));
  const seedInput = `${projectId}:${remaining.map((task) => task.id).sort().join(":")}:${completions.length}:${velocity.toFixed(3)}`;
  let seed = [...seedInput].reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619), 2166136261) >>> 0;
  const random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; };
  const simulationCount = 500;
  const riskExposure = Math.min(12, blocked.length * 2.5 + overdue.length * 1.5 + waiting.length * 0.75 + stale.length * 0.5);
  const samples = Array.from({ length: simulationCount }, () => {
    const velocityFactor = hasHistory ? 0.65 + random() * 0.7 : 0.5 + random() * 0.7;
    const scheduleDelay = random() * riskExposure;
    return Math.max(remainingDuration, (remaining.length / Math.max(0.1, velocity * velocityFactor)) * 5, baselineDays) + scheduleDelay;
  }).sort((a, b) => a - b);
  const percentile = (value: number) => samples[Math.min(samples.length - 1, Math.ceil(value * samples.length) - 1)] ?? 0;
  const p50BusinessDays = Math.ceil(percentile(0.5));
  const p85BusinessDays = Math.ceil(percentile(0.85));
  const forecast = { p50: plusBusinessDays(now, p50BusinessDays), p85: plusBusinessDays(now, p85BusinessDays), p50BusinessDays, p85BusinessDays, velocityTasksPerWeek: Number(velocity.toFixed(2)), sampleCount, simulationCount, confidence: sampleCount >= 8 ? "HIGH" : sampleCount >= 3 ? "MEDIUM" : "LOW", basis: hasHistory ? "500 seeded simulations using completion history, dependency critical path, and current risk factors" : "500 seeded simulations with a conservative fallback; no recent completion history is available" };

  const riskFactors = [
    ...(blocked.length ? [{ code: "BLOCKED_TASKS", severity: "HIGH", count: blocked.length, taskIds: blocked.map((task) => task.id), explanation: "Blocked tasks directly prevent downstream work." }] : []),
    ...(overdue.length ? [{ code: "OVERDUE_TASKS", severity: "HIGH", count: overdue.length, taskIds: overdue.map((task) => task.id), explanation: "Open tasks have passed their due dates." }] : []),
    ...(waiting.length ? [{ code: "DEPENDENCY_WAIT", severity: waiting.length > 3 ? "HIGH" : "MEDIUM", count: waiting.length, taskIds: waiting.map((task) => task.id), explanation: "Tasks are waiting on unfinished predecessors." }] : []),
    ...(stale.length ? [{ code: "STALE_TASKS", severity: "MEDIUM", count: stale.length, taskIds: stale.map((task) => task.id), explanation: "Open tasks have not changed in at least two weeks." }] : []),
    ...(!hasHistory && remaining.length ? [{ code: "LOW_FORECAST_SAMPLE", severity: "LOW", count: remaining.length, taskIds: [], explanation: "There is no recent completion history; the date range uses a conservative fallback." }] : []),
    ...(!graphIsValid ? [{ code: "INVALID_DEPENDENCY_GRAPH", severity: "HIGH", count: 1, taskIds: [], explanation: "The dependency graph could not be used for a critical path calculation." }] : []),
  ];
  const plannedEndValues = (baseline?.tasks ?? []).map((task) => task.planned_end?.getTime()).filter((value): value is number => typeof value === "number");
  const plannedEnd = plannedEndValues.length ? new Date(Math.max(...plannedEndValues)) : null;
  const drift = plannedEnd ? { baselineDate: plannedEnd, p50Days: Math.ceil((forecast.p50.getTime() - plannedEnd.getTime()) / 86_400_000), p85Days: Math.ceil((forecast.p85.getTime() - plannedEnd.getTime()) / 86_400_000), status: forecast.p50 > plannedEnd ? "AT_RISK" : "ON_TRACK" } : { baselineDate: null, p50Days: null, p85Days: null, status: "NO_BASELINE" };
  const averageConfidence = truths.length ? truths.reduce((sum, truth) => sum + truth.confidence, 0) / truths.length : 0;
  const evidenceFreshness = evidence.length ? Math.max(...evidence.map((item) => item.captured_at.getTime())) : null;
  const penalty = Math.min(60, blocked.length * 12 + overdue.length * 8 + waiting.length * 3 + stale.length * 2);
  const healthScore = Math.max(0, 100 - penalty);
  const truthCoverage = tasks.length ? Number((truths.filter((truth) => truth.observed_status !== "UNVERIFIED").length / tasks.length).toFixed(2)) : 0;
  return { project: { id: project.id, name: project.name }, health: { score: healthScore, label: healthScore >= 80 ? "HEALTHY" : healthScore >= 55 ? "WATCH" : "AT_RISK", openTasks: remaining.length, completedTasks: completedCount, blockedTasks: blocked.length, evidenceCoverage: truthCoverage, averageEvidenceConfidence: Number(averageConfidence.toFixed(2)), latestEvidenceAt: evidenceFreshness ? new Date(evidenceFreshness) : null }, forecast, drift, riskFactors };
}
