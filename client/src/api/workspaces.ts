import { apiFetch } from "../lib/api";
import type { Workspace } from "../types/workspace";

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