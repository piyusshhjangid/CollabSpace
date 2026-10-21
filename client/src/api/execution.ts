import { apiFetch } from "../lib/api";

export interface Goal { id: string; name: string; target_date: string | null; milestones: Milestone[]; }
export interface Milestone { id: string; name: string; due_date: string | null; status: string; }
export interface Outcome { id: string; workspace_id: string; name: string; description: string | null; success_criteria: string[]; target_date: string | null; goals: Goal[]; delivery_contracts: { id: string; version: number; scope: string; deadline: string | null; acceptance_criteria: string[] }[]; execution_plans: { id: string; version: number; created_at: string }[]; }
export interface ExecutionGraph {
  projectId: string;
  outcomeId: string | null;
  sequence: number;
  tasks: { id: string; title: string; status: string; completed: boolean; dueDate: string | null; durationDays: number }[];
  edges: { id: string; from: string; to: string; type: string }[];
  criticalPath: { duration: number; criticalTaskIds: string[]; earliestFinish: Record<string, number>; slack: Record<string, number> };
}
interface ApiResponse<T> { success: boolean; message: string; data: T; }
const request = async <T,>(path: string, method = "GET", body?: unknown) => (await apiFetch<ApiResponse<T>>(path, { method, ...(body ? { body: JSON.stringify(body) } : {}) })).data;
const workspacePath = (id: string) => `/api/workspaces/${encodeURIComponent(id)}`;
const projectPath = (projectId: string) => `/api/projects/${encodeURIComponent(projectId)}`;

export const executionKeys = {
  outcomes: (workspaceId: string) => ["outcomes", workspaceId] as const,
  graph: (workspaceId: string, projectId: string) => ["execution-graph", workspaceId, projectId] as const,
};
export const getOutcomes = (workspaceId: string) => request<Outcome[]>(`${workspacePath(workspaceId)}/outcomes`);
export const getExecutionGraph = (workspaceId: string, projectId: string) => request<ExecutionGraph>(`${projectPath(projectId)}/graph?workspaceId=${encodeURIComponent(workspaceId)}`);
export const addOutcome = (workspaceId: string, body: unknown) => request<Outcome>(`${workspacePath(workspaceId)}/outcomes`, "POST", body);
export const addGoal = (workspaceId: string, outcomeId: string, body: unknown) => request<Goal>(`${workspacePath(workspaceId)}/outcomes/${outcomeId}/goals`, "POST", body);
export const addMilestone = (workspaceId: string, goalId: string, body: unknown) => request<Milestone>(`${workspacePath(workspaceId)}/goals/${goalId}/milestones`, "POST", body);
export const addContract = (workspaceId: string, outcomeId: string, body: unknown) => request<Outcome["delivery_contracts"][number]>(`${workspacePath(workspaceId)}/outcomes/${outcomeId}/contracts`, "POST", body);
export const addPlan = (workspaceId: string, outcomeId: string, body: unknown) => request<Outcome["execution_plans"][number]>(`${workspacePath(workspaceId)}/outcomes/${outcomeId}/plans`, "POST", body);
export const addDependency = (workspaceId: string, projectId: string, body: unknown) => request<ExecutionGraph["edges"][number]>(`${projectPath(projectId)}/dependencies?workspaceId=${encodeURIComponent(workspaceId)}`, "POST", body);
export const removeDependency = (workspaceId: string, projectId: string, dependencyId: string) => request<{ id: string }>(`${projectPath(projectId)}/dependencies/${dependencyId}?workspaceId=${encodeURIComponent(workspaceId)}`, "DELETE");
export const linkProjectOutcome = (workspaceId: string, projectId: string, outcomeId: string | null) => request<{ id: string; outcomeId: string | null }>(`${workspacePath(workspaceId)}/projects/${encodeURIComponent(projectId)}/outcome`, "PATCH", { outcomeId });
