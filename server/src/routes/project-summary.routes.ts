import { Router } from "express";
import { getProjectSummary } from "../controllers/project.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { workspaceContext } from "../middleware/workspaceContext.js";
import { projectSummaryMetrics } from "../cache/projectSummary.js";

const router = Router();

router.get("/summary/metrics", requireAuth, (_req, res) => {
  res.json({ success: true, message: "Process-local summary cache metrics", data: projectSummaryMetrics() });
});

router.get(
  "/:projectId/summary",
  requireAuth,
  workspaceContext,
  getProjectSummary,
);

export default router;
