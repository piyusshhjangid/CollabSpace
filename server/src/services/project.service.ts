import { findProjectsByWorkspace, createProject } from "../repositories/project.repository.js";
import type { Project } from "../types/project.js";
import { badRequest } from "../lib/AppError.js";

export async function getProjectsByWorkspace(workspaceId: string) {
  return await findProjectsByWorkspace(workspaceId);
}

export function createProjectService(
  workspaceId: string,
  name: string,
  description: string | undefined,
) {
  if (name.trim() === "") {
    throw badRequest("Project name is required");
  }

  const project: Project = {
    id: `p${Date.now()}`,
    workspaceId,
    name,
    description,
  };

  return createProject(project);
}
