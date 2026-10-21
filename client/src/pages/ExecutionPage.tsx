import { useEffect, useMemo, useState } from "react";
import { Background, Controls, Handle, MiniMap, Position, ReactFlow, type Connection, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { Activity, AlertCircle, ArrowDownRight, ArrowRight, Check, CircleDot, Clock3, GitBranch, Plus, Radio, Save, Target, Trash2 } from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";
import { useProjects } from "../hooks/useProjects";
import { getAccessToken } from "../lib/authSession";
import { addContract, addDependency, addGoal, addMilestone, addOutcome, addPlan, executionKeys, getExecutionGraph, getOutcomes, linkProjectOutcome, removeDependency, type ExecutionGraph } from "../api/execution";
import { projectKeys } from "../hooks/useProjects";

function TaskNode({ data }: { data: { title: string; status: string; critical: boolean; duration: number } }) {
  const done = data.status === "DONE";
  return <div className={`min-w-[195px] rounded-2xl border bg-white px-4 py-3 shadow-sm ${data.critical ? "border-violet-400 ring-2 ring-violet-100" : "border-slate-200"}`}>
    <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border-2 !border-white !bg-slate-400" />
    <div className="flex items-center gap-2">
      <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${done ? "bg-emerald-100 text-emerald-700" : data.critical ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-500"}`}>{done ? <Check size={13} /> : <CircleDot size={13} />}</span>
      <span className="line-clamp-2 text-left text-xs font-semibold leading-4 text-slate-800">{data.title}</span>
    </div>
    <div className="mt-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-slate-400">
      <span>{data.critical ? "Critical path" : data.status.replace("_", " ")}</span><span>{data.duration}d</span>
    </div>
    <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !border-2 !border-white !bg-violet-500" />
  </div>;
}
const nodeTypes = { task: TaskNode };
function apiMessage(error: unknown) { return error instanceof Error ? error.message : "Something went wrong. Please try again."; }
function criteriaList(value: string) { return value.split("\n").map((item) => item.trim()).filter(Boolean); }
function useExecutionMutation<TVariables,>(workspaceId: string, projectId: string, onError: (message: string) => void, fn: (variables: TVariables) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: executionKeys.graph(workspaceId, projectId) });
    void queryClient.invalidateQueries({ queryKey: executionKeys.outcomes(workspaceId) });
  }, onError: (error) => onError(apiMessage(error)) });
}

