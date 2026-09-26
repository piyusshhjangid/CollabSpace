import type { RequestHandler } from "express";
import {
  badRequest,
  forbidden,
  unauthorized,
} from "../lib/AppError.js";
import { findWorkspaceMembership } from "../repositories/workspace.repository.js";
import { normalizeRole } from "../types/role.js";

export const workspaceContext: RequestHandler = async (
  req,
  _res,
  next,
) => {
  const userId = req.user?.id;

  const workspaceId =
    typeof req.params.workspaceId === "string"
      ? req.params.workspaceId
      : typeof req.query.workspaceId === "string"
        ? req.query.workspaceId
        : undefined;

  if (!userId) {
    throw unauthorized("Authentication required");
  }

  if (!workspaceId) {
    throw badRequest("Workspace ID is required");
  }

  const membership = await findWorkspaceMembership(
    workspaceId,
    userId,
  );

  if (!membership) {
    throw forbidden("You are not a member of this workspace");
  }

  const role = normalizeRole(membership.role);

  if (!role) {
    throw forbidden("Invalid workspace role");
  }

  req.workspace = {
    id: workspaceId,
    role,
  };

  next();
};