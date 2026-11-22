import type { Request, Response } from "express";
import { routeParam } from "../lib/routeParam.js";
import { createAgentRun, getAgentRunDetail, getAgentRunList } from "../services/agent.service.js";

export async function getAgentRuns(req: Request, res: Response) {
  res.json({ runs: await getAgentRunList(req.workspace!.id, routeParam(req, "projectId"), req.user!.id) });
}

export async function getAgentRun(req: Request, res: Response) {
  res.json({ run: await getAgentRunDetail(req.workspace!.id, routeParam(req, "projectId"), routeParam(req, "runId"), req.user!.id) });
}

export async function postAgentRun(req: Request, res: Response) {
  const result = await createAgentRun({
    workspaceId: req.workspace!.id,
    projectId: routeParam(req, "projectId"),
    userId: req.user!.id,
    ...req.body,
    idempotencyKey: req.get("Idempotency-Key"),
  });
  res.status(result.replayed ? 200 : 201).json({ run: result.detail, replayed: result.replayed });
}
