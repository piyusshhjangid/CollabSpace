import { apiFetch } from "../lib/api";
import type {
  Workspace,
  WorkspaceRole,
} from "../types/workspace";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function fetchWorkspaces(): Promise<Workspace[]> {
  const response = await apiFetch<ApiResponse<Workspace[]>>(
    "/api/workspaces",
  );

  return response.data;
}

interface CurrentWorkspaceRole {
  workspaceId: string;
  role: WorkspaceRole;
}

export async function fetchWorkspaceRole(
  workspaceId: string,
): Promise<WorkspaceRole> {
  const response = await apiFetch<
    ApiResponse<CurrentWorkspaceRole>
  >(`/api/workspaces/${workspaceId}/me`);

  return response.data.role;
}