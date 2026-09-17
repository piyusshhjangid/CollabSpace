import {
  createWorkspaceWithOwner,
  findWorkspacesByUser,
} from "../repositories/workspace.repository.js";

import { badRequest } from "../lib/AppError.js";

export async function createWorkspaceService(
  userId: string,
  name: string,
) {
  if (name.trim() === "") {
    throw badRequest("Workspace name is required");
  }

  const result = await createWorkspaceWithOwner(
    userId,
    name.trim(),
  );

  return {
    id: result.workspace.id,
    name: result.workspace.name,
    createdAt: result.workspace.created_at,
    role: result.membership.role,
  };
}

export async function getUserWorkspacesService(
  userId: string,
) {
  return findWorkspacesByUser(userId);
}