import { Router } from "express";
import { getProjects, createProject } from "../controllers/project.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { workspaceContext } from "../middleware/workspaceContext.js";
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

export default router;