import type { Request, Response } from "express";
import { createGithubIntegration, deleteGithubIntegration, listGithubIntegrations, receiveGithubWebhook } from "../services/github.service.js";
import { routeParam } from "../lib/routeParam.js";

export async function listIntegrations(req: Request, res: Response) {
  res.json({ integrations: await listGithubIntegrations(req.workspace!.id, req.user!.id) });
}

export async function addIntegration(req: Request, res: Response) {
  res.status(201).json({ integration: await createGithubIntegration(req.workspace!.id, req.user!.id, req.body) });
}

export async function removeIntegration(req: Request, res: Response) {
  res.json(await deleteGithubIntegration(req.workspace!.id, routeParam(req, "integrationId")));
}

export async function githubWebhook(req: Request, res: Response) {
  if (!Buffer.isBuffer(req.body)) {
    res.status(400).json({ message: "Expected a raw JSON webhook body" });
    return;
  }
  let payload: unknown;
  try {
    payload = JSON.parse(req.body.toString("utf8"));
  } catch {
    res.status(400).json({ message: "Invalid JSON payload" });
    return;
  }
  const result = await receiveGithubWebhook(req.body, req.header("x-hub-signature-256"), req.header("x-github-delivery"), req.header("x-github-event"), payload);
  res.status(202).json(result);
}
