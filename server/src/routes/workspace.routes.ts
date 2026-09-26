import { Router } from "express";

import {
  getWorkspaces,
  createWorkspace,
  getCurrentWorkspace,
} from "../controllers/workspace.controller.js";

import { requireAuth } from "../middleware/requireAuth.js";
import { workspaceContext } from "../middleware/workspaceContext.js";
import { validateBody } from "../middleware/validateBody.js";
import { CreateWorkspaceSchema } from "../schemas/workspace.schema.js";

const router = Router();

router.get("/", requireAuth, getWorkspaces);

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

export default router;