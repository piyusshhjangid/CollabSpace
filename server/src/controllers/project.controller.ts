import type { Request, Response } from "express";
import { projects } from "../data/fakeStore.js";

interface WorkspaceParams {
    workspaceId: string;
}

export function getProjects(req: Request<WorkspaceParams>, res: Response) {
  const { workspaceId } = req.params;
  const workSpaceProjects = projects.filter(
    (project) => project.workspaceId === workspaceId,
  );
  res.json(workSpaceProjects);
}
