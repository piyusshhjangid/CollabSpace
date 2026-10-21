import { prisma } from "../db/prisma.js";

export async function createInvitation(
  workspaceId: string,
  invitedBy: string,
  email: string,
  token: string,
  expiresAt: Date,
) {
  return prisma.invitations.create({
    data: {
      workspace_id: workspaceId,
      invited_by: invitedBy,
      email,
      token,
      expires_at: expiresAt,
    },
  });
}

export async function findWorkspaceInvitations(workspaceId: string) {
  return prisma.invitations.findMany({
    where: { workspace_id: workspaceId },
    select: { id: true, email: true, expires_at: true, accepted_at: true, created_at: true },
    orderBy: { created_at: "desc" },
  });
}

export async function revokeWorkspaceInvitation(workspaceId: string, invitationId: string) {
  return prisma.invitations.deleteMany({
    where: { id: invitationId, workspace_id: workspaceId, accepted_at: null },
  });
}

export async function findInvitationByToken(token: string) {
  return prisma.invitations.findUnique({
    where: {
      token,
    },
  });
}

export async function acceptInvitation(
  invitationId: string,
) {
  return prisma.invitations.update({
    where: {
      id: invitationId,
    },
    data: {
      accepted_at: new Date(),
    },
  });
}
