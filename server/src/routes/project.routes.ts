import { Router } from "express";

import {
  getProjects,
  createProject,
  deleteProject,
  updateProjectOutcome,
} from "../controllers/project.controller.js";

import { requireAuth } from "../middleware/requireAuth.js";
import { workspaceContext } from "../middleware/workspaceContext.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { validateBody } from "../middleware/validateBody.js";

import { CreateProjectSchema, LinkProjectOutcomeSchema } from "../schemas/project.schema.js";

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
  requirePermission("CREATE_PROJECT"),
  validateBody(CreateProjectSchema),
  createProject,
);

router.delete(
  "/:projectId",
  requireAuth,
  workspaceContext,
  requirePermission("DELETE_PROJECT"),
  deleteProject,
);

router.patch("/:projectId/outcome", requireAuth, workspaceContext, requirePermission("MANAGE_OUTCOMES"), validateBody(LinkProjectOutcomeSchema), updateProjectOutcome);

export default router;
