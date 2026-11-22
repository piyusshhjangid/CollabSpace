import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { workspaceContext } from "../middleware/workspaceContext.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { validateBody } from "../middleware/validateBody.js";
import { StartIntegrationSchema } from "../schemas/intelligence.schema.js";
import { deleteIntegration, getIntegrationCatalog, getIntegrationOAuthCallback, getIntegrations, getProjectIntegrationEventList, postIntegrationStart, postIntegrationSync } from "../controllers/integration.controller.js";

const router = Router();
router.get("/integrations/oauth/:provider/callback", getIntegrationOAuthCallback);
router.get("/workspaces/:workspaceId/integrations/available", requireAuth, workspaceContext, getIntegrationCatalog);
router.get("/workspaces/:workspaceId/integrations", requireAuth, workspaceContext, getIntegrations);
router.post("/workspaces/:workspaceId/integrations/:provider/start", requireAuth, workspaceContext, requirePermission("EDIT_WORKSPACE"), validateBody(StartIntegrationSchema), postIntegrationStart);
router.delete("/workspaces/:workspaceId/integrations/:integrationId", requireAuth, workspaceContext, requirePermission("EDIT_WORKSPACE"), deleteIntegration);
router.post("/workspaces/:workspaceId/integrations/:integrationId/sync", requireAuth, workspaceContext, requirePermission("EDIT_WORKSPACE"), postIntegrationSync);
router.get("/workspaces/:workspaceId/projects/:projectId/integration-events", requireAuth, workspaceContext, getProjectIntegrationEventList);

export default router;
