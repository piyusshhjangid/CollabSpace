import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { workspaceContext } from "../middleware/workspaceContext.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { getAnalytics, getAnalyticsHistory, postAnalyticsSnapshot } from "../controllers/analytics.controller.js";

const router = Router();
const base = "/workspaces/:workspaceId/projects/:projectId/analytics";
router.get(base, requireAuth, workspaceContext, getAnalytics);
router.get(`${base}/history`, requireAuth, workspaceContext, getAnalyticsHistory);
router.post(`${base}/snapshots`, requireAuth, workspaceContext, requirePermission("MANAGE_OUTCOMES"), postAnalyticsSnapshot);
export default router;
