import type { Request, Response } from "express";
import { getAllWorkspaces as getAllWorkspacesService } from "../services/workspace.service.js";

export function getWorkspaces(req: Request, res: Response) {
  const allWorkspaces = getAllWorkspacesService();
  res.json({ workspaces: allWorkspaces });
}
