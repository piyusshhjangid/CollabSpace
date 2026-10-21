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

export async function updateWorkspace(workspaceId: string, name: string): Promise<Pick<BackendWorkspace, "id" | "name">> {
  const response = await apiFetch<ApiResponse<Pick<BackendWorkspace, "id" | "name">>>(
    `/api/workspaces/${encodeURIComponent(workspaceId)}`,
    { method: "PATCH", body: JSON.stringify({ name: name.trim() }) },
  );
  return response.data;
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  await apiFetch<ApiResponse<{ workspaceId: string }>>(
    `/api/workspaces/${encodeURIComponent(workspaceId)}`,
    { method: "DELETE" },
  );
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

export interface WorkspaceInvitation {
  id: string;
  email: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
  status: "PENDING" | "EXPIRED" | "ACCEPTED";
}

export interface CreatedInvitation {
  id: string;
  email: string;
  expiresAt: string;
  token: string;
}

export async function createInvitation(workspaceId: string, email: string): Promise<CreatedInvitation> {
  const response = await apiFetch<ApiResponse<CreatedInvitation>>(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/invitations`,
    { method: "POST", body: JSON.stringify({ email: email.trim() }) },
  );
  return response.data;
}

export async function fetchWorkspaceInvitations(workspaceId: string): Promise<WorkspaceInvitation[]> {
  const response = await apiFetch<ApiResponse<WorkspaceInvitation[]>>(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/invitations`,
  );
  return response.data;
}

export async function revokeInvitation(workspaceId: string, invitationId: string): Promise<void> {
  await apiFetch<ApiResponse<{ id: string }>>(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/invitations/${encodeURIComponent(invitationId)}`,
    { method: "DELETE" },
  );
}
