import type { Request, Response } from "express";
import { getProjectsByWorkspace } from "../services/project.service.js";

interface WorkspaceParams {
  workspaceId: string;
}

export function getProjects(req: Request<WorkspaceParams>, res: Response) {
  const { workspaceId } = req.params;
  const workSpaceProjects = getProjectsByWorkspace(workspaceId);
  res.json(workSpaceProjects);
}
