import { buildGraph, criticalPath, type GraphEdge } from "./graph.js";

export interface AnalyticsTask {
  id: string;
  title: string;
  status: string;
  assignedTo: string | null;
  assigneeName?: string | null;
  durationDays: number;
  createdAt: Date;
  updatedAt: Date;
  dueDate: Date | null;
  completedAt: Date | null;
  plannedEnd: Date | null;
}

export interface AnalyticsEdge {
  from: string;
  to: string;
  type?: "FINISH_TO_START" | "START_TO_START" | "FINISH_TO_FINISH" | "START_TO_FINISH";
}

export interface StatusTransition {
  taskId: string;
  fromStatus: string | null;
  toStatus: string;
  changedAt: Date;
}

const isDone = (task: AnalyticsTask) => task.completedAt !== null || task.status.toUpperCase() === "DONE";
const percentile = (values: number[], p: number) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(p * sorted.length) - 1)];
};

function graphOrder(ids: string[], edges: AnalyticsEdge[]) {
  const incoming = new Map(ids.map((id) => [id, 0]));
  const outgoing = new Map(ids.map((id) => [id, [] as string[]]));
  for (const edge of edges) {
    if (!incoming.has(edge.from) || !incoming.has(edge.to)) continue;
    outgoing.get(edge.from)!.push(edge.to);
    incoming.set(edge.to, incoming.get(edge.to)! + 1);
  }
  const ready = ids.filter((id) => incoming.get(id) === 0).sort();
  const order: string[] = [];
  while (ready.length) {
    const id = ready.shift()!;
    order.push(id);
    for (const next of outgoing.get(id) ?? []) {
      incoming.set(next, incoming.get(next)! - 1);
      if (incoming.get(next) === 0) {
        ready.push(next);
        ready.sort();
      }
    }
  }
  if (order.length !== ids.length) throw new Error("Execution graph contains a cycle");
  return { order, outgoing };
}

function reachable(start: string, edges: Map<string, string[]>) {
  const found = new Set<string>();
  const stack = [...(edges.get(start) ?? [])];
  while (stack.length) {
    const current = stack.pop()!;
    if (found.has(current)) continue;
    found.add(current);
    stack.push(...(edges.get(current) ?? []));
  }
  return found;
}

function blockedDurations(history: StatusTransition[], capturedAt: Date) {
  const durations: number[] = [];
  const byTask = new Map<string, StatusTransition[]>();
  for (const item of history) byTask.set(item.taskId, [...(byTask.get(item.taskId) ?? []), item]);
  for (const transitions of byTask.values()) {
    transitions.sort((a, b) => a.changedAt.getTime() - b.changedAt.getTime());
    let blockedAt: number | null = null;
    for (const item of transitions) {
      const from = item.fromStatus?.toUpperCase();
      const to = item.toStatus.toUpperCase();
      if (to === "BLOCKED" && blockedAt === null) blockedAt = item.changedAt.getTime();
      if (from === "BLOCKED" && blockedAt !== null) {
        durations.push(Math.max(0, Math.ceil((item.changedAt.getTime() - blockedAt) / 86_400_000)));
        blockedAt = null;
      }
    }
    if (blockedAt !== null) durations.push(Math.max(0, Math.ceil((capturedAt.getTime() - blockedAt) / 86_400_000)));
  }
  return durations;
}

