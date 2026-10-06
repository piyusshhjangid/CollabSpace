import {
  createWorkspaceWithOwner,
  findWorkspacesByUser,
  findWorkspaceMembership,
  removeWorkspaceMember,
  deleteWorkspace,
} from "../repositories/workspace.repository.js";

import { badRequest, forbidden } from "../lib/AppError.js";
import { normalizeRole } from "../types/role.js";
import { writeAuditLog } from "./audit.service.js";

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

  const role = normalizeRole(result.membership.role);

  if (!role) {
    throw new Error(
      `Invalid workspace role: ${result.membership.role}`,
    );
  }

  await writeAuditLog({
    workspaceId: result.workspace.id,
    actorId: userId,
    action: "WORKSPACE_CREATED",
    targetType: "WORKSPACE",
    targetId: result.workspace.id,
    metadata: {
      name: result.workspace.name,
    },
  });



  return {
    id: result.workspace.id,
    name: result.workspace.name,
    createdAt: result.workspace.created_at,
    role,
  };
}

export async function getUserWorkspacesService(
  userId: string,
) {
  return findWorkspacesByUser(userId);
}

export async function removeWorkspaceMemberService(
  workspaceId: string,
  targetUserId: string,
  actorUserId: string,
) {
  const membership = await findWorkspaceMembership(
    workspaceId,
    targetUserId,
  );

  if (!membership) {
    throw badRequest("Member not found");
  }

  const role = normalizeRole(membership.role);

  if (!role) {
    throw badRequest("Invalid workspace role");
  }

  if (role === "OWNER") {
    throw forbidden("Workspace owner cannot be removed");
  }

  await removeWorkspaceMember(
    workspaceId,
    targetUserId,
  );


  await writeAuditLog({
    workspaceId,
    actorId: actorUserId,
    action: "MEMBER_REMOVED",
    targetType: "WORKSPACE_MEMBER",
    targetId: targetUserId,
    metadata: {},
  });

return {
    workspaceId,
    userId: targetUserId,
  };
}

export async function deleteWorkspaceService(
  workspaceId: string,
  actorUserId: string,
) {
  await writeAuditLog({
    workspaceId,
    actorId: actorUserId,
    action: "WORKSPACE_DELETED",
    targetType: "WORKSPACE",
    targetId: workspaceId,
    metadata: {},
  });


  await deleteWorkspace(workspaceId);

  return {
    workspaceId,
  };
}