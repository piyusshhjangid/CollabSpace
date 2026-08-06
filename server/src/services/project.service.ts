import { findProjectsByWorkspace } from "../repositories/project.repository.js";

export async function getProjectsByWorkspace(workspaceId: string) {
  return await findProjectsByWorkspace(workspaceId);
}