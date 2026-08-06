import type { Request, Response } from "express";
import { getAllWorkspaces as getAllWorkspacesService } from "../services/workspace.service.js";

export async function getWorkspaces(req: Request, res: Response) {
  const allWorkspaces = await getAllWorkspacesService();
  res.json({ workspaces: allWorkspaces });
}
