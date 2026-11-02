import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, AlertTriangle, ArrowUpRight, Check, CircleHelp, GitBranch, RefreshCw, Sparkles, Target, X } from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";
import { useProjects } from "../hooks/useProjects";
import { addGithubIntegration, analyzeDelivery, decideAIProposal, getAIProposals, getDeliveryHealth, getGithubIntegrations, getTimeline, getTruth, reconcileTruth, removeGithubIntegration, submitAIProposal } from "../api/deliveryHealth";
import type { AIAnalysis } from "../api/deliveryHealth";
import { API_BASE_URL } from "../lib/api";

const dateLabel = (value?: string | null) => value ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "Not set";
const statusLabel = (value: string) => value.toLowerCase().replaceAll("_", " ");
const panel = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const quietButton = "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

export default function DeliveryHealthPage() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? "";
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { data: projects = [] } = useProjects(workspaceId || null);
  const [repository, setRepository] = useState("");
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [notice, setNotice] = useState("");
  const projectId = params.get("projectId") || projects[0]?.id || "";
  const canWrite = currentWorkspace?.role !== "VIEWER";
  const canManageIntegrations = currentWorkspace?.role === "OWNER" || currentWorkspace?.role === "ADMIN";

  useEffect(() => {
    if (!params.get("projectId") && projects[0]) setParams({ projectId: projects[0].id }, { replace: true });
  }, [params, projects, setParams]);

  const health = useQuery({ queryKey: ["delivery-health", workspaceId, projectId], queryFn: () => getDeliveryHealth(workspaceId, projectId), enabled: Boolean(workspaceId && projectId) });
  const truth = useQuery({ queryKey: ["delivery-truth", workspaceId, projectId], queryFn: () => getTruth(workspaceId, projectId), enabled: Boolean(workspaceId && projectId) });
  const timeline = useQuery({ queryKey: ["execution-timeline", workspaceId, projectId], queryFn: () => getTimeline(workspaceId, projectId), enabled: Boolean(workspaceId && projectId) });
  const proposals = useQuery({ queryKey: ["ai-proposals", workspaceId, projectId], queryFn: () => getAIProposals(workspaceId, projectId), enabled: Boolean(workspaceId && projectId) });
  const integrations = useQuery({ queryKey: ["github-integrations", workspaceId], queryFn: () => getGithubIntegrations(workspaceId), enabled: Boolean(workspaceId) });

  const refreshInsights = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ["delivery-health", workspaceId, projectId] }),
    queryClient.invalidateQueries({ queryKey: ["delivery-truth", workspaceId, projectId] }),
    queryClient.invalidateQueries({ queryKey: ["execution-timeline", workspaceId, projectId] }),
  ]);
  const reconciliation = useMutation({ mutationFn: () => reconcileTruth(workspaceId, projectId), onSuccess: async ({ updatedTasks }) => { setNotice(`Updated ${updatedTasks} task statuses.`); await refreshInsights(); }, onError: () => setNotice("Could not refresh task statuses.") });
  const analysisMutation = useMutation({ mutationFn: () => analyzeDelivery(workspaceId, projectId), onSuccess: (value) => { setAnalysis(value); setNotice(""); }, onError: (error: Error) => setNotice(error.message) });
  const proposalMutation = useMutation({ mutationFn: (value: { kind: "CREATE_TASK"; title: string; rationale: string; evidenceIds: string[] }) => submitAIProposal(workspaceId, projectId, value), onSuccess: async () => { setNotice("Suggestion sent for review."); await queryClient.invalidateQueries({ queryKey: ["ai-proposals", workspaceId, projectId] }); } });
  const decisionMutation = useMutation({ mutationFn: ({ id, decision }: { id: string; decision: "APPROVE" | "REJECT" }) => decideAIProposal(workspaceId, projectId, id, decision), onSuccess: async () => { setNotice("Decision saved."); await Promise.all([refreshInsights(), queryClient.invalidateQueries({ queryKey: ["ai-proposals", workspaceId, projectId] })]); } });
  const integrationMutation = useMutation({ mutationFn: () => addGithubIntegration(workspaceId, projectId, repository.trim()), onSuccess: async () => { setRepository(""); setNotice("Repository added. Finish the webhook setup below to receive updates."); await queryClient.invalidateQueries({ queryKey: ["github-integrations", workspaceId] }); }, onError: (error: Error) => setNotice(error.message) });
  const deleteIntegration = useMutation({ mutationFn: (id: string) => removeGithubIntegration(workspaceId, id), onSuccess: async () => { setNotice("Repository removed."); await queryClient.invalidateQueries({ queryKey: ["github-integrations", workspaceId] }); } });

  if (!currentWorkspace) return <div className="p-8 text-sm text-slate-500">Select a workspace to view delivery health.</div>;
  if (!projects.length) return <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center"><Target className="mx-auto mb-3 text-violet-500" /><h1 className="text-xl font-semibold text-slate-900">Delivery health</h1><p className="mt-2 text-sm text-slate-500">Create a project and add tasks to see its progress.</p></div>;

  const result = health.data;
  const projectIntegrations = integrations.data?.filter((item) => item.project_id === projectId) ?? [];
  const citedEvidence = (ids: string[]) => ids.map((id) => timeline.data?.evidence.find((item) => item.id === id)).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const totalTasks = result ? result.health.completedTasks + result.health.openTasks : 0;
  const progress = totalTasks ? Math.round((result!.health.completedTasks / totalTasks) * 100) : 0;

  return <div className="mx-auto max-w-7xl space-y-5 pb-8">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="text-3xl font-bold tracking-tight text-slate-950">Delivery health</h1><p className="mt-1 text-sm text-slate-500">Progress, risks, and expected finish for this project.</p></div>
      <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-500">Project<select className="min-w-56 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800" value={projectId} onChange={(event) => { setAnalysis(null); setParams({ projectId: event.target.value }); }} aria-label="Select project">{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
    </header>

    {notice && <div role="status" className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800">{notice}</div>}
    {health.isLoading && <p className="py-8 text-center text-sm text-slate-500">Loading project status…</p>}
    {health.isError && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Couldn’t load project status. Refresh the page and try again.</div>}

    {result && <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className={`${panel} flex items-start justify-between`}><div><p className="text-sm text-slate-500">Project health</p><p className="mt-2 text-3xl font-bold text-slate-950">{result.health.score}<span className="ml-1 text-sm font-medium text-slate-400">/100</span></p><p className="mt-1 text-xs font-semibold capitalize text-violet-700">{statusLabel(result.health.label)}</p></div><Activity className="text-violet-500" /></article>
        <article className={panel}><p className="text-sm text-slate-500">Expected finish</p><p className="mt-2 text-xl font-bold text-slate-950">{dateLabel(result.forecast.p50)}</p><p className="mt-1 text-xs text-slate-500">Planning range ends {dateLabel(result.forecast.p85)}</p></article>
        <article className={panel}><div className="flex items-center justify-between"><p className="text-sm text-slate-500">Task progress</p><p className="text-sm font-semibold text-slate-800">{progress}%</p></div><p className="mt-2 text-xl font-bold text-slate-950">{result.health.completedTasks} of {totalTasks} complete</p><p className="mt-1 text-xs text-slate-500">{result.health.blockedTasks} blocked</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${progress}%` }} /></div></article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className={panel}><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Risks to review</h2><p className="mt-1 text-xs text-slate-500">Items that may affect delivery.</p></div><button className={quietButton} onClick={() => reconciliation.mutate()} disabled={reconciliation.isPending}><RefreshCw size={14} className={reconciliation.isPending ? "animate-spin" : ""} />{reconciliation.isPending ? "Refreshing…" : "Refresh"}</button></div>
          {result.riskFactors.length ? <div className="space-y-2">{result.riskFactors.map((risk) => <div key={risk.code} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3"><AlertTriangle size={16} className={risk.severity === "HIGH" ? "mt-0.5 shrink-0 text-rose-500" : "mt-0.5 shrink-0 text-amber-500"} /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold capitalize text-slate-800">{statusLabel(risk.code)}</p><span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold capitalize text-slate-500">{statusLabel(risk.severity)}</span><span className="text-xs text-slate-400">{risk.count}</span></div><p className="mt-1 text-xs leading-relaxed text-slate-500">{risk.explanation}</p></div></div>)}</div> : <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">No delivery risks found.</div>}
        </div>
        <details className={panel}><summary className="cursor-pointer list-none font-semibold text-slate-900">How is the finish date estimated?</summary><div className="mt-3 space-y-2 text-xs leading-5 text-slate-500"><p>Estimate uses recent task completion speed: {result.forecast.velocityTasksPerWeek} tasks per week from {result.forecast.sampleCount} recent completions.</p><p>{result.drift.p50Days === null ? "There is no saved plan to compare yet." : `Current estimate is ${Math.abs(result.drift.p50Days)} days ${result.drift.p50Days > 0 ? "later than" : "earlier than"} the saved plan.`}</p><p>Expected finish is an estimate, not a guaranteed date.</p></div></details>
      </section>

      <section className={panel}><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold text-slate-900">Tasks</h2><p className="mt-1 text-xs text-slate-500">Task status and linked GitHub updates.</p></div><span className="text-xs text-slate-400">{truth.data?.length ?? 0} tasks</span></div><div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead className="border-b border-slate-100 text-xs text-slate-400"><tr><th className="py-2 font-medium">Task</th><th className="py-2 font-medium">Status</th><th className="py-2 font-medium">GitHub updates</th></tr></thead><tbody>{truth.data?.map((task) => <tr key={task.id} className="border-b border-slate-50 last:border-0"><td className="max-w-sm truncate py-3 pr-4 font-medium text-slate-700" title={task.title}>{task.title}{task.taskKey && <span className="ml-2 font-mono text-[10px] text-slate-400">{task.taskKey}</span>}</td><td className="py-3 capitalize text-slate-500">{statusLabel(task.declaredStatus)}</td><td className="py-3"><span className="rounded-full bg-violet-50 px-2 py-1 text-xs font-semibold capitalize text-violet-700">{task.evidenceCount ? `${statusLabel(task.observedStatus)} · ${task.evidenceCount} update${task.evidenceCount === 1 ? "" : "s"}` : "No GitHub updates"}</span></td></tr>)}</tbody></table>{truth.isLoading && <p className="py-5 text-center text-xs text-slate-400">Loading tasks…</p>}{!truth.isLoading && !truth.data?.length && <p className="py-5 text-center text-xs text-slate-400">No tasks in this project yet.</p>}</div></section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className={panel}><div className="mb-4 flex items-start gap-2"><GitBranch size={17} className="mt-0.5 text-violet-600"/><div><h2 className="font-semibold text-slate-900">GitHub</h2><p className="mt-1 text-xs text-slate-500">Optional. Connect a repository to show code and build updates.</p></div></div>
          {canManageIntegrations && <form className="mb-3 flex gap-2" onSubmit={(event) => { event.preventDefault(); integrationMutation.mutate(); }}><input className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400" value={repository} onChange={(event) => setRepository(event.target.value)} placeholder="owner/repository" aria-label="GitHub repository in owner/repository format" /><button className="shrink-0 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={!repository.includes("/") || integrationMutation.isPending}>{integrationMutation.isPending ? "Adding…" : "Add repo"}</button></form>}
          {!canManageIntegrations && <p className="mb-3 text-xs text-slate-500">Ask a workspace owner or admin to connect a repository.</p>}
          {projectIntegrations.map((integration) => <div key={integration.id} className="mb-2 flex items-center justify-between rounded-xl bg-slate-50 p-3"><span className="text-sm font-medium text-slate-700">{integration.repository}</span>{canManageIntegrations && <button disabled={deleteIntegration.isPending} className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-rose-600 disabled:opacity-50" aria-label={`Remove ${integration.repository}`} onClick={() => deleteIntegration.mutate(integration.id)}><X size={15} /></button>}</div>)}
          {!projectIntegrations.length && <p className="mb-2 text-xs text-slate-400">No repository connected.</p>}
          {canManageIntegrations && projectIntegrations.length > 0 && <details className="mt-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3"><summary className="cursor-pointer text-xs font-semibold text-slate-700">Finish webhook setup</summary><ol className="mt-2 list-inside list-decimal space-y-1.5 text-xs leading-5 text-slate-600"><li>In GitHub, open <strong>Settings → Webhooks → Add webhook</strong>.</li><li>Payload URL: <code className="break-all rounded bg-white px-1">{(API_BASE_URL || window.location.origin)}/integrations/github</code>; content type: <code>application/json</code>.</li><li>Use the same secret as <code>GITHUB_WEBHOOK_SECRET</code> on the server.</li><li>Subscribe to push, pull request, review, check, workflow, issue, and deployment events; then run <code>npm run worker:github</code> in the server folder.</li></ol><p className="mt-2 flex items-start gap-1.5 border-t border-slate-200 pt-2 text-[11px] leading-4 text-slate-500"><CircleHelp size={13} className="mt-0.5 shrink-0" /> Add a task key to a branch or pull request title to link updates.</p></details>}
          {timeline.data?.events.length ? <details className="mt-3"><summary className="cursor-pointer text-xs font-semibold text-slate-600">Recent GitHub activity ({timeline.data.events.length})</summary><div className="mt-2 space-y-2">{timeline.data.events.slice(0, 5).map((event) => <div key={event.id} className="flex gap-3 border-t border-slate-100 pt-2"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-500"/><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-slate-700">{event.title}</p><p className="mt-1 text-[10px] capitalize text-slate-400">{statusLabel(event.event_type)} · {event.actor || "GitHub"} · {dateLabel(event.occurred_at)}</p></div>{event.url && <a href={event.url} target="_blank" rel="noreferrer" aria-label="Open GitHub event" className="text-slate-400 hover:text-violet-600"><ArrowUpRight size={15}/></a>}</div>)}</div></details> : null}
        </div>

        <details className={panel}><summary className="flex cursor-pointer list-none items-start gap-2"><Sparkles size={16} className="mt-0.5 text-violet-600"/><span><span className="block font-semibold text-slate-900">AI suggestions</span><span className="mt-1 block text-xs text-slate-500">Optional summary and task ideas based on project activity.</span></span></summary><div className="mt-4"><button className={quietButton} onClick={() => analysisMutation.mutate()} disabled={analysisMutation.isPending}><Sparkles size={14}/>{analysisMutation.isPending ? "Analyzing…" : "Generate insights"}</button>
          {analysis && <div className="mt-4 space-y-4"><p className="rounded-xl bg-violet-50 p-3 text-sm leading-relaxed text-slate-700">{analysis.summary}</p>{analysis.risks.map((risk, index) => <div key={`${risk.title}-${index}`}><p className="text-sm font-semibold text-slate-800">{risk.title}</p><p className="mt-1 text-xs leading-relaxed text-slate-500">{risk.explanation}</p><p className="mt-1 text-[10px] text-violet-600">{citedEvidence(risk.evidenceIds).map((item) => statusLabel(item.evidence_type)).join(", ") || "No linked evidence"}</p></div>)}{analysis.recommendations.map((recommendation, index) => <div key={`${recommendation.title}-${index}`} className="rounded-xl border border-slate-100 p-3"><p className="text-sm font-semibold text-slate-800">{recommendation.title}</p><p className="mt-1 text-xs leading-relaxed text-slate-500">{recommendation.explanation}</p>{citedEvidence(recommendation.evidenceIds).map((item) => <p key={item.id} className="mt-1 text-[10px] text-violet-600">Based on {statusLabel(item.evidence_type)}: {item.explanation}</p>)}{canWrite && <button className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-violet-700 hover:text-violet-900" onClick={() => proposalMutation.mutate({ kind: "CREATE_TASK", title: recommendation.title.slice(0, 180), rationale: recommendation.explanation.slice(0, 800), evidenceIds: recommendation.evidenceIds })}>Suggest as task<ArrowUpRight size={12}/></button>}</div>)}</div>}
          {!analysis && <p className="mt-3 text-xs text-slate-500">Generate insights when you need them. Suggestions require review before they change tasks.</p>}
          {proposals.data?.filter((item) => item.status === "PENDING").map((proposal) => <div key={proposal.id} className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50/70 p-3"><div><p className="text-sm font-semibold text-slate-800">{proposal.payload.title}</p><p className="mt-1 text-xs text-slate-500">Waiting for review</p></div>{canWrite && <div className="flex gap-1"><button aria-label="Approve suggestion" className="rounded-lg bg-emerald-600 p-2 text-white hover:bg-emerald-700" onClick={() => decisionMutation.mutate({ id: proposal.id, decision: "APPROVE" })}><Check size={14} /></button><button aria-label="Reject suggestion" className="rounded-lg bg-white p-2 text-slate-500 hover:text-rose-600" onClick={() => decisionMutation.mutate({ id: proposal.id, decision: "REJECT" })}><X size={14} /></button></div>}</div>)}
        </div></details>
      </section>
    </>}
  </div>;
}
