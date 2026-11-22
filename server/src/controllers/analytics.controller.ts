import type { Request, Response } from "express";
import { routeParam } from "../lib/routeParam.js";
import { getProjectAnalytics, getProjectAnalyticsHistory, saveProjectAnalyticsSnapshot } from "../services/analytics.service.js";

export async function getAnalytics(req: Request, res: Response) {
  res.json({ analytics: await getProjectAnalytics(req.workspace!.id, routeParam(req, "projectId"), req.user!.id) });
}

export async function getAnalyticsHistory(req: Request, res: Response) {
  res.json({ snapshots: await getProjectAnalyticsHistory(req.workspace!.id, routeParam(req, "projectId"), req.user!.id) });
}

export async function postAnalyticsSnapshot(req: Request, res: Response) {
  res.status(201).json({ snapshot: await saveProjectAnalyticsSnapshot(req.workspace!.id, routeParam(req, "projectId"), req.user!.id) });
}