export function calculateExecutionAnalytics(input: {
  tasks: AnalyticsTask[];
  edges: AnalyticsEdge[];
  history: StatusTransition[];
  capturedAt?: Date;
}) {
  const capturedAt = input.capturedAt ?? new Date();
  const tasks = input.tasks;
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const { order, outgoing } = graphOrder(tasks.map((task) => task.id), input.edges);
  const predecessors = new Map(tasks.map((task) => [task.id, [] as string[]]));
  for (const edge of input.edges) if (predecessors.has(edge.to) && byId.has(edge.from)) predecessors.get(edge.to)!.push(edge.from);

  const path = criticalPath(buildGraph(tasks.map((task) => task.id), input.edges as GraphEdge[]), Object.fromEntries(tasks.map((task) => [task.id, Math.max(1, task.durationDays)])));
  const duration = path.duration;
  const earliestFinish = path.earliestFinish;
  const earliestStart = new Map(tasks.map((task) => [task.id, (earliestFinish[task.id] ?? 0) - Math.max(1, task.durationDays)]));
  const criticalTasks = tasks.map((task) => ({
    taskId: task.id,
    title: task.title,
    slackDays: path.slack[task.id] ?? 0,
    earliestStartDay: earliestStart.get(task.id) ?? 0,
    earliestFinishDay: earliestFinish[task.id] ?? 0,
  })).sort((a, b) => a.slackDays - b.slackDays || a.earliestStartDay - b.earliestStartDay);

  const centrality = tasks.map((task) => {
    const ancestors = new Set<string>();
    const stack = [...(predecessors.get(task.id) ?? [])];
    while (stack.length) {
      const id = stack.pop()!;
      if (ancestors.has(id)) continue;
      ancestors.add(id);
      stack.push(...(predecessors.get(id) ?? []));
    }
    const descendants = reachable(task.id, outgoing);
    const scale = Math.max(1, (tasks.length - 1) ** 2);
    return { taskId: task.id, title: task.title, fanIn: predecessors.get(task.id)?.length ?? 0, fanOut: outgoing.get(task.id)?.length ?? 0, centrality: Number(((ancestors.size * descendants.size) / scale).toFixed(3)), ancestorCount: ancestors.size, descendantCount: descendants.size };
  }).sort((a, b) => b.centrality - a.centrality || b.fanOut - a.fanOut);

  const cycleTimes: number[] = [];
  const transitionsByTask = new Map<string, StatusTransition[]>();
  for (const transition of input.history) transitionsByTask.set(transition.taskId, [...(transitionsByTask.get(transition.taskId) ?? []), transition]);
  for (const [taskId, transitions] of transitionsByTask) {
    transitions.sort((a, b) => a.changedAt.getTime() - b.changedAt.getTime());
    const started = transitions.find((item) => item.toStatus.toUpperCase() === "IN_PROGRESS")?.changedAt;
    const finished = transitions.find((item) => item.toStatus.toUpperCase() === "DONE")?.changedAt;
    if (started && finished && finished >= started) cycleTimes.push(Math.max(1, Math.ceil((finished.getTime() - started.getTime()) / 86_400_000)));
    else if (!started && byId.get(taskId)?.createdAt && finished && finished >= byId.get(taskId)!.createdAt) cycleTimes.push(Math.max(1, Math.ceil((finished.getTime() - byId.get(taskId)!.createdAt.getTime()) / 86_400_000)));
  }

  const blocked = tasks.filter((task) => task.status.toUpperCase() === "BLOCKED" && !isDone(task));
  const overdue = tasks.filter((task) => task.dueDate && task.dueDate < capturedAt && !isDone(task));
  const workloadMap = new Map<string, { personId: string; name: string; openTasks: number; estimatedDays: number; blockedTasks: number }>();
  for (const task of tasks.filter((item) => !isDone(item) && item.assignedTo)) {
    const id = task.assignedTo!;
    const row = workloadMap.get(id) ?? { personId: id, name: task.assigneeName || "Workspace member", openTasks: 0, estimatedDays: 0, blockedTasks: 0 };
    row.openTasks++;
    row.estimatedDays += Math.max(1, task.durationDays);
    if (task.status.toUpperCase() === "BLOCKED") row.blockedTasks++;
    workloadMap.set(id, row);
  }
  const plannedActual = tasks.filter((task) => task.completedAt && task.plannedEnd).map((task) => ({
    taskId: task.id,
    title: task.title,
    plannedEnd: task.plannedEnd!.toISOString(),
    completedAt: task.completedAt!.toISOString(),
    varianceDays: Math.round((task.completedAt!.getTime() - task.plannedEnd!.getTime()) / 86_400_000),
  }));
  const blockedTime = blockedDurations(input.history, capturedAt);

  return {
    capturedAt: capturedAt.toISOString(),
    taskCount: tasks.length,
    completedCount: tasks.filter(isDone).length,
    openCount: tasks.filter((task) => !isDone(task)).length,
    edgeCount: input.edges.length,
    graph: { estimatedDurationDays: duration, criticalPath: criticalTasks.filter((item) => item.slackDays === 0), nearCriticalTasks: criticalTasks.filter((item) => item.slackDays > 0 && item.slackDays <= 2), taskSlack: criticalTasks },
    dependencyCentrality: centrality.slice(0, 12),
    bottlenecks: [
      ...blocked.map((task) => ({ taskId: task.id, title: task.title, reason: "BLOCKED", severity: "HIGH" })),
      ...overdue.map((task) => ({ taskId: task.id, title: task.title, reason: "OVERDUE", severity: "HIGH" })),
      ...centrality.filter((item) => item.centrality >= 0.25 && !blocked.some((task) => task.id === item.taskId)).slice(0, 5).map((item) => ({ taskId: item.taskId, title: item.title, reason: "HIGH_DEPENDENCY_CENTRALITY", severity: "MEDIUM" })),
    ].slice(0, 20),
    cycleTime: { sampleCount: cycleTimes.length, p50Days: percentile(cycleTimes, 0.5), p85Days: percentile(cycleTimes, 0.85), durationsDays: cycleTimes },
    blockedTime: { sampleCount: blockedTime.length, totalDays: blockedTime.reduce((sum, value) => sum + value, 0), p50Days: percentile(blockedTime, 0.5), p85Days: percentile(blockedTime, 0.85) },
    workload: [...workloadMap.values()].sort((a, b) => b.estimatedDays - a.estimatedDays),
    historicalPatterns: { sampleCount: plannedActual.length, averageVarianceDays: plannedActual.length ? Number((plannedActual.reduce((sum, item) => sum + item.varianceDays, 0) / plannedActual.length).toFixed(1)) : null, plannedActual },
  };
}

