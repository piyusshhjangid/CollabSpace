import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { workspaceContext } from "../middleware/workspaceContext.js";
import { validateBody } from "../middleware/validateBody.js";
import { CreateAgentRunSchema } from "../schemas/intelligence.schema.js";
import { getAgentRun, getAgentRuns, postAgentRun } from "../controllers/agent.controller.js";

const router = Router();
const base = "/workspaces/:workspaceId/projects/:projectId/agents/runs";
router.get(base, requireAuth, workspaceContext, getAgentRuns);
router.post(base, requireAuth, workspaceContext, validateBody(CreateAgentRunSchema), postAgentRun);
router.get(`${base}/:runId`, requireAuth, workspaceContext, getAgentRun);

export default router;
