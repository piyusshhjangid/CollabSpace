import { apiFetch } from "../lib/api";
import type { Workspace, WorkspaceRole } from "../types/workspace";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// --- Create Workspace ---
export interface BackendWorkspace {
  id: string;
  name: string;
  role: WorkspaceRole;
}

export async function createWorkspace(payload: {
  name: string;
}): Promise<BackendWorkspace> {
  const response = await apiFetch<ApiResponse<BackendWorkspace>>(
    "/api/workspaces",
    {
      method: "POST",
      body: JSON.stringify({ name: payload.name.trim() }),
    },
  );
  return response.data;
}

// --- List Workspaces ---
export async function fetchWorkspaces(): Promise<Workspace[]> {
  const response = await apiFetch<ApiResponse<Workspace[]>>("/api/workspaces");
  return response.data;
}

// --- Workspace Role ---
interface CurrentWorkspaceRole {
  workspaceId: string;
  role: WorkspaceRole;
}

export async function fetchWorkspaceRole(
  workspaceId: string,
): Promise<WorkspaceRole> {
  const response = await apiFetch<ApiResponse<CurrentWorkspaceRole>>(
    `/api/workspaces/${workspaceId}/me`,
  );
  return response.data.role;
}

// --- Accept Invitation ---
export interface AcceptInvitationResult {
  workspaceId: string;
  role: string;
}

export async function acceptInvitation(payload: {
  token: string;
}): Promise<AcceptInvitationResult> {
  const response = await apiFetch<ApiResponse<AcceptInvitationResult>>(
    "/api/invitations/accept",
    {
      method: "POST",
      body: JSON.stringify({ token: payload.token.trim() }),
    },
  );
  return response.data;
}