export default function ExecutionPage() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? "";
  const canWrite = currentWorkspace?.role !== "VIEWER";
  const queryClient = useQueryClient();
  const { data: projects = [] } = useProjects(workspaceId);
  const [projectId, setProjectId] = useState("");
  const [outcomeName, setOutcomeName] = useState("");
  const [outcomeCriteria, setOutcomeCriteria] = useState("");
  const [outcomeDate, setOutcomeDate] = useState("");
  const [goalNames, setGoalNames] = useState<Record<string, string>>({});
  const [milestoneNames, setMilestoneNames] = useState<Record<string, string>>({});
  const [contractDraft, setContractDraft] = useState<Record<string, { scope: string; criteria: string; deadline: string }>>({});
  const [notice, setNotice] = useState("");
  const [live, setLive] = useState(false);

  useEffect(() => { if (!projectId && projects[0]) setProjectId(projects[0].id); }, [projectId, projects]);
  const graphQuery = useQuery({ queryKey: executionKeys.graph(workspaceId, projectId), queryFn: () => getExecutionGraph(workspaceId, projectId), enabled: Boolean(projectId) });
  const outcomesQuery = useQuery({ queryKey: executionKeys.outcomes(workspaceId), queryFn: () => getOutcomes(workspaceId) });
  const outcomes = outcomesQuery.data ?? [];
  const selectedProject = projects.find((project) => project.id === projectId);
  const graph = graphQuery.data;
  const createOutcome = useExecutionMutation(workspaceId, projectId, setNotice, (body: unknown) => addOutcome(workspaceId, body));
  const createGoal = useExecutionMutation(workspaceId, projectId, setNotice, (input: { outcomeId: string; name: string }) => addGoal(workspaceId, input.outcomeId, { name: input.name, successCriteria: [] }));
  const createMilestone = useExecutionMutation(workspaceId, projectId, setNotice, (input: { goalId: string; name: string }) => addMilestone(workspaceId, input.goalId, { name: input.name }));
  const createContract = useExecutionMutation(workspaceId, projectId, setNotice, (input: { outcomeId: string; body: unknown }) => addContract(workspaceId, input.outcomeId, input.body));
  const createPlan = useExecutionMutation(workspaceId, projectId, setNotice, (input: { outcomeId: string; body: unknown }) => addPlan(workspaceId, input.outcomeId, input.body));
  const createDependency = useExecutionMutation(workspaceId, projectId, setNotice, (input: { predecessorTaskId: string; successorTaskId: string }) => addDependency(workspaceId, projectId, input));
  const deleteDependency = useExecutionMutation(workspaceId, projectId, setNotice, (dependencyId: string) => removeDependency(workspaceId, projectId, dependencyId));
  const linkOutcome = useMutation({ mutationFn: (outcomeId: string | null) => linkProjectOutcome(workspaceId, projectId, outcomeId), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: projectKeys.workspace(workspaceId) }); void queryClient.invalidateQueries({ queryKey: executionKeys.graph(workspaceId, projectId) }); }, onError: (error) => setNotice(apiMessage(error)) });

  useEffect(() => {
    if (!projectId) return;
    const token = getAccessToken();
    if (!token) return;
    const socket = io(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000", { auth: { token }, reconnection: true, reconnectionAttempts: Infinity, reconnectionDelayMax: 5000 });
    socket.on("connect", () => {
      setLive(true);
      socket.emit("workspace:join", { workspaceId }, (result: { ok: boolean; sequence?: number }) => {
        if (result.ok) void queryClient.invalidateQueries({ queryKey: executionKeys.graph(workspaceId, projectId) });
      });
      void queryClient.invalidateQueries({ queryKey: executionKeys.graph(workspaceId, projectId) });
    });
    socket.on("disconnect", () => setLive(false));
    socket.on("connect_error", () => setLive(false));
    socket.on("execution:event", (event: { sequence: number }) => {
      const current = queryClient.getQueryData<ExecutionGraph>(executionKeys.graph(workspaceId, projectId));
      if (!current || event.sequence !== current.sequence + 1) void queryClient.invalidateQueries({ queryKey: executionKeys.graph(workspaceId, projectId) });
      else void queryClient.invalidateQueries({ queryKey: executionKeys.graph(workspaceId, projectId) });
    });
    return () => { socket.emit("workspace:leave", { workspaceId }); socket.disconnect(); setLive(false); };
  }, [workspaceId, projectId, queryClient]);

  const { nodes, edges } = useMemo(() => {
    if (!graph) return { nodes: [] as Node[], edges: [] as Edge[] };
    const indegree = new Map(graph.tasks.map((task) => [task.id, 0]));
    const outgoing = new Map(graph.tasks.map((task) => [task.id, [] as string[]]));
    for (const edge of graph.edges) { indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1); outgoing.get(edge.from)?.push(edge.to); }
    const layers = new Map(graph.tasks.map((task) => [task.id, 0]));
    const queue = graph.tasks.filter((task) => indegree.get(task.id) === 0).map((task) => task.id);
    for (let i = 0; i < queue.length; i += 1) for (const next of outgoing.get(queue[i]!) ?? []) {
      layers.set(next, Math.max(layers.get(next) ?? 0, (layers.get(queue[i]!) ?? 0) + 1));
      indegree.set(next, (indegree.get(next) ?? 1) - 1);
      if (indegree.get(next) === 0) queue.push(next);
    }
    const rowCounts = new Map<number, number>();
    const nextNodes = graph.tasks.map((task) => {
      const layer = layers.get(task.id) ?? 0;
      const row = rowCounts.get(layer) ?? 0;
      rowCounts.set(layer, row + 1);
      return { id: task.id, type: "task", position: { x: 70 + layer * 285, y: 60 + row * 132 }, data: { title: task.title, status: task.status, critical: graph.criticalPath.criticalTaskIds.includes(task.id), duration: task.durationDays }, draggable: false, connectable: canWrite } as Node;
    });
    const nextEdges = graph.edges.map((edge) => {
      const critical = graph.criticalPath.criticalTaskIds.includes(edge.from) && graph.criticalPath.criticalTaskIds.includes(edge.to);
      return { id: edge.id, source: edge.from, target: edge.to, label: edge.type.replaceAll("_", " "), type: "smoothstep", animated: critical, style: { stroke: critical ? "#7c3aed" : "#a8b3c4", strokeWidth: critical ? 2.5 : 1.5 }, labelStyle: { fill: "#64748b", fontSize: 9 } } as Edge;
    });
    return { nodes: nextNodes, edges: nextEdges };
  }, [graph, canWrite]);

  const onConnect = (connection: Connection) => {
    if (connection.source && connection.target) createDependency.mutate({ predecessorTaskId: connection.source, successorTaskId: connection.target });
  };
  const savePlan = () => {
    if (!graph?.outcomeId || !graph.tasks.length) return;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const tasks = graph.tasks.map((task, index) => {
      const taskStart = new Date(start); taskStart.setDate(start.getDate() + index);
      const taskEnd = new Date(taskStart); taskEnd.setDate(taskStart.getDate() + Math.max(0, task.durationDays - 1));
      return { taskId: task.id, plannedStart: taskStart.toISOString().slice(0, 10), plannedEnd: taskEnd.toISOString().slice(0, 10), durationDays: task.durationDays };
    });
    createPlan.mutate({ outcomeId: graph.outcomeId, body: { tasks } });
  };

  return <div className="mx-auto max-w-[1500px] space-y-7 pb-10">
    <section className="relative overflow-hidden rounded-[28px] bg-slate-950 px-7 py-8 text-white shadow-xl shadow-slate-900/10 sm:px-10">
      <div className="pointer-events-none absolute -right-12 -top-28 h-80 w-80 rounded-full border border-white/10" /><div className="pointer-events-none absolute -right-1 -top-16 h-56 w-56 rounded-full border border-white/10" />
      <div className="relative flex flex-wrap items-end justify-between gap-6">
        <div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[.2em] text-violet-200"><GitBranch size={13}/> Delivery intelligence</div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Execution, connected.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Turn outcomes into a living plan. See the work, dependencies and critical path move together.</p></div>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300"><span className={`h-2 w-2 rounded-full ${live ? "bg-emerald-400 shadow-[0_0_10px_#34d399]" : "bg-slate-500"}`} />{live ? "Live updates on" : "Reconnecting"}</div>
      </div>
      <div className="relative mt-7 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 sm:grid-cols-4">
        <Metric label="Outcomes" value={outcomes.length} icon={<Target size={15}/>} /><Metric label="Graph tasks" value={graph?.tasks.length ?? 0} icon={<CircleDot size={15}/>} /><Metric label="Dependencies" value={graph?.edges.length ?? 0} icon={<GitBranch size={15}/>} /><Metric label="Critical path" value={graph ? `${graph.criticalPath.duration}d` : "—"} icon={<Activity size={15}/>} />
      </div>
    </section>

    {notice && <div role="status" className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><span className="flex items-center gap-2"><AlertCircle size={16}/>{notice}</span><button onClick={() => setNotice("")} className="font-semibold">Dismiss</button></div>}

    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,.8fr)]">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div><div className="flex items-center gap-2"><GitBranch size={17} className="text-violet-600"/><h2 className="font-semibold text-slate-900">Live execution graph</h2></div><p className="mt-1 text-xs text-slate-500">Connect task handles to add dependencies. Violet marks the critical path.</p></div>
          <div className="flex items-center gap-2"><select aria-label="Select project" value={projectId} onChange={(event) => setProjectId(event.target.value)} className="max-w-[190px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"><option value="">Choose project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>
            {canWrite && graph?.outcomeId && <button onClick={savePlan} disabled={createPlan.isPending || !graph.tasks.length} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"><Save size={14}/>{createPlan.isPending ? "Saving…" : "Snapshot plan"}</button>}</div>
        </div>
        {!projects.length ? <Empty title="Create a project first" body="Your execution graph will appear once this workspace has project tasks."/> : graphQuery.isLoading ? <div className="flex h-[360px] items-center justify-center text-sm text-slate-400">Loading execution graph…</div> : graphQuery.isError ? <Empty title="We couldn't load the graph" body={apiMessage(graphQuery.error)}/> : !graph?.tasks.length ? <Empty title="A clear path starts with tasks" body="Add tasks to this project, then connect the work that depends on other work."/> : <div className="h-[440px] bg-[radial-gradient(#cbd5e1_0.75px,transparent_0.75px)] [background-size:18px_18px] sm:h-[540px]"><ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onConnect={onConnect} nodesConnectable={canWrite} nodesDraggable={false} fitView fitViewOptions={{ padding: .22 }} minZoom={.35} maxZoom={1.5} proOptions={{ hideAttribution: true }}><Background color="#94a3b8" gap={18} size={1}/><MiniMap pannable zoomable nodeColor={(node) => (node.data?.critical ? "#8b5cf6" : "#cbd5e1")} className="!rounded-xl !border !border-slate-200 !bg-white"/><Controls className="!overflow-hidden !rounded-xl !border-slate-200 !bg-white !shadow-sm"/></ReactFlow></div>}
        {!!graph?.edges.length && <div className="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-3">{graph.edges.map((edge) => <span key={edge.id} className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px] text-slate-600"><span className="max-w-28 truncate">{graph.tasks.find((task) => task.id === edge.from)?.title}</span><ArrowRight size={12} className="text-violet-500"/><span className="max-w-28 truncate">{graph.tasks.find((task) => task.id === edge.to)?.title}</span>{canWrite && <button title="Remove dependency" onClick={() => deleteDependency.mutate(edge.id)} className="ml-1 rounded p-0.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600"><Trash2 size={12}/></button>}</span>)}</div>}
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between"><div><div className="flex items-center gap-2"><Target size={17} className="text-violet-600"/><h2 className="font-semibold text-slate-900">Delivery outcomes</h2></div><p className="mt-1 text-xs text-slate-500">The result your team is building toward.</p></div><span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">{outcomes.length} tracked</span></div>
          {canWrite && <form className="mb-5 space-y-2.5 rounded-xl bg-slate-50 p-3.5" onSubmit={(event) => { event.preventDefault(); if (!outcomeName.trim()) return; createOutcome.mutate({ name: outcomeName, successCriteria: criteriaList(outcomeCriteria), targetDate: outcomeDate || null }); setOutcomeName(""); setOutcomeCriteria(""); setOutcomeDate(""); }}>
            <input aria-label="Outcome name" value={outcomeName} onChange={(e) => setOutcomeName(e.target.value)} placeholder="e.g. Launch a reliable onboarding flow" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-violet-400" required maxLength={120}/>
            <textarea aria-label="Success criteria" value={outcomeCriteria} onChange={(e) => setOutcomeCriteria(e.target.value)} placeholder="Success criteria, one per line" rows={2} className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-violet-400" />
            <div className="flex gap-2"><input aria-label="Outcome target date" type="date" value={outcomeDate} onChange={(e) => setOutcomeDate(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"/><button disabled={createOutcome.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"><Plus size={14}/>Add outcome</button></div>
          </form>}
          {outcomesQuery.isLoading ? <p className="py-6 text-center text-xs text-slate-400">Loading outcomes…</p> : outcomes.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center"><Target size={22} className="mx-auto text-slate-300"/><p className="mt-2 text-xs font-medium text-slate-600">No outcomes yet</p><p className="mt-1 text-[11px] text-slate-400">Start with a measurable result, then break it into goals.</p></div> : <div className="space-y-3">{outcomes.map((outcome) => {
            const draft = contractDraft[outcome.id] ?? { scope: "", criteria: "", deadline: "" };
            return <article key={outcome.id} className="rounded-xl border border-slate-100 p-3.5 transition hover:border-violet-200">
              <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-slate-800">{outcome.name}</h3>{outcome.target_date && <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-400"><Clock3 size={11}/>Target {new Date(outcome.target_date).toLocaleDateString()}</p>}</div><span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">Outcome</span></div>
              {!!outcome.success_criteria.length && <ul className="mt-2 space-y-1">{outcome.success_criteria.map((criterion) => <li key={criterion} className="flex items-start gap-1.5 text-[11px] leading-4 text-slate-600"><Check size={12} className="mt-0.5 shrink-0 text-emerald-600"/>{criterion}</li>)}</ul>}
              <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">{outcome.goals.map((goal) => <div key={goal.id} className="rounded-lg bg-slate-50 px-3 py-2"><div className="flex items-center gap-2 text-xs font-medium text-slate-700"><ArrowDownRight size={14} className="text-violet-500"/>{goal.name}</div><div className="mt-1.5 space-y-1 pl-5">{goal.milestones.map((milestone) => <div key={milestone.id} className="text-[10px] text-slate-500">· {milestone.name}{milestone.due_date ? ` · ${new Date(milestone.due_date).toLocaleDateString()}` : ""}</div>)}</div>{canWrite && <form className="mt-2 flex gap-1.5" onSubmit={(e) => { e.preventDefault(); const name = milestoneNames[goal.id]?.trim(); if (!name) return; createMilestone.mutate({ goalId: goal.id, name }); setMilestoneNames({ ...milestoneNames, [goal.id]: "" }); }}><input aria-label={`Milestone for ${goal.name}`} value={milestoneNames[goal.id] ?? ""} onChange={(e) => setMilestoneNames({ ...milestoneNames, [goal.id]: e.target.value })} placeholder="Add milestone" className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[10px] outline-none focus:border-violet-400"/><button aria-label="Add milestone" className="rounded-md bg-white px-2 text-slate-500 hover:text-violet-700"><Plus size={14}/></button></form>}</div>)}
                {canWrite && <form className="flex gap-1.5" onSubmit={(e) => { e.preventDefault(); const name = goalNames[outcome.id]?.trim(); if (!name) return; createGoal.mutate({ outcomeId: outcome.id, name }); setGoalNames({ ...goalNames, [outcome.id]: "" }); }}><input aria-label={`Goal for ${outcome.name}`} value={goalNames[outcome.id] ?? ""} onChange={(e) => setGoalNames({ ...goalNames, [outcome.id]: e.target.value })} placeholder="Add a goal" className="min-w-0 flex-1 rounded-md border border-slate-200 px-2.5 py-2 text-[10px] outline-none focus:border-violet-400"/><button className="rounded-md bg-violet-50 px-2.5 text-violet-700 hover:bg-violet-100"><Plus size={14}/></button></form>}
              </div>
              {canWrite && <details className="mt-3"><summary className="cursor-pointer text-[10px] font-semibold text-violet-700">{outcome.delivery_contracts[0] ? `Baseline v${outcome.delivery_contracts[0].version}` : "Set delivery baseline"}</summary><form className="mt-2 space-y-2 rounded-lg bg-violet-50/60 p-2.5" onSubmit={(e) => { e.preventDefault(); if (!draft.scope.trim()) return; createContract.mutate({ outcomeId: outcome.id, body: { scope: draft.scope, acceptanceCriteria: criteriaList(draft.criteria), deadline: draft.deadline || null } }); setContractDraft({ ...contractDraft, [outcome.id]: { scope: "", criteria: "", deadline: "" } }); }}><textarea aria-label="Baseline scope" value={draft.scope} onChange={(e) => setContractDraft({ ...contractDraft, [outcome.id]: { ...draft, scope: e.target.value } })} placeholder="Baseline scope" rows={2} className="w-full rounded-md border border-violet-100 bg-white px-2.5 py-2 text-[10px]" required/><textarea aria-label="Baseline acceptance criteria" value={draft.criteria} onChange={(e) => setContractDraft({ ...contractDraft, [outcome.id]: { ...draft, criteria: e.target.value } })} placeholder="Acceptance criteria, one per line" rows={2} className="w-full rounded-md border border-violet-100 bg-white px-2.5 py-2 text-[10px]" required/><div className="flex items-center justify-between gap-2"><input aria-label="Baseline deadline" type="date" value={draft.deadline} onChange={(e) => setContractDraft({ ...contractDraft, [outcome.id]: { ...draft, deadline: e.target.value } })} className="rounded-md border border-violet-100 bg-white px-2 py-1.5 text-[10px]"/><button className="rounded-md bg-violet-700 px-2.5 py-1.5 text-[10px] font-semibold text-white">Save version</button></div></form></details>}
              {outcome.delivery_contracts[0] && <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-slate-500">Latest baseline: {outcome.delivery_contracts[0].scope}</p>}
              {outcome.execution_plans[0] && <p className="mt-1 text-[10px] text-slate-400">Plan v{outcome.execution_plans[0].version} saved {new Date(outcome.execution_plans[0].created_at).toLocaleDateString()}</p>}
            </article>;
          })}</div>}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-2"><Radio size={16} className="text-emerald-600"/><h2 className="text-sm font-semibold text-slate-900">Event stream</h2></div><p className="mt-1 text-xs leading-5 text-slate-500">REST stays authoritative. Live events carry sequence numbers; reconnects and sequence gaps trigger a fresh graph read.</p><div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-[10px] text-slate-500"><span>Workspace sequence</span><span className="font-mono font-semibold text-slate-700">{graph?.sequence ?? 0}</span></div>{selectedProject && canWrite && <label className="mt-3 block text-[10px] font-semibold text-slate-500">Project outcome<select aria-label="Link project to outcome" value={selectedProject.outcomeId ?? ""} onChange={(event) => linkOutcome.mutate(event.target.value || null)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"><option value="">No outcome linked</option>{outcomes.map((outcome) => <option key={outcome.id} value={outcome.id}>{outcome.name}</option>)}</select></label>}<p className="mt-2 text-[10px] text-slate-400">{selectedProject?.outcomeId ? "Linked projects can save versioned execution plan baselines." : "Link this project to an outcome to save execution plan baselines."}</p></div>
      </div>
    </section>
  </div>;
}

function Metric({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) { return <div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-violet-200">{icon}</span><div><p className="text-lg font-semibold leading-5">{value}</p><p className="mt-0.5 text-[10px] font-medium text-slate-400">{label}</p></div></div>; }
function Empty({ title, body }: { title: string; body: string }) { return <div className="flex h-[360px] flex-col items-center justify-center px-6 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600"><GitBranch size={22}/></span><h3 className="mt-4 text-sm font-semibold text-slate-800">{title}</h3><p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">{body}</p></div>; }
