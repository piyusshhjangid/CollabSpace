import { apiFetch } from "../lib/api";

export interface ExecutionAnalytics {
  capturedAt: string;
  taskCount: number;
  completedCount: number;
  openCount: number;
  edgeCount: number;
  graph: { estimatedDurationDays: number; criticalPath: Array<{ taskId: string; title: string; slackDays: number; earliestStartDay: number; earliestFinishDay: number }>; nearCriticalTasks: Array<{ taskId: string; title: string; slackDays: number }>; taskSlack: Array<{ taskId: string; title: string; slackDays: number; earliestStartDay: number; earliestFinishDay: number }> };
  dependencyCentrality: Array<{ taskId: string; title: string; centrality: number; fanIn: number; fanOut: number }>;
  bottlenecks: Array<{ taskId: string; title: string; reason: string; severity: string }>;
  cycleTime: { sampleCount: number; p50Days: number | null; p85Days: number | null; durationsDays: number[] };
  blockedTime: { sampleCount: number; totalDays: number; p50Days: number | null; p85Days: number | null };
  workload: Array<{ personId: string; name: string; openTasks: number; estimatedDays: number; blockedTasks: number }>;
  historicalPatterns: { sampleCount: number; averageVarianceDays: number | null; plannedActual: Array<{ taskId: string; title: string; plannedEnd: string; completedAt: string; varianceDays: number }> };
}
export interface ScenarioResult {
  engine: string;
  baseline: { durationDays: number; finishDate: string; criticalTaskIds: string[] };
  scenario: { durationDays: number; finishDate: string; delayDays: number; criticalTaskIds: string[]; deadline: string | null; deadlineStatus: string; daysUntilDeadline: number | null };
  affectedTasks: Array<{ taskId: string; title: string; delayDays: number; critical: boolean; slackDays: number }>;
  assumptions: string[];
}
export interface ScenarioRecord { id: string; name: string; changes: Record<string, unknown>; created_at: string; latest_run: { id: string; createdAt: string; result: ScenarioResult } | null; }
export interface RecoveryOption { key: string; title: string; explanation: string; executable: boolean; score: number; impact: { finishDateChangeDays: number; workloadSpreadChange: number }; risk: string; changes: Record<string, unknown>; simulation: ScenarioResult | null; }
export interface RecoveryPlan { id: string; name: string; status: string; created_by: string; root_cause: { health?: { score: number; label: string; risks: unknown[] }; bottlenecks?: unknown[] }; options: RecoveryOption[]; selected_option_key: string | null; verification: unknown; created_at: string; }
export interface AgentRun { id: string; agent_type: string; status: string; input: { question?: string | null }; result: { generatedAt: string; summary: string; steps: Array<{ role: string; result: Record<string, unknown> }>; citations: Array<{ taskId: string; title: string }>; safety: { mode: string; makesChanges: boolean; humanApprovalRequiredForChanges: boolean } } | null; budget_limit: number; budget_used: number; created_at: string; steps?: Array<{ id: string; step_index: number; agent_role: string; result: unknown; citations: unknown }>; evaluations?: Array<{ case_key: string; passed: boolean; metrics: unknown; latency_ms: number | null; created_at: string }>; }
export interface KnowledgeDocument { id: string; title: string; source_type: string; source_url: string | null; created_at: string; updated_at: string; chunk_count: number; }
export interface KnowledgeMatch { chunk_id: string; document_id: string; title: string; source_type: string; source_url: string | null; heading: string | null; snippet: string; rank: number; }
export interface IntegrationProvider { provider: string; name: string; configured: boolean; callbackUrl: string; scopes: string; purpose: string; }
export interface ExternalIntegration { id: string; project_id: string | null; provider: string; external_account_id: string; display_name: string; base_url: string | null; config: Record<string, unknown>; status: string; last_synced_at: string | null; created_at: string; event_count: number; latest_job_status: string | null; }
export interface IntegrationEvent { id: string; provider: string; event_type: string; external_id: string; actor: string | null; title: string; body: string | null; url: string | null; occurred_at: string; created_at: string; }

