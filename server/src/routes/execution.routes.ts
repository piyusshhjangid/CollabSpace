import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { workspaceContext } from "../middleware/workspaceContext.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { validateBody } from "../middleware/validateBody.js";
import { CreateContractSchema, CreateGoalSchema, CreateMilestoneSchema, CreateOutcomeSchema, CreatePlanSchema } from "../schemas/execution.schema.js";
import { getOutcomes, postContract, postGoal, postMilestone, postOutcome, postPlan } from "../controllers/execution.controller.js";

const router = Router();
router.get("/workspaces/:workspaceId/outcomes", requireAuth, workspaceContext, getOutcomes);
router.post("/workspaces/:workspaceId/outcomes", requireAuth, workspaceContext, requirePermission("MANAGE_OUTCOMES"), validateBody(CreateOutcomeSchema), postOutcome);
router.post("/workspaces/:workspaceId/outcomes/:outcomeId/goals", requireAuth, workspaceContext, requirePermission("MANAGE_OUTCOMES"), validateBody(CreateGoalSchema), postGoal);
router.post("/workspaces/:workspaceId/goals/:goalId/milestones", requireAuth, workspaceContext, requirePermission("MANAGE_OUTCOMES"), validateBody(CreateMilestoneSchema), postMilestone);
router.post("/workspaces/:workspaceId/outcomes/:outcomeId/contracts", requireAuth, workspaceContext, requirePermission("MANAGE_OUTCOMES"), validateBody(CreateContractSchema), postContract);
router.post("/workspaces/:workspaceId/outcomes/:outcomeId/plans", requireAuth, workspaceContext, requirePermission("MANAGE_OUTCOMES"), validateBody(CreatePlanSchema), postPlan);
export default router;
