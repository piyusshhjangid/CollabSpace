import { findProjectsByWorkspace, createProject } from "../repositories/project.repository.js";
import type { Project } from "../types/project.js";

export async function getProjectsByWorkspace(workspaceId: string) {
  return await findProjectsByWorkspace(workspaceId);
}

export function createProjectService(
  workspaceId: string,
  name: string,
  description: string | undefined,
) {
  if (name.trim() === "") {
    throw new Error("Task title is required");
  }
  const project: Project = {
    id: `t${Date.now()}`,
    workspaceId,
    name,
    description,
  };
  
  return createProject(project);
}
