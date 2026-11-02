import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { workspaceContext } from "../middleware/workspaceContext.js";
import { getHealth, getProjectTruth, getTaskEvidence, getTimeline, reconcile } from "../controllers/delivery-health.controller.js";

const router = Router();
const projectRoute = "/workspaces/:workspaceId/projects/:projectId";
router.get(`${projectRoute}/health`, requireAuth, workspaceContext, getHealth);
router.get(`${projectRoute}/timeline`, requireAuth, workspaceContext, getTimeline);
router.get(`${projectRoute}/truth`, requireAuth, workspaceContext, getProjectTruth);
router.get(`${projectRoute}/tasks/:taskId/evidence`, requireAuth, workspaceContext, getTaskEvidence);
router.post(`${projectRoute}/truth/reconcile`, requireAuth, workspaceContext, reconcile);
export default router;
