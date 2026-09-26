import { Router } from "express";
import { getProjectSummary } from "../controllers/project.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { workspaceContext } from "../middleware/workspaceContext.js";

const router = Router();

router.get(
  "/:projectId/summary",
  requireAuth,
  workspaceContext,
  getProjectSummary,
);

export default router;