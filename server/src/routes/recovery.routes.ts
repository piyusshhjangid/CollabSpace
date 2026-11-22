import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { workspaceContext } from "../middleware/workspaceContext.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { validateBody } from "../middleware/validateBody.js";
import { CreateRecoveryPlanSchema, DecideRecoveryPlanSchema } from "../schemas/intelligence.schema.js";
import { getRecoveryPlanList, postRecoveryDecision, postRecoveryPlan } from "../controllers/recovery.controller.js";

const router = Router();
const base = "/workspaces/:workspaceId/projects/:projectId/recovery-plans";
router.get(base, requireAuth, workspaceContext, getRecoveryPlanList);
router.post(base, requireAuth, workspaceContext, requirePermission("MANAGE_OUTCOMES"), validateBody(CreateRecoveryPlanSchema), postRecoveryPlan);
router.post(`${base}/:planId/decision`, requireAuth, workspaceContext, requirePermission("MANAGE_OUTCOMES"), validateBody(DecideRecoveryPlanSchema), postRecoveryDecision);
export default router;
