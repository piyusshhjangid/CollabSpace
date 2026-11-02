import { apiFetch } from "../lib/api";

export type HealthResponse = {
  health: { score: number; label: string; openTasks: number; completedTasks: number; blockedTasks: number; evidenceCoverage: number; averageEvidenceConfidence: number; latestEvidenceAt: string | null };
  forecast: { p50: string; p85: string; p50BusinessDays: number; p85BusinessDays: number; velocityTasksPerWeek: number; sampleCount: number; confidence: "HIGH" | "MEDIUM" | "LOW"; basis: string };
  drift: { baselineDate: string | null; p50Days: number | null; p85Days: number | null; status: string };
  riskFactors: Array<{ code: string; severity: string; count: number; taskIds: string[]; explanation: string }>;
};
export type TruthTask = { id: string; taskKey?: string | null; title: string; declaredStatus: string; observedStatus: string; confidence: number; explanation: string; evidenceCount: number; reconciledAt: string | null };
export type EvidenceBundle = {
  events: Array<{ id: string; task_id: string | null; event_type: string; action: string | null; actor: string | null; title: string; body: string | null; url: string | null; branch: string | null; occurred_at: string; link_confidence: number }>;
  evidence: Array<{ id: string; task_id: string; event_id: string; evidence_type: string; observed_status: string; confidence: number; explanation: string; captured_at: string }>;
};
export type AIAnalysis = { summary: string; risks: Array<{ title: string; explanation: string; evidenceIds: string[] }>; recommendations: Array<{ title: string; explanation: string; evidenceIds: string[] }>; generatedAt: string; basis: { evidenceCount: number; taskCount: number; forecastConfidence: string; model: string } };
export type AIProposal = { id: string; kind: string; payload: { title?: string; rationale?: string }; status: string; created_at: string };
export type GithubIntegration = { id: string; project_id: string; repository: string; enabled: boolean; created_at: string };

const root = (workspaceId: string, projectId: string) => `/api/workspaces/${encodeURIComponent(workspaceId)}/projects/${encodeURIComponent(projectId)}`;
export const getDeliveryHealth = (workspaceId: string, projectId: string) => apiFetch<{ health: HealthResponse }>(`${root(workspaceId, projectId)}/health`).then((r) => r.health);
export const getTruth = (workspaceId: string, projectId: string) => apiFetch<{ tasks: TruthTask[] }>(`${root(workspaceId, projectId)}/truth`).then((r) => r.tasks);
export const getTimeline = (workspaceId: string, projectId: string) => apiFetch<EvidenceBundle>(`${root(workspaceId, projectId)}/timeline`);
export const reconcileTruth = (workspaceId: string, projectId: string) => apiFetch<{ updatedTasks: number }>(`${root(workspaceId, projectId)}/truth/reconcile`, { method: "POST" });
export const analyzeDelivery = (workspaceId: string, projectId: string, question?: string) => apiFetch<{ analysis: AIAnalysis }>(`${root(workspaceId, projectId)}/ai/analysis`, { method: "POST", body: JSON.stringify({ question }) }).then((r) => r.analysis);
export const getAIProposals = (workspaceId: string, projectId: string) => apiFetch<{ proposals: AIProposal[] }>(`${root(workspaceId, projectId)}/ai/proposals`).then((r) => r.proposals);
export const submitAIProposal = (workspaceId: string, projectId: string, value: { kind: "CREATE_TASK"; title: string; rationale: string; evidenceIds: string[] }) => apiFetch<{ proposal: AIProposal }>(`${root(workspaceId, projectId)}/ai/proposals`, { method: "POST", body: JSON.stringify(value) }).then((r) => r.proposal);
export const decideAIProposal = (workspaceId: string, projectId: string, proposalId: string, decision: "APPROVE" | "REJECT") => apiFetch(`${root(workspaceId, projectId)}/ai/proposals/${encodeURIComponent(proposalId)}/decision`, { method: "POST", body: JSON.stringify({ decision }) });
export const getGithubIntegrations = (workspaceId: string) => apiFetch<{ integrations: GithubIntegration[] }>(`/api/workspaces/${encodeURIComponent(workspaceId)}/integrations/github`).then((r) => r.integrations);
export const addGithubIntegration = (workspaceId: string, projectId: string, repository: string) => apiFetch<{ integration: GithubIntegration }>(`/api/workspaces/${encodeURIComponent(workspaceId)}/integrations/github`, { method: "POST", body: JSON.stringify({ projectId, repository }) }).then((r) => r.integration);
export const removeGithubIntegration = (workspaceId: string, integrationId: string) => apiFetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/integrations/github/${encodeURIComponent(integrationId)}`, { method: "DELETE" });
