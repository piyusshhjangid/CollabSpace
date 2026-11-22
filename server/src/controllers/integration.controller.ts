import type { Request, Response } from "express";
import { routeParam } from "../lib/routeParam.js";
import { getAvailableIntegrations, getProjectIntegrationEvents, handleOAuthCallback, listWorkspaceIntegrations, queueIntegrationSync, removeWorkspaceIntegration, startProviderAuthorization } from "../services/integrations.service.js";

export async function getIntegrationCatalog(_req: Request, res: Response) {
  res.json({ providers: getAvailableIntegrations() });
}

export async function getIntegrations(req: Request, res: Response) {
  res.json({ integrations: await listWorkspaceIntegrations(req.workspace!.id, req.user!.id) });
}

export async function postIntegrationStart(req: Request, res: Response) {
  res.json(await startProviderAuthorization(req.workspace!.id, req.user!.id, routeParam(req, "provider"), req.body));
}

export async function getIntegrationOAuthCallback(req: Request, res: Response) {
  const providerName = routeParam(req, "provider");
  const code = typeof req.query.code === "string" ? req.query.code : "";
  const state = typeof req.query.state === "string" ? req.query.state : "";
  if (typeof req.query.error === "string" || !code || !state) {
    res.redirect(303, await handleOAuthCallback(providerName, "", ""));
    return;
  }
  res.redirect(303, await handleOAuthCallback(providerName, code, state));
}

export async function postIntegrationSync(req: Request, res: Response) {
  res.status(202).json({ job: await queueIntegrationSync(req.workspace!.id, routeParam(req, "integrationId"), req.user!.id), message: "Sync queued. It will retry automatically if the provider is temporarily unavailable." });
}

export async function getProjectIntegrationEventList(req: Request, res: Response) {
  res.json({ events: await getProjectIntegrationEvents(req.workspace!.id, routeParam(req, "projectId"), req.user!.id) });
}

export async function deleteIntegration(req: Request, res: Response) {
  res.json({ integration: await removeWorkspaceIntegration(req.workspace!.id, routeParam(req, "integrationId"), req.user!.id) });
}
