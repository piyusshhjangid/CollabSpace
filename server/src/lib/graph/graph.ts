export interface GraphEdge {
  from: string;
  to: string;
}

export interface DirectedGraph {
  nodes: string[];
  outgoing: Map<string, string[]>;
  incoming: Map<string, string[]>;
}

export function buildGraph(nodes: Iterable<string>, edges: Iterable<GraphEdge>): DirectedGraph {
  const all = new Set(nodes);
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  for (const id of all) { outgoing.set(id, []); incoming.set(id, []); }
  for (const { from, to } of edges) {
    all.add(from); all.add(to);
    if (!outgoing.has(from)) outgoing.set(from, []);
    if (!outgoing.has(to)) outgoing.set(to, []);
    if (!incoming.has(from)) incoming.set(from, []);
    if (!incoming.has(to)) incoming.set(to, []);
    outgoing.get(from)!.push(to);
    incoming.get(to)!.push(from);
  }
  for (const list of [...outgoing.values(), ...incoming.values()]) list.sort();
  return { nodes: [...all].sort(), outgoing, incoming };
}

function traverse(graph: DirectedGraph, start: string, adjacency: Map<string, string[]>): string[] {
  if (!graph.outgoing.has(start)) return [];
  const visited = new Set<string>();
  const queue = [start];
  for (let head = 0; head < queue.length; head += 1) {
    for (const next of adjacency.get(queue[head]!) ?? []) {
      if (!visited.has(next)) { visited.add(next); queue.push(next); }
    }
  }
  visited.delete(start);
  return queue.filter((id) => id !== start);
}

export const descendants = (graph: DirectedGraph, id: string) => traverse(graph, id, graph.outgoing);
export const ancestors = (graph: DirectedGraph, id: string) => traverse(graph, id, graph.incoming);

export function topologicalSort(graph: DirectedGraph): { order: string[]; cyclicNodes: string[] } {
  const degree = new Map(graph.nodes.map((id) => [id, graph.incoming.get(id)?.length ?? 0]));
  const ready = graph.nodes.filter((id) => degree.get(id) === 0);
  const order: string[] = [];
  for (let head = 0; head < ready.length; head += 1) {
    const id = ready[head]!;
    order.push(id);
    for (const next of graph.outgoing.get(id) ?? []) {
      const remaining = degree.get(next)! - 1;
      degree.set(next, remaining);
      if (remaining === 0) ready.push(next);
    }
  }
  return { order, cyclicNodes: graph.nodes.filter((id) => (degree.get(id) ?? 0) > 0) };
}

export interface CriticalPathResult {
  duration: number;
  criticalTaskIds: string[];
  earliestFinish: Record<string, number>;
  slack: Record<string, number>;
}

export function criticalPath(graph: DirectedGraph, durations: Record<string, number>): CriticalPathResult {
  const { order, cyclicNodes } = topologicalSort(graph);
  if (cyclicNodes.length) throw new Error(`Critical path requires a DAG; cycle includes: ${cyclicNodes.join(", ")}`);
  const length = (id: string) => Math.max(0, durations[id] ?? 1);
  const earliestStart = new Map<string, number>();
  const earliestFinish: Record<string, number> = {};
  for (const id of order) {
    const start = Math.max(0, ...((graph.incoming.get(id) ?? []).map((p) => earliestFinish[p] ?? 0)));
    earliestStart.set(id, start);
    earliestFinish[id] = start + length(id);
  }
  const duration = Math.max(0, ...Object.values(earliestFinish));
  const latestFinish = new Map<string, number>();
  const slack: Record<string, number> = {};
  for (const id of [...order].reverse()) {
    const successors = graph.outgoing.get(id) ?? [];
    const finish = successors.length ? Math.min(...successors.map((next) => latestFinish.get(next)!)) : duration;
    latestFinish.set(id, finish);
    slack[id] = Math.max(0, finish - length(id) - (earliestStart.get(id) ?? 0));
  }
  return { duration, criticalTaskIds: order.filter((id) => slack[id] === 0), earliestFinish, slack };
}
