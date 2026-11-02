import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Background, Controls, Handle, MarkerType, Position, ReactFlow, useNodesState, type Connection, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { AlertCircle, ArrowDownRight, ArrowRight, Check, CircleDot, Clock3, GitBranch, Plus, Save, Target, Trash2 } from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";
import { API_BASE_URL } from "../lib/api";
import { useProjects } from "../hooks/useProjects";
import { getAccessToken } from "../lib/authSession";
import { addContract, addDependency, addGoal, addMilestone, addOutcome, addPlan, executionKeys, getExecutionGraph, getOutcomes, linkProjectOutcome, removeDependency, type ExecutionGraph } from "../api/execution";
import { projectKeys } from "../hooks/useProjects";

function TaskNode({ data }: { data: { title: string; status: string; critical: boolean; duration: number } }) {
  const done = data.status === "DONE";
  return <div className={`min-w-[195px] rounded-2xl border bg-white px-4 py-3 shadow-sm ${data.critical ? "border-violet-400 ring-2 ring-violet-100" : "border-slate-200"}`}>
    <Handle type="target" position={Position.Left} title="This task depends on the task connected here" className="!h-4 !w-4 !border-[3px] !border-white !bg-slate-400 !shadow-sm transition-transform hover:!scale-125" />
    <div className="flex items-center gap-2">
      <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${done ? "bg-emerald-100 text-emerald-700" : data.critical ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-500"}`}>{done ? <Check size={13} /> : <CircleDot size={13} />}</span>
      <span className="line-clamp-2 text-left text-xs font-semibold leading-4 text-slate-800">{data.title}</span>
    </div>
    <div className="mt-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-slate-400">
      <span>{data.critical ? "Critical path" : data.status.replace("_", " ")}</span><span>{data.duration}d</span>
    </div>
    <Handle type="source" position={Position.Right} title="Connect this task to a task that follows it" className="!h-4 !w-4 !border-[3px] !border-white !bg-violet-500 !shadow-sm transition-transform hover:!scale-125" />
  </div>;
}
const nodeTypes = { task: TaskNode };
function apiMessage(error: unknown) { return error instanceof Error ? error.message : "Something went wrong. Please try again."; }
function dependencyLabel(type: string) {
  const labels: Record<string, string> = { FINISH_TO_START: "Finish → Start", START_TO_START: "Start → Start", FINISH_TO_FINISH: "Finish → Finish", START_TO_FINISH: "Start → Finish" };
  return labels[type] ?? type.replaceAll("_", " ");
}
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
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedProjectId = searchParams.get("projectId");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const projectId = (projects.some((project) => project.id === requestedProjectId) ? requestedProjectId : selectedProjectId) || projects[0]?.id || "";
  const [outcomeName, setOutcomeName] = useState("");
  const [goalNames, setGoalNames] = useState<Record<string, string>>({});
  const [milestoneNames, setMilestoneNames] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [live, setLive] = useState(false);
  const [onlineMembers, setOnlineMembers] = useState(0);

  const graphQuery = useQuery({ queryKey: executionKeys.graph(workspaceId, projectId), queryFn: () => getExecutionGraph(workspaceId, projectId), enabled: Boolean(projectId) });
  const outcomesQuery = useQuery({ queryKey: executionKeys.outcomes(workspaceId), queryFn: () => getOutcomes(workspaceId) });
  const outcomes = outcomesQuery.data ?? [];
  const selectedProject = projects.find((project) => project.id === projectId);
  const selectedOutcome = outcomes.find((outcome) => outcome.id === selectedProject?.outcomeId);
  const graph = graphQuery.data;
  const createOutcome = useMutation({
    mutationFn: async (body: { name: string }) => {
      const outcome = await addOutcome(workspaceId, body);
      await linkProjectOutcome(workspaceId, projectId, outcome.id);
      return outcome;
    },
    onSuccess: async () => {
      setNotice("Outcome added to this project.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: executionKeys.graph(workspaceId, projectId) }),
        queryClient.invalidateQueries({ queryKey: executionKeys.outcomes(workspaceId) }),
        queryClient.invalidateQueries({ queryKey: projectKeys.workspace(workspaceId) }),
      ]);
    },
    onError: (error) => setNotice(apiMessage(error)),
  });
  const createGoal = useExecutionMutation(workspaceId, projectId, setNotice, (input: { outcomeId: string; name: string }) => addGoal(workspaceId, input.outcomeId, { name: input.name, successCriteria: [] }));
  const createMilestone = useExecutionMutation(workspaceId, projectId, setNotice, (input: { goalId: string; name: string }) => addMilestone(workspaceId, input.goalId, { name: input.name }));
  const createPlan = useMutation({
    mutationFn: async (input: { outcomeId: string; body: unknown }) => {
      const outcome = outcomes.find((item) => item.id === input.outcomeId);
      if (!outcome) throw new Error("Choose an outcome for this project first.");
      if (!outcome.delivery_contracts.length) {
        await addContract(workspaceId, outcome.id, {
          scope: outcome.name,
          acceptanceCriteria: outcome.success_criteria.length ? outcome.success_criteria : [`Plan for ${outcome.name}`],
          deadline: outcome.target_date,
        });
      }
      return addPlan(workspaceId, outcome.id, input.body);
    },
    onSuccess: async () => {
      setNotice("Plan saved.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: executionKeys.graph(workspaceId, projectId) }),
        queryClient.invalidateQueries({ queryKey: executionKeys.outcomes(workspaceId) }),
      ]);
    },
    onError: (error) => setNotice(apiMessage(error)),
  });
  const createDependency = useMutation({
    mutationFn: (input: { predecessorTaskId: string; successorTaskId: string; dependencyType: string }) => addDependency(workspaceId, projectId, input),
    onSuccess: async () => {
      setNotice("Connection added. The arrow points to the task that depends on the first.");
      await queryClient.invalidateQueries({ queryKey: executionKeys.graph(workspaceId, projectId) });
    },
    onError: (error) => setNotice(apiMessage(error)),
  });
  const deleteDependency = useExecutionMutation(workspaceId, projectId, setNotice, (dependencyId: string) => removeDependency(workspaceId, projectId, dependencyId));
  const linkOutcome = useMutation({ mutationFn: (outcomeId: string | null) => linkProjectOutcome(workspaceId, projectId, outcomeId), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: projectKeys.workspace(workspaceId) }); void queryClient.invalidateQueries({ queryKey: executionKeys.graph(workspaceId, projectId) }); }, onError: (error) => setNotice(apiMessage(error)) });

  useEffect(() => {
    if (!projectId) return;
    const token = getAccessToken();
    if (!token) return;
    const socket = io(API_BASE_URL, { auth: { token }, reconnection: true, reconnectionAttempts: Infinity, reconnectionDelayMax: 5000 });
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    socket.on("connect", () => {
      setLive(true);
      socket.emit("workspace:join", { workspaceId }, (result: { ok: boolean; sequence?: number }) => {
        if (result.ok) {
          void queryClient.invalidateQueries({ queryKey: executionKeys.graph(workspaceId, projectId) });
          if (heartbeat) clearInterval(heartbeat);
          heartbeat = setInterval(() => socket.emit("presence:heartbeat", { workspaceId }), 10_000);
          socket.emit("presence:heartbeat", { workspaceId });
        }
      });
      void queryClient.invalidateQueries({ queryKey: executionKeys.graph(workspaceId, projectId) });
    });
    socket.on("disconnect", () => setLive(false));
    socket.on("connect_error", () => setLive(false));
    socket.on("workspace:presence", (presence: { workspaceId: string; userIds: string[] }) => {
      if (presence.workspaceId === workspaceId) setOnlineMembers(presence.userIds.length);
    });
    socket.on("execution:event", (event: { sequence: number }) => {
      const current = queryClient.getQueryData<ExecutionGraph>(executionKeys.graph(workspaceId, projectId));
      if (!current || event.sequence !== current.sequence) void queryClient.invalidateQueries({ queryKey: executionKeys.graph(workspaceId, projectId) });
    });
    return () => { if (heartbeat) clearInterval(heartbeat); socket.emit("workspace:leave", { workspaceId }); socket.disconnect(); setLive(false); setOnlineMembers(0); };
  }, [workspaceId, projectId, queryClient]);

  const { layoutNodes, edges } = useMemo(() => {
    if (!graph) return { layoutNodes: [] as Node[], edges: [] as Edge[] };
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
      return { id: task.id, type: "task", position: { x: 70 + layer * 285, y: 60 + row * 132 }, data: { title: task.title, status: task.status, critical: graph.criticalPath.criticalTaskIds.includes(task.id), duration: task.durationDays }, draggable: canWrite, connectable: canWrite } as Node;
    });
    const nextEdges = graph.edges.map((edge) => {
      const critical = graph.criticalPath.criticalTaskIds.includes(edge.from) && graph.criticalPath.criticalTaskIds.includes(edge.to);
      return { id: edge.id, source: edge.from, target: edge.to, label: dependencyLabel(edge.type), type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed, color: critical ? "var(--cs-flow-critical)" : "var(--cs-flow-link)" }, animated: critical, interactionWidth: 18, style: { stroke: critical ? "var(--cs-flow-critical)" : "var(--cs-flow-link)", strokeWidth: critical ? 2.5 : 1.8 }, labelShowBg: true, labelBgStyle: { fill: "var(--cs-flow-label-bg)", fillOpacity: .96 }, labelBgPadding: [6, 3], labelBgBorderRadius: 5, labelStyle: { fill: "var(--cs-flow-label)", fontSize: 10, fontWeight: 600 } } as Edge;
    });
    return { layoutNodes: nextNodes, edges: nextEdges };
  }, [graph, canWrite]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  useEffect(() => {
    setNodes((currentNodes) => {
      const positions = new Map(currentNodes.map((node) => [node.id, node.position]));
      return layoutNodes.map((node) => ({ ...node, position: positions.get(node.id) ?? node.position }));
    });
  }, [layoutNodes, setNodes]);

  const onConnect = (connection: Connection) => {
    if (connection.source && connection.target) createDependency.mutate({ predecessorTaskId: connection.source, successorTaskId: connection.target, dependencyType: "FINISH_TO_START" });
  };
  const isValidConnection = (connection: Edge | Connection) => Boolean(
    connection.source && connection.target && connection.source !== connection.target &&
    !graph?.edges.some((edge) => edge.from === connection.source && edge.to === connection.target),
  );
  const savePlan = () => {
    if (!graph?.outcomeId || !graph.tasks.length) return;
    const today = new Date();
    const dateAtOffset = (offset: number) => new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + offset)).toISOString().slice(0, 10);
    const taskById = new Map(graph.tasks.map((task) => [task.id, task]));
    const startOffsetByTask = new Map<string, number>();
    const finishOffset = new Map<string, number>();
    const tasks = graph.executionOrder.flatMap((taskId) => {
      const task = taskById.get(taskId);
      if (!task) return [];
      const duration = Math.max(1, task.durationDays);
      const startOffset = Math.max(0, ...graph.edges.filter((edge) => edge.to === taskId).map((edge) => {
        const predecessorStart = startOffsetByTask.get(edge.from) ?? 0;
        const predecessorFinish = finishOffset.get(edge.from) ?? 0;
        if (edge.type === "START_TO_START") return predecessorStart;
        if (edge.type === "FINISH_TO_FINISH") return predecessorFinish - duration;
        if (edge.type === "START_TO_FINISH") return predecessorStart - duration;
        return predecessorFinish;
      }));
      const finish = startOffset + duration;
      startOffsetByTask.set(taskId, startOffset);
      finishOffset.set(taskId, finish);
      return [{ taskId, plannedStart: dateAtOffset(startOffset), plannedEnd: dateAtOffset(finish - 1), durationDays: duration }];
    });
    createPlan.mutate({ outcomeId: graph.outcomeId, body: { tasks } });
  };

  return <div className="mx-auto max-w-[1500px] space-y-5 pb-10">
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-950 px-6 py-5 text-white shadow-sm">
      <div><h1 className="text-2xl font-semibold tracking-tight">Execution</h1><p className="mt-1 text-sm text-slate-300">Arrange tasks, connect them, and save a plan.</p></div>
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300"><span className={`h-2 w-2 rounded-full ${live ? "bg-emerald-400 shadow-[0_0_10px_#34d399]" : "bg-slate-500"}`} />{live ? `${onlineMembers} online` : "Connecting…"}</div>
    </section>

    {notice && <div role="status" className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><span className="flex items-center gap-2"><AlertCircle size={16}/>{notice}</span><button onClick={() => setNotice("")} className="font-semibold">Dismiss</button></div>}

    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,.8fr)]">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div><div className="flex items-center gap-2"><GitBranch size={17} className="text-violet-600"/><h2 className="font-semibold text-slate-900">Task map</h2></div><p className="mt-1 text-xs text-slate-500">Move tasks around and connect their dots to show what depends on what.</p></div>
          <label className="text-[10px] font-semibold text-slate-500">Project<select aria-label="Select project" value={projectId} onChange={(event) => { setSelectedProjectId(event.target.value); setSearchParams({ projectId: event.target.value }); }} className="mt-1 block max-w-[190px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"><option value="">Choose project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-slate-100 bg-violet-50/60 px-5 py-3.5 text-xs text-slate-700 sm:px-6"><span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-violet-500 ring-2 ring-white"/>Drag from the purple dot on the earlier task</span><ArrowRight size={14} className="hidden text-violet-500 sm:block"/><span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-slate-400 ring-2 ring-white"/>Drop on the gray dot of the task that depends on it</span><span className="w-full text-[11px] text-slate-500">Drag a task card to arrange it. New links use the usual “finish, then start” rule.</span></div>
        {!projects.length ? <Empty title="Create a project first" body="Your execution graph will appear once this workspace has project tasks."/> : graphQuery.isLoading ? <div className="flex h-[360px] items-center justify-center text-sm text-slate-400">Loading task map…</div> : graphQuery.isError ? <Empty title="We couldn't load the map" body={apiMessage(graphQuery.error)}/> : !graph?.tasks.length ? <Empty title="Add tasks to start a plan" body="Create tasks for this project first. Then connect the dots to show their order." action={<Link to="/tasks" className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700">Open My Tasks<ArrowRight size={14}/></Link>}/> : <div className="h-[440px] bg-slate-50 [background-size:18px_18px] sm:h-[540px]" style={{ backgroundImage: "radial-gradient(var(--cs-flow-grid) 0.75px, transparent 0.75px)" }}><ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onConnect={onConnect} isValidConnection={isValidConnection} connectionLineStyle={{ stroke: "var(--cs-flow-critical)", strokeWidth: 2 }} nodesConnectable={canWrite} nodesDraggable={canWrite} fitView fitViewOptions={{ padding: .22 }} minZoom={.35} maxZoom={1.5}><Background color="var(--cs-flow-grid)" gap={18} size={1}/><Controls className="!overflow-hidden !rounded-xl !border-slate-200 !bg-white !shadow-sm"/></ReactFlow></div>}
        {graph && <div className="border-t border-slate-100 px-5 py-4 sm:px-6"><div className="mb-3 flex items-center justify-between"><h3 className="text-xs font-semibold text-slate-800">Connections</h3><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{graph.edges.length}</span></div>{graph.edges.length ? <div className="space-y-2">{graph.edges.map((edge) => <div key={edge.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-xs"><span className="max-w-44 truncate font-medium text-slate-700">{graph.tasks.find((task) => task.id === edge.from)?.title}</span><ArrowRight size={14} className="shrink-0 text-violet-600"/><span className="max-w-44 truncate font-medium text-slate-700">{graph.tasks.find((task) => task.id === edge.to)?.title}</span><span className="rounded-full bg-violet-50 px-2 py-1 text-[10px] font-medium text-violet-700">{dependencyLabel(edge.type)}</span>{canWrite && <button disabled={deleteDependency.isPending} aria-label={`Remove connection from ${graph.tasks.find((task) => task.id === edge.from)?.title ?? "task"} to ${graph.tasks.find((task) => task.id === edge.to)?.title ?? "task"}`} onClick={() => deleteDependency.mutate(edge.id)} className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"><Trash2 size={13}/>{deleteDependency.isPending && deleteDependency.variables === edge.id ? "Removing…" : "Remove"}</button>}</div>)}</div> : <p className="text-xs text-slate-500">No connections yet. Connect task dots to add one.</p>}</div>}
        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><p className="text-xs font-semibold text-slate-800">GitHub is optional</p><p className="mt-1 text-xs leading-5 text-slate-500">Plan tasks now, or connect a repository now or later to bring in pull request and build activity.</p></div><Link to={`/delivery-health${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ""}`} className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-violet-200 hover:text-violet-700">Set up GitHub<ArrowRight size={13}/></Link></div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between"><div><div className="flex items-center gap-2"><Target size={17} className="text-violet-600"/><h2 className="font-semibold text-slate-900">Outcome</h2></div><p className="mt-1 text-xs text-slate-500">What should this project achieve?</p></div><span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">{outcomes.length}</span></div>
          {canWrite && <form className="mb-4 flex gap-2" onSubmit={(event) => { event.preventDefault(); if (!outcomeName.trim()) return; createOutcome.mutate({ name: outcomeName }); setOutcomeName(""); }}>
            <input aria-label="Outcome name" value={outcomeName} onChange={(e) => setOutcomeName(e.target.value)} placeholder="e.g. Launch onboarding" className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-violet-400" required maxLength={120}/>
            <button disabled={createOutcome.isPending} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"><Plus size={14}/>{createOutcome.isPending ? "Adding…" : "Add"}</button>
          </form>}
          {outcomesQuery.isLoading ? <p className="py-6 text-center text-xs text-slate-400">Loading…</p> : outcomes.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center"><p className="text-xs text-slate-500">Add one outcome to organize this project.</p></div> : <div className="space-y-3">{outcomes.map((outcome) => {
            return <article key={outcome.id} className="rounded-xl border border-slate-100 p-3.5 transition hover:border-violet-200">
              <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-slate-800">{outcome.name}</h3>{outcome.target_date && <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-400"><Clock3 size={11}/>{new Date(outcome.target_date).toLocaleDateString()}</p>}</div></div>
              {!!outcome.success_criteria.length && <ul className="mt-2 space-y-1">{outcome.success_criteria.map((criterion) => <li key={criterion} className="flex items-start gap-1.5 text-[11px] leading-4 text-slate-600"><Check size={12} className="mt-0.5 shrink-0 text-emerald-600"/>{criterion}</li>)}</ul>}
              <details className="mt-3 border-t border-slate-100 pt-3"><summary className="cursor-pointer text-xs font-medium text-violet-700">Goals and milestones ({outcome.goals.length})</summary><div className="mt-2 space-y-2">{outcome.goals.map((goal) => <div key={goal.id} className="rounded-lg bg-slate-50 px-3 py-2"><div className="flex items-center gap-2 text-xs font-medium text-slate-700"><ArrowDownRight size={14} className="text-violet-500"/>{goal.name}</div><div className="mt-1.5 space-y-1 pl-5">{goal.milestones.map((milestone) => <div key={milestone.id} className="text-[10px] text-slate-500">{milestone.name}{milestone.due_date ? ` · ${new Date(milestone.due_date).toLocaleDateString()}` : ""}</div>)}</div>{canWrite && <form className="mt-2 flex gap-1.5" onSubmit={(e) => { e.preventDefault(); const name = milestoneNames[goal.id]?.trim(); if (!name) return; createMilestone.mutate({ goalId: goal.id, name }); setMilestoneNames({ ...milestoneNames, [goal.id]: "" }); }}><input aria-label={`Milestone for ${goal.name}`} value={milestoneNames[goal.id] ?? ""} onChange={(e) => setMilestoneNames({ ...milestoneNames, [goal.id]: e.target.value })} placeholder="Add a milestone" className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[10px] outline-none focus:border-violet-400"/><button aria-label="Add milestone" className="rounded-md bg-white px-2 text-slate-500 hover:text-violet-700"><Plus size={14}/></button></form>}</div>)}{canWrite && <form className="flex gap-1.5" onSubmit={(e) => { e.preventDefault(); const name = goalNames[outcome.id]?.trim(); if (!name) return; createGoal.mutate({ outcomeId: outcome.id, name }); setGoalNames({ ...goalNames, [outcome.id]: "" }); }}><input aria-label={`Goal for ${outcome.name}`} value={goalNames[outcome.id] ?? ""} onChange={(e) => setGoalNames({ ...goalNames, [outcome.id]: e.target.value })} placeholder="Add a goal" className="min-w-0 flex-1 rounded-md border border-slate-200 px-2.5 py-2 text-[10px] outline-none focus:border-violet-400"/><button aria-label="Add goal" className="rounded-md bg-violet-50 px-2.5 text-violet-700 hover:bg-violet-100"><Plus size={14}/></button></form>}</div></details>
              {outcome.execution_plans[0] && <p className="mt-2 text-[10px] text-slate-400">Last plan saved {new Date(outcome.execution_plans[0].created_at).toLocaleDateString()}</p>}
            </article>;
          })}</div>}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-2"><Save size={16} className="text-violet-600"/><h2 className="text-sm font-semibold text-slate-900">Project plan</h2></div>{selectedProject && canWrite && <label className="mt-3 block text-xs font-medium text-slate-600">Outcome<select aria-label="Link project to outcome" value={selectedProject.outcomeId ?? ""} onChange={(event) => linkOutcome.mutate(event.target.value || null)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"><option value="">Choose an outcome</option>{outcomes.map((outcome) => <option key={outcome.id} value={outcome.id}>{outcome.name}</option>)}</select></label>}{canWrite && <button onClick={savePlan} disabled={createPlan.isPending || !graph?.tasks.length || !graph.outcomeId} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">{createPlan.isPending ? "Saving…" : "Save plan"}</button>}{canWrite && graph?.tasks.length && graph.outcomeId && <p className="mt-2 text-[11px] text-slate-500">Starts today; task durations set the dates.</p>}{!selectedProject?.outcomeId && <p className="mt-2 text-xs text-slate-500">Choose an outcome to save a plan.</p>}{selectedOutcome?.execution_plans[0] && <p className="mt-2 text-[11px] text-slate-500">Last saved {new Date(selectedOutcome.execution_plans[0].created_at).toLocaleDateString()}</p>}</div>
      </div>
    </section>
  </div>;
}

function Empty({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) { return <div className="flex h-[360px] flex-col items-center justify-center px-6 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600"><GitBranch size={22}/></span><h3 className="mt-4 text-sm font-semibold text-slate-800">{title}</h3><p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">{body}</p>{action && <div className="mt-4">{action}</div>}</div>; }
