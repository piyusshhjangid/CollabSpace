import { FolderKanban } from "lucide-react";
import { apiFetch } from "../lib/api";
import type { Project } from "../types/project";

interface ApiProject {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function fetchProjects(
  workspaceId: string,
): Promise<Project[]> {
  const response = await apiFetch<ApiResponse<ApiProject[]>>(
    `/api/workspaces/${workspaceId}/projects`,
  );

  return response.data.map((project) => ({
    id: project.id,
    name: project.name,
    icon: FolderKanban,
    description: project.description ?? "No description",
    taskCount: 0,
    updatedAt: project.createdAt,
    status: "ACTIVE",
  }));
}