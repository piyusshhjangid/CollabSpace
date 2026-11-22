import type { Request, Response } from "express";
import { routeParam } from "../lib/routeParam.js";
import { createProjectScenario, getProjectScenarios, getScenarioHistory, runProjectScenario } from "../services/scenario.service.js";

export async function getScenarios(req: Request, res: Response) {
  res.json({ scenarios: await getProjectScenarios(req.workspace!.id, routeParam(req, "projectId"), req.user!.id) });
}
export async function postScenario(req: Request, res: Response) {
  res.status(201).json({ scenario: await createProjectScenario(req.workspace!.id, routeParam(req, "projectId"), req.user!.id, req.body) });
}
export async function postScenarioRun(req: Request, res: Response) {
  res.status(201).json({ run: await runProjectScenario(req.workspace!.id, routeParam(req, "projectId"), routeParam(req, "scenarioId"), req.user!.id) });
}
export async function getScenarioRuns(req: Request, res: Response) {
  res.json({ runs: await getScenarioHistory(req.workspace!.id, routeParam(req, "projectId"), routeParam(req, "scenarioId"), req.user!.id) });
}
