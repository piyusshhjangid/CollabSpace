import { Router } from "express";

import {
  getProjects,
  createProject,
  deleteProject,
} from "../controllers/project.controller.js";

import { requireAuth } from "../middleware/requireAuth.js";
import { workspaceContext } from "../middleware/workspaceContext.js";
import { requireRole } from "../middleware/requireRole.js";

import { validateBody } from "../middleware/validateBody.js";
import { CreateProjectSchema } from "../schemas/project.schema.js";

const router = Router({ mergeParams: true });

router.get(
  "/",
  requireAuth,
  workspaceContext,
  getProjects,
);

router.post(
  "/",
  requireAuth,
  workspaceContext,
  validateBody(CreateProjectSchema),
  createProject,
);

router.delete(
  "/:projectId",
  requireAuth,
  workspaceContext,
  requireRole("ADMIN"),
  deleteProject,
);

export default router;