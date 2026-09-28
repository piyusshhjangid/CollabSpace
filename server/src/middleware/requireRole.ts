import type { RequestHandler } from "express";
import { badRequest, forbidden } from "../lib/AppError.js";
import { ROLE_LEVEL, type Role } from "../types/role.js";

export function requireRole(minRole: Role): RequestHandler {
  return (req, _res, next) => {
    if (!req.workspace) {
      throw badRequest("Workspace context is required");
    }

    const currentLevel = ROLE_LEVEL[req.workspace.role];
    const requiredLevel = ROLE_LEVEL[minRole];

    if (currentLevel < requiredLevel) {
      throw forbidden("Insufficient permissions");
    }

    next();
  };
}