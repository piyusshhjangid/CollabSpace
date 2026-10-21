import type { RequestHandler } from "express";
import { prisma } from "../db/prisma.js";
import type {
  CreateInvitationBody,
  AcceptInvitationBody,
} from "../schemas/invitation.schema.js";

import {
  createInvitationService,
  acceptInvitationService,
  listWorkspaceInvitationsService,
  revokeWorkspaceInvitationService,
} from "../services/invitation.service.js";

import { unauthorized } from "../lib/AppError.js";
import { badRequest } from "../lib/AppError.js";

import type { ApiResponse } from "../types/apiResponse.js";

export const listWorkspaceInvitations: RequestHandler = async (req, res) => {
  const workspaceId = req.workspace?.id;
  if (!workspaceId) throw badRequest("Workspace context is required");
  const invitations = await listWorkspaceInvitationsService(workspaceId);
  const response: ApiResponse<typeof invitations> = { success: true, message: "Invitations fetched", data: invitations };
  res.json(response);
};

export const revokeWorkspaceInvitation: RequestHandler = async (req, res) => {
  const workspaceId = req.workspace?.id;
  const actorUserId = req.user?.id;
  const invitationId = req.params.invitationId;
  if (!workspaceId) throw badRequest("Workspace context is required");
  if (!actorUserId) throw unauthorized("Authentication required");
  if (typeof invitationId !== "string") throw badRequest("Invitation ID is required");
  const result = await revokeWorkspaceInvitationService(workspaceId, invitationId, actorUserId);
  const response: ApiResponse<typeof result> = { success: true, message: "Invitation revoked", data: result };
  res.json(response);
};

export const createInvitation: RequestHandler<
  { workspaceId: string },
  any,
  CreateInvitationBody
> = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    throw unauthorized("Authentication required");
  }

  const { workspaceId } = req.params;
  const { email } = req.body;

  const invitation = await createInvitationService(
    workspaceId,
    userId,
    email,
  );

  const response: ApiResponse<typeof invitation> = {
    success: true,
    message: "Invitation created successfully",
    data: invitation,
  };

  res.status(201).json(response);
};

export const acceptInvitation: RequestHandler<
  {},
  any,
  AcceptInvitationBody
> = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    throw unauthorized("Authentication required");
  }

  const { token } = req.body;

  // We need the authenticated user's email here.
  // For today's implementation, fetch it from the database.
  const user = await prisma.users.findUnique({
    where: {
      id: userId,
    },
    select: {
      email: true,
    },
  });

  if (!user) {
    throw unauthorized("Authentication required");
  }

  const result = await acceptInvitationService(
    token,
    userId,
    user.email,
  );

  const response: ApiResponse<typeof result> = {
    success: true,
    message: "Invitation accepted successfully",
    data: result,
  };

  res.json(response);
};
