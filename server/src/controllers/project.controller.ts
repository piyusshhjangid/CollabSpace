import type { Request, Response } from "express";
import { getProjectsByWorkspace, createProjectService } from "../services/project.service.js";
import type { CreateProjectBody } from "../schemas/project.schema.js";

interface WorkspaceParams {
  workspaceId: string;
}

export async function getProjects(req: Request<WorkspaceParams>, res: Response) {
  const { workspaceId } = req.params;

  if (!workspaceId) {
    return res.status(400).json({
      message: "Workspace ID is required",
    });
  }

  const workSpaceProjects = await getProjectsByWorkspace(workspaceId);
  res.json(workSpaceProjects);
}

export async function createProject(
  req: Request<WorkspaceParams, {}, CreateProjectBody>,
  res: Response,
) {
  const { workspaceId } = req.params;
  const { name, description } = req.body;

  if (!workspaceId) {
    return res.status(400).json({
      message: "Workspace ID is required",
    });
  }
  try {
      const project = await createProjectService(workspaceId, name, description);
  
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({
        message: (error as Error).message,
      });
    }
}