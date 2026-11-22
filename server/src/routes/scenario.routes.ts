import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { workspaceContext } from "../middleware/workspaceContext.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { validateBody } from "../middleware/validateBody.js";
import { CreateScenarioSchema } from "../schemas/intelligence.schema.js";
import { getScenarioRuns, getScenarios, postScenario, postScenarioRun } from "../controllers/scenario.controller.js";

const router = Router();
const base = "/workspaces/:workspaceId/projects/:projectId/scenarios";
router.get(base, requireAuth, workspaceContext, getScenarios);
router.post(base, requireAuth, workspaceContext, requirePermission("MANAGE_OUTCOMES"), validateBody(CreateScenarioSchema), postScenario);
router.post(`${base}/:scenarioId/run`, requireAuth, workspaceContext, postScenarioRun);
router.get(`${base}/:scenarioId/runs`, requireAuth, workspaceContext, getScenarioRuns);
export default router;
