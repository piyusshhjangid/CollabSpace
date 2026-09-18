import crypto from "node:crypto";
import { prisma } from "../db/prisma.js";
import {
  createInvitation,
  findInvitationByToken,
  acceptInvitation,
} from "../repositories/invitation.repository.js";
import {
  findWorkspaceMembership,
} from "../repositories/workspace.repository.js";
import { badRequest, forbidden } from "../lib/AppError.js";

function generateInvitationToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function createInvitationService(
  workspaceId: string,
  userId: string,
  email: string,
) {
  const membership = await findWorkspaceMembership(
    workspaceId,
    userId,
  );

  if (!membership) {
    throw forbidden(
      "You are not a member of this workspace",
    );
  }

  const token = generateInvitationToken();

  const expiresAt = new Date(
    Date.now() + 24 * 60 * 60 * 1000,
  );

  const invitation = await createInvitation(
    workspaceId,
    userId,
    email.toLowerCase(),
    token,
    expiresAt,
  );

  console.log(
    `Invitation created for ${email}: ${token}`,
  );

  return {
    id: invitation.id,
    email: invitation.email,
    expiresAt: invitation.expires_at,
  };
}

export async function acceptInvitationService(
  token: string,
  userId: string,
  userEmail: string,
) {
  const invitation = await findInvitationByToken(token);

  if (!invitation) {
    throw badRequest("Invalid invitation");
  }

  if (invitation.accepted_at) {
    throw badRequest("Invitation has already been used");
  }

  if (invitation.expires_at <= new Date()) {
    throw badRequest("Invitation has expired");
  }

  if (
    invitation.email.toLowerCase() !==
    userEmail.toLowerCase()
  ) {
    throw forbidden(
      "This invitation was sent to a different email",
    );
  }

  const existingMembership =
    await findWorkspaceMembership(
      invitation.workspace_id,
      userId,
    );

  if (!existingMembership) {
    await prisma.workspace_members.create({
      data: {
        user_id: userId,
        workspace_id: invitation.workspace_id,
        role: "MEMBER",
      },
    });
  }

  await acceptInvitation(invitation.id);

  return {
    workspaceId: invitation.workspace_id,
    role: "MEMBER",
  };
}