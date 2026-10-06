import type { RequestHandler } from "express";
import type { PermissionAction } from "../policy/permissionMatrix.js";
import { hasPermission } from "../policy/permissionMatrix.js";
import { forbidden } from "../lib/AppError.js";

export function requirePermission(
  action: PermissionAction,
): RequestHandler {
  return (req, _res, next) => {
    if (!req.workspace) {
      return next(forbidden("Workspace context is required"));
    }

    if (!hasPermission(req.workspace.role, action)) {
      return next(
        forbidden("You do not have permission to perform this action"),
      );
    }

    next();
  };
}
