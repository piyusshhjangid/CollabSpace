import {
  findProjectsByWorkspace,
  createProject,
  deleteProject,
} from "../repositories/project.repository.js";
import { findWorkspaceMembership } from "../repositories/workspace.repository.js";
import type { Project } from "../types/project.js";
import { badRequest, forbidden } from "../lib/AppError.js";
import { writeAuditLog } from "./audit.service.js";

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

  const project = await createProject(
      workspaceId,
      name,
      description,
    );



  await writeAuditLog({
      workspaceId,
      actorId: userId,
      action: "PROJECT_CREATED",
      targetType: "PROJECT",
      targetId: project.id,
      metadata: {
        name: project.name,
      },
    });



  return project;
}

export async function deleteProjectService(
  projectId: string,
  workspaceId: string,
  userId: string,
) {
  try {    const result = await deleteProject(
      projectId,
      workspaceId,
    );

    await writeAuditLog({
      workspaceId,
      actorId: userId,
      action: "PROJECT_DELETED",
      targetType: "PROJECT",
      targetId: projectId,
      metadata: {},
    });

    return result;
  } catch {
    throw badRequest("Project not found");
  }
}