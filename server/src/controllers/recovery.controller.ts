import type { Request, Response } from "express";
import { routeParam } from "../lib/routeParam.js";
import { decideRecoveryPlan, generateRecoveryPlan, getRecoveryPlans } from "../services/recovery.service.js";

export async function getRecoveryPlanList(req: Request, res: Response) {
  res.json({ plans: await getRecoveryPlans(req.workspace!.id, routeParam(req, "projectId"), req.user!.id) });
}
export async function postRecoveryPlan(req: Request, res: Response) {
  res.status(201).json({ plan: await generateRecoveryPlan(req.workspace!.id, routeParam(req, "projectId"), req.user!.id, req.body.name) });
}
export async function postRecoveryDecision(req: Request, res: Response) {
  const result = await decideRecoveryPlan(req.workspace!.id, routeParam(req, "projectId"), routeParam(req, "planId"), req.user!.id, req.body.decision, req.body.optionKey);
  res.json({ plan: result, message: result.status === "QUEUED" ? "Approved. The recovery worker will apply and verify this change." : "Recovery plan rejected." });
}
