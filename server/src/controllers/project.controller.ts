import type { RequestHandler } from "express";
import { getProjectsByWorkspace, createProjectService } from "../services/project.service.js";
import type { CreateProjectBody } from "../schemas/project.schema.js";
import { badRequest } from "../lib/AppError.js";
import type { Project } from "../types/project.js";
import type { ApiResponse } from "../types/apiResponse.js";
import { getTaskCountsByStatusService } from "../services/task.service.js";

interface WorkspaceParams {
  workspaceId: string;
}

export const getProjects: RequestHandler<WorkspaceParams> = async (req, res) => {
  const { workspaceId } = req.params;

  if (!workspaceId) {
    throw badRequest("Workspace ID is required");
  }

  const workSpaceProjects = await getProjectsByWorkspace(workspaceId);
  const response: ApiResponse<Project[]> = {
    success: true,
    message: "Projects fetched",
    data: workSpaceProjects,
  };

  res.json(response);
};

export const createProject: RequestHandler<WorkspaceParams, any, CreateProjectBody> = async (req, res) => {
  const { workspaceId } = req.params;
  const { name, description } = req.body;

  if (!workspaceId) {
    throw badRequest("Workspace ID is required");
  }

  if (!name) {
    throw badRequest("Title is required");
  }

  const project = await createProjectService(workspaceId, name, description);
  const response: ApiResponse<Project> = {
    success: true,
    message: "Project created successfully",
    data: project,
  };

  res.status(201).json(response);
};

export const getProjectSummary: RequestHandler<{ projectId: string }> = async (req, res) => {
  const { projectId } = req.params;

  if (!projectId) {
    throw badRequest("Project ID is required");
  }

  const taskCounts = await getTaskCountsByStatusService(projectId);

  const response: ApiResponse<{ projectId: string; taskCounts: Awaited<ReturnType<typeof getTaskCountsByStatusService>> }> = {
    success: true,
    message: "Project summary fetched",
    data: {
      projectId,
      taskCounts,
    },
  };

  res.json(response);
};