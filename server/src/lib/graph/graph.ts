export interface GraphEdge {
  from: string;
  to: string;
  type?: "FINISH_TO_START" | "START_TO_START" | "FINISH_TO_FINISH" | "START_TO_FINISH";
}

export interface DirectedGraph {
  nodes: string[];
  outgoing: Map<string, string[]>;
  incoming: Map<string, string[]>;
  edges: GraphEdge[];
}

export function buildGraph(nodes: Iterable<string>, edges: Iterable<GraphEdge>): DirectedGraph {
  const all = new Set(nodes);
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  for (const id of all) { outgoing.set(id, []); incoming.set(id, []); }
  const normalizedEdges: GraphEdge[] = [];
  for (const edge of edges) {
    const { from, to } = edge;
    all.add(from); all.add(to);
    if (!outgoing.has(from)) outgoing.set(from, []);
    if (!outgoing.has(to)) outgoing.set(to, []);
    if (!incoming.has(from)) incoming.set(from, []);
    if (!incoming.has(to)) incoming.set(to, []);
    outgoing.get(from)!.push(to);
    incoming.get(to)!.push(from);
    normalizedEdges.push(edge);
  }
  for (const list of [...outgoing.values(), ...incoming.values()]) list.sort();
  return { nodes: [...all].sort(), outgoing, incoming, edges: normalizedEdges };
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

function traverseDepthFirst(graph: DirectedGraph, start: string, adjacency: Map<string, string[]>): string[] {
  if (!graph.outgoing.has(start)) return [];
  const visited = new Set<string>([start]);
  const result: string[] = [];
  const stack = [...(adjacency.get(start) ?? [])].reverse();
  while (stack.length) {
    const id = stack.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);
    result.push(id);
    const next = adjacency.get(id) ?? [];
    for (let index = next.length - 1; index >= 0; index -= 1) stack.push(next[index]!);
  }
  return result;
}

export const depthFirstDescendants = (graph: DirectedGraph, id: string) => traverseDepthFirst(graph, id, graph.outgoing);
export const depthFirstAncestors = (graph: DirectedGraph, id: string) => traverseDepthFirst(graph, id, graph.incoming);

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
  const lag = (type: GraphEdge["type"], from: string, to: string) => {
    switch (type ?? "FINISH_TO_START") {
      case "START_TO_START": return 0;
      case "FINISH_TO_FINISH": return length(from) - length(to);
      case "START_TO_FINISH": return -length(to);
      default: return length(from);
    }
  };
  const incomingEdges = new Map<string, GraphEdge[]>();
  const outgoingEdges = new Map<string, GraphEdge[]>();
  for (const edge of graph.edges) {
    incomingEdges.set(edge.to, [...(incomingEdges.get(edge.to) ?? []), edge]);
    outgoingEdges.set(edge.from, [...(outgoingEdges.get(edge.from) ?? []), edge]);
  }
  const earliestStart = new Map<string, number>();
  const earliestFinish: Record<string, number> = {};
  for (const id of order) {
    const start = Math.max(0, ...((incomingEdges.get(id) ?? []).map((edge) => (earliestStart.get(edge.from) ?? 0) + lag(edge.type, edge.from, id))));
    earliestStart.set(id, start);
    earliestFinish[id] = start + length(id);
  }
  const duration = Math.max(0, ...Object.values(earliestFinish));
  const latestStart = new Map<string, number>();
  const slack: Record<string, number> = {};
  for (const id of [...order].reverse()) {
    const successors = outgoingEdges.get(id) ?? [];
    const start = Math.min(
      duration - length(id),
      ...(successors.map((edge) => latestStart.get(edge.to)! - lag(edge.type, id, edge.to))),
    );
    latestStart.set(id, start);
    slack[id] = Math.max(0, start - (earliestStart.get(id) ?? 0));
  }
  return { duration, criticalTaskIds: order.filter((id) => slack[id] === 0), earliestFinish, slack };
}
