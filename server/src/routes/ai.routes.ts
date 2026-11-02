import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { workspaceContext } from "../middleware/workspaceContext.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { validateBody } from "../middleware/validateBody.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { AnalyzeProjectSchema, CreateProposalSchema, ProposalDecisionSchema } from "../schemas/ai.schema.js";
import { getProposals, postProjectAnalysis, postProposal, postProposalDecision } from "../controllers/ai.controller.js";

const router = Router();
const base = "/workspaces/:workspaceId/projects/:projectId/ai";
router.post(`${base}/analysis`, requireAuth, workspaceContext, rateLimit({ scope: "ai-analysis", limit: 10, windowMs: 60_000 }), validateBody(AnalyzeProjectSchema), postProjectAnalysis);
router.get(`${base}/proposals`, requireAuth, workspaceContext, getProposals);
router.post(`${base}/proposals`, requireAuth, workspaceContext, validateBody(CreateProposalSchema), postProposal);
router.post(`${base}/proposals/:proposalId/decision`, requireAuth, workspaceContext, requirePermission("CREATE_TASK"), validateBody(ProposalDecisionSchema), postProposalDecision);
export default router;
