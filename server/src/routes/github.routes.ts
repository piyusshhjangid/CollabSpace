import express, { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { workspaceContext } from "../middleware/workspaceContext.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { validateBody } from "../middleware/validateBody.js";
import { GithubIntegrationSchema } from "../schemas/github.schema.js";
import { addIntegration, githubWebhook, listIntegrations, removeIntegration } from "../controllers/github.controller.js";

export const githubWebhookRouter = Router();
githubWebhookRouter.post("/", express.raw({ type: "application/json", limit: "1mb" }), githubWebhook);

const integrations = Router();
integrations.get("/workspaces/:workspaceId/integrations/github", requireAuth, workspaceContext, listIntegrations);
integrations.post("/workspaces/:workspaceId/integrations/github", requireAuth, workspaceContext, requirePermission("EDIT_WORKSPACE"), validateBody(GithubIntegrationSchema), addIntegration);
integrations.delete("/workspaces/:workspaceId/integrations/github/:integrationId", requireAuth, workspaceContext, requirePermission("EDIT_WORKSPACE"), removeIntegration);
export default integrations;
