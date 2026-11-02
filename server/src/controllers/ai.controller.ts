import type { Request, Response } from "express";
import { analyzeProject, createTaskProposal, decideTaskProposal, listTaskProposals } from "../services/ai.service.js";
import { routeParam } from "../lib/routeParam.js";

export async function postProjectAnalysis(req: Request, res: Response) {
  const result = await analyzeProject(req.workspace!.id, routeParam(req, "projectId"), req.user!.id, req.body.question);
  res.json({ analysis: result });
}

export async function getProposals(req: Request, res: Response) {
  res.json({ proposals: await listTaskProposals(req.workspace!.id, routeParam(req, "projectId"), req.user!.id) });
}

export async function postProposal(req: Request, res: Response) {
  res.status(201).json({ proposal: await createTaskProposal(req.workspace!.id, routeParam(req, "projectId"), req.user!.id, req.body) });
}

export async function postProposalDecision(req: Request, res: Response) {
  res.json(await decideTaskProposal(req.workspace!.id, routeParam(req, "projectId"), routeParam(req, "proposalId"), req.user!.id, req.body.decision));
}
