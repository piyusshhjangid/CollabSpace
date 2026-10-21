import { describe, expect, it } from "vitest";
import { ancestors, buildGraph, criticalPath, depthFirstDescendants, descendants, topologicalSort } from "../src/lib/graph/graph.js";

describe("execution graph algorithms", () => {
  const graph = buildGraph(["a", "b", "c", "d", "e", "f"], [
    { from: "a", to: "c" }, { from: "b", to: "c" }, { from: "c", to: "d" },
    { from: "b", to: "e" }, { from: "e", to: "f" },
  ]);
  it("finds ancestors and descendants without including the start node", () => {
    expect(ancestors(graph, "d")).toEqual(["c", "a", "b"]);
    expect(descendants(graph, "b")).toEqual(["c", "e", "d", "f"]);
    expect(depthFirstDescendants(graph, "b")).toEqual(["c", "d", "e", "f"]);
    expect(descendants(graph, "missing")).toEqual([]);
  });
  it("returns a stable topological ordering and reports cycles", () => {
    const result = topologicalSort(graph);
    expect(result.cyclicNodes).toEqual([]);
    expect(result.order.indexOf("a")).toBeLessThan(result.order.indexOf("c"));
    expect(topologicalSort(buildGraph(["a", "b", "c"], [
      { from: "a", to: "b" }, { from: "b", to: "c" }, { from: "c", to: "a" },
    ])).cyclicNodes).toEqual(["a", "b", "c"]);
  });
  it("computes critical path duration and slack from planned durations", () => {
    const result = criticalPath(graph, { a: 2, b: 1, c: 3, d: 1, e: 2, f: 1 });
    expect(result.duration).toBe(6);
    expect(result.criticalTaskIds).toEqual(["a", "c", "d"]);
    expect(result.slack.a).toBe(0);
  });
  it("applies non finish-to-start dependency timing rules", () => {
    const graph = buildGraph(["review", "release"], [{ from: "review", to: "release", type: "FINISH_TO_FINISH" }]);
    const result = criticalPath(graph, { review: 3, release: 1 });
    expect(result.duration).toBe(3);
    expect(result.earliestFinish.release).toBe(3);
    expect(result.criticalTaskIds).toEqual(["review", "release"]);
  });
});
