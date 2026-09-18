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
