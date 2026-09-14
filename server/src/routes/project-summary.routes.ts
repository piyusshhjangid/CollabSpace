import { Router } from "express";
import { getProjectSummary } from "../controllers/project.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.get("/:projectId/summary", requireAuth, getProjectSummary);

export default router;