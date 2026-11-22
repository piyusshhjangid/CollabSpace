import { ancestors, buildGraph, criticalPath, descendants, topologicalSort, type GraphEdge } from "./graph/graph.js";

export interface ScenarioChanges {
  taskDelays?: Record<string, number>;
  unavailableAssigneeIds?: string[];
  unavailableDays?: number;
  reassignTasks?: Array<{ taskId: string; assigneeId: string }>;
  excludedTaskIds?: string[];
  removeWithDependents?: boolean;
  addDependencies?: Array<{ from: string; to: string }>;
  removeDependencies?: Array<{ from: string; to: string }>;
  deadline?: string | null;
}

export interface SimulationTask {
  id: string;
  title: string;
  status: string;
  assignedTo: string | null;
  durationDays: number;
}

function addBusinessDays(start: Date, days: number) {
  const date = new Date(start);
  let remaining = Math.max(0, Math.ceil(days));
  while (remaining) {
    date.setUTCDate(date.getUTCDate() + 1);
    if (date.getUTCDay() !== 0 && date.getUTCDay() !== 6) remaining--;
  }
  return date;
}

export function simulateScenario(input: {
  tasks: SimulationTask[];
  edges: GraphEdge[];
  changes: ScenarioChanges;
  startDate?: Date;
  existingDeadline?: Date | null;
}) {
  const startDate = input.startDate ?? new Date();
  const taskIds = new Set(input.tasks.map((task) => task.id));
  const changes = input.changes;
  for (const id of [...Object.keys(changes.taskDelays ?? {}), ...(changes.excludedTaskIds ?? [])]) {
    if (!taskIds.has(id)) throw new Error("Scenario references a task outside this project");
  }
  for (const change of changes.reassignTasks ?? []) if (!taskIds.has(change.taskId)) throw new Error("Scenario references a task outside this project");
  const unavailable = new Set(changes.unavailableAssigneeIds ?? []);
  const originalGraph = buildGraph(taskIds, input.edges);
  const originalOrder = topologicalSort(originalGraph);
  if (originalOrder.cyclicNodes.length) throw new Error("Project dependency graph contains a cycle");
  const originalDurations = Object.fromEntries(input.tasks.map((task) => [task.id, Math.max(1, task.durationDays)]));
  const baseline = criticalPath(originalGraph, originalDurations);

  const excluded = new Set(changes.excludedTaskIds ?? []);
  if (changes.removeWithDependents) {
    for (const taskId of [...excluded]) for (const downstream of descendants(originalGraph, taskId)) excluded.add(downstream);
  }
  if (excluded.size === taskIds.size) throw new Error("A scenario must keep at least one task in scope");
  const tasks = input.tasks.filter((task) => !excluded.has(task.id));
  let edges = input.edges.filter((edge) => !excluded.has(edge.from) && !excluded.has(edge.to));
  for (const removal of changes.removeDependencies ?? []) edges = edges.filter((edge) => !(edge.from === removal.from && edge.to === removal.to));
  for (const addition of changes.addDependencies ?? []) {
    if (!taskIds.has(addition.from) || !taskIds.has(addition.to) || excluded.has(addition.from) || excluded.has(addition.to)) throw new Error("Scenario dependency endpoints must be in scope for this project");
    if (addition.from === addition.to) throw new Error("A task cannot depend on itself");
    if (!edges.some((edge) => edge.from === addition.from && edge.to === addition.to)) edges = [...edges, { from: addition.from, to: addition.to, type: "FINISH_TO_START" }];
  }

  const graph = buildGraph(tasks.map((task) => task.id), edges);
  const sort = topologicalSort(graph);
  if (sort.cyclicNodes.length) throw new Error("These changes would create a dependency cycle");
  const unavailableDays = Math.min(90, Math.max(0, Math.ceil(changes.unavailableDays ?? 0)));
  const delays = changes.taskDelays ?? {};
  const durations: Record<string, number> = {};
  for (const task of tasks) {
    const userDelay = Math.min(365, Math.max(0, Math.ceil(delays[task.id] ?? 0)));
    const capacityDelay = task.assignedTo && unavailable.has(task.assignedTo) ? unavailableDays : 0;
    durations[task.id] = Math.max(1, task.durationDays + userDelay + capacityDelay);
  }
  const result = criticalPath(graph, durations);
  const finishDate = addBusinessDays(startDate, result.duration);
  const baselineFinish = addBusinessDays(startDate, baseline.duration);
  const deadline = changes.deadline === undefined ? (input.existingDeadline ?? null) : changes.deadline ? new Date(`${changes.deadline}T00:00:00.000Z`) : null;
  const reassignments = new Map((changes.reassignTasks ?? []).map((change) => [change.taskId, change.assigneeId]));
  const effectiveTasks = tasks.map((task) => ({ ...task, assignedTo: reassignments.get(task.id) ?? task.assignedTo }));
  const workloadByPerson = (items: SimulationTask[]) => {
    const counts = new Map<string, number>();
    for (const task of items) if (!task.status.toUpperCase().includes("DONE") && task.assignedTo) counts.set(task.assignedTo, (counts.get(task.assignedTo) ?? 0) + 1);
    const values = [...counts.values()];
    return { openTasksByAssignee: Object.fromEntries([...counts.entries()].sort(([a], [b]) => a.localeCompare(b))), spread: values.length ? Math.max(...values) - Math.min(...values) : 0 };
  };
  const affected = tasks.map((task) => ({
    taskId: task.id,
    title: task.title,
    assigneeId: reassignments.get(task.id) ?? task.assignedTo,
    durationDays: durations[task.id]!,
    delayDays: durations[task.id]! - originalDurations[task.id]!,
    critical: result.criticalTaskIds.includes(task.id),
    slackDays: result.slack[task.id] ?? 0,
    upstreamTaskCount: ancestors(graph, task.id).length,
    downstreamTaskCount: descendants(graph, task.id).length,
  })).sort((a, b) => Number(b.critical) - Number(a.critical) || b.delayDays - a.delayDays);
  const delayDays = result.duration - baseline.duration;
  const daysUntilDeadline = deadline ? Math.ceil((deadline.getTime() - finishDate.getTime()) / 86_400_000) : null;
  return {
    engine: "deterministic-cpm-v1",
    simulatedAt: startDate.toISOString(),
    baseline: { durationDays: baseline.duration, finishDate: baselineFinish.toISOString(), criticalTaskIds: baseline.criticalTaskIds },
    scenario: { durationDays: result.duration, finishDate: finishDate.toISOString(), delayDays, criticalTaskIds: result.criticalTaskIds, deadline: deadline?.toISOString() ?? null, deadlineStatus: deadline ? (finishDate <= deadline ? "ON_TRACK" : "AT_RISK") : "NO_DEADLINE", daysUntilDeadline },
    scope: { taskCount: tasks.length, removedTaskIds: [...excluded], dependencyCount: edges.length },
    workload: { before: workloadByPerson(input.tasks), after: workloadByPerson(effectiveTasks), reassignedTaskIds: [...reassignments.keys()] },
    affectedTasks: affected,
    assumptions: ["Task durations use the latest saved plan or a 3-business-day fallback.", "Capacity changes add the stated unavailable time to tasks assigned to that member; work is not silently reassigned.", "Dates are planning estimates and do not change project data."],
  };
}