const base = (workspaceId: string) => `/api/workspaces/${encodeURIComponent(workspaceId)}`;
const projectBase = (workspaceId: string, projectId: string) => `${base(workspaceId)}/projects/${encodeURIComponent(projectId)}`;
export const getAnalytics = (workspaceId: string, projectId: string) => apiFetch<{ analytics: ExecutionAnalytics }>(`${projectBase(workspaceId, projectId)}/analytics`).then((response) => response.analytics);
export const saveAnalyticsSnapshot = (workspaceId: string, projectId: string) => apiFetch<{ snapshot: { id: string; createdAt: string } }>(`${projectBase(workspaceId, projectId)}/analytics/snapshots`, { method: "POST" }).then((response) => response.snapshot);
export const getScenarios = (workspaceId: string, projectId: string) => apiFetch<{ scenarios: ScenarioRecord[] }>(`${projectBase(workspaceId, projectId)}/scenarios`).then((response) => response.scenarios);
export const createScenario = (workspaceId: string, projectId: string, value: { name: string; changes: Record<string, unknown> }) => apiFetch<{ scenario: ScenarioRecord }>(`${projectBase(workspaceId, projectId)}/scenarios`, { method: "POST", body: JSON.stringify(value) }).then((response) => response.scenario);
export const runScenario = (workspaceId: string, projectId: string, scenarioId: string) => apiFetch<{ run: { id: string; result: ScenarioResult } }>(`${projectBase(workspaceId, projectId)}/scenarios/${encodeURIComponent(scenarioId)}/run`, { method: "POST" }).then((response) => response.run);
export const getRecoveryPlans = (workspaceId: string, projectId: string) => apiFetch<{ plans: RecoveryPlan[] }>(`${projectBase(workspaceId, projectId)}/recovery-plans`).then((response) => response.plans);
export const createRecoveryPlan = (workspaceId: string, projectId: string) => apiFetch<{ plan: RecoveryPlan }>(`${projectBase(workspaceId, projectId)}/recovery-plans`, { method: "POST", body: JSON.stringify({}) }).then((response) => response.plan);
export const decideRecoveryPlan = (workspaceId: string, projectId: string, planId: string, value: { decision: "APPROVE" | "REJECT"; optionKey?: string }) => apiFetch<{ plan: RecoveryPlan }>(`${projectBase(workspaceId, projectId)}/recovery-plans/${encodeURIComponent(planId)}/decision`, { method: "POST", body: JSON.stringify(value) }).then((response) => response.plan);
export const getAgentRuns = (workspaceId: string, projectId: string) => apiFetch<{ runs: AgentRun[] }>(`${projectBase(workspaceId, projectId)}/agents/runs`).then((response) => response.runs);
export const runAgent = (workspaceId: string, projectId: string, value: { agentType: string; budgetLimit: number; question?: string }) => apiFetch<{ run: AgentRun; replayed: boolean }>(`${projectBase(workspaceId, projectId)}/agents/runs`, { method: "POST", headers: { "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify(value) }).then((response) => response.run);
export const getKnowledgeDocuments = (workspaceId: string) => apiFetch<{ documents: KnowledgeDocument[] }>(`${base(workspaceId)}/knowledge/documents`).then((response) => response.documents);
export const addKnowledgeDocument = (workspaceId: string, value: { title: string; sourceType: string; sourceUrl?: string; content: string }) => apiFetch<{ document: { id: string; title: string }; created: boolean; embeddingStatus: string; message: string }>(`${base(workspaceId)}/knowledge/documents`, { method: "POST", body: JSON.stringify(value) });
export const deleteKnowledgeDocument = (workspaceId: string, documentId: string) => apiFetch<{ document: { id: string } }>(`${base(workspaceId)}/knowledge/documents/${encodeURIComponent(documentId)}`, { method: "DELETE" });
export const searchKnowledge = (workspaceId: string, query: string) => apiFetch<{ query: string; chunks: KnowledgeMatch[]; retrieval: string }>(`${base(workspaceId)}/knowledge/search`, { method: "POST", body: JSON.stringify({ query, limit: 8 }) });
export const getIntegrationProviders = (workspaceId: string) => apiFetch<{ providers: IntegrationProvider[] }>(`${base(workspaceId)}/integrations/available`).then((response) => response.providers);
export const getIntegrations = (workspaceId: string) => apiFetch<{ integrations: ExternalIntegration[] }>(`${base(workspaceId)}/integrations`).then((response) => response.integrations);
export const startIntegration = (workspaceId: string, provider: string, value: { projectId: string; externalRef?: string; channelId?: string }) => apiFetch<{ authorizationUrl: string; callbackUrl: string; provider: string }>(`${base(workspaceId)}/integrations/${encodeURIComponent(provider)}/start`, { method: "POST", body: JSON.stringify(value) });
export const queueIntegrationSync = (workspaceId: string, integrationId: string) => apiFetch<{ job: { id: string; status: string; created_at: string }; message: string }>(`${base(workspaceId)}/integrations/${encodeURIComponent(integrationId)}/sync`, { method: "POST" });
export const deleteIntegration = (workspaceId: string, integrationId: string) => apiFetch<{ integration: { id: string } }>(`${base(workspaceId)}/integrations/${encodeURIComponent(integrationId)}`, { method: "DELETE" });
export const getIntegrationEvents = (workspaceId: string, projectId: string) => apiFetch<{ events: IntegrationEvent[] }>(`${projectBase(workspaceId, projectId)}/integration-events`).then((response) => response.events);
