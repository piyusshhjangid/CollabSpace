import {
  findProjectsByWorkspace,
  createProject,
} from "../repositories/project.repository.js";
import { findWorkspaceMembership } from "../repositories/workspace.repository.js";
import type { Project } from "../types/project.js";
import { badRequest, forbidden } from "../lib/AppError.js";

async function verifyWorkspaceMember(
  workspaceId: string,
  userId: string,
) {
  const membership = await findWorkspaceMembership(
    workspaceId,
    userId,
  );

  if (!membership) {
    throw forbidden("You are not a member of this workspace");
  }
}

export async function getProjectsByWorkspace(
  workspaceId: string,
  userId: string,
) {
  await verifyWorkspaceMember(workspaceId, userId);

  return findProjectsByWorkspace(workspaceId);
}

export async function createProjectService(
  workspaceId: string,
  userId: string,
  name: string,
  description: string | undefined,
) {
  await verifyWorkspaceMember(workspaceId, userId);

  if (name.trim() === "") {
    throw badRequest("Project name is required");
  }

  return createProject(workspaceId, name, description);
}