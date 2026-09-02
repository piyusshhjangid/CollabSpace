import { Router } from "express";
import { getProjectSummary } from "../controllers/project.controller.js";

const router = Router();

router.get("/:projectId/summary", getProjectSummary);

export default router;