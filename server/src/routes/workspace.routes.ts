import { Router } from "express";

import {
  getWorkspaces,
  createWorkspace,
  getCurrentWorkspace,
  removeWorkspaceMember,
  deleteWorkspace,
} from "../controllers/workspace.controller.js";

import { requireAuth } from "../middleware/requireAuth.js";
import { workspaceContext } from "../middleware/workspaceContext.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { validateBody } from "../middleware/validateBody.js";

import { CreateWorkspaceSchema } from "../schemas/workspace.schema.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  getWorkspaces,
);

router.post(
  "/",
  requireAuth,
  validateBody(CreateWorkspaceSchema),
  createWorkspace,
);

router.get(
  "/:workspaceId/me",
  requireAuth,
  workspaceContext,
  getCurrentWorkspace,
);

router.delete(
  "/:workspaceId/members/:userId",
  requireAuth,
  workspaceContext,
  requirePermission("REMOVE_MEMBER"),
  removeWorkspaceMember,
);

router.delete(
  "/:workspaceId",
  requireAuth,
  workspaceContext,
  requirePermission("DELETE_WORKSPACE"),
  deleteWorkspace,
);

export default router;
