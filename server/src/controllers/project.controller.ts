import type { RequestHandler } from "express";
import {
  getProjectsByWorkspace,
  createProjectService,
} from "../services/project.service.js";
import type { CreateProjectBody } from "../schemas/project.schema.js";
import { badRequest, unauthorized } from "../lib/AppError.js";
import type { Project } from "../types/project.js";
import type { ApiResponse } from "../types/apiResponse.js";
import { getTaskCountsByStatusService } from "../services/task.service.js";

export const getProjects: RequestHandler = async (req, res) => {
  const workspaceId = req.params.workspaceId;
  const userId = req.user?.id;

  if (typeof workspaceId !== "string") {
    throw badRequest("Workspace ID is required");
  }

  if (!userId) {
    throw unauthorized("Authentication required");
  }

  const workSpaceProjects = await getProjectsByWorkspace(
    workspaceId,
    userId,
  );

  const response: ApiResponse<Project[]> = {
    success: true,
    message: "Projects fetched",
    data: workSpaceProjects,
  };

  res.json(response);
};

export const createProject: RequestHandler = async (req, res) => {
  const workspaceId = req.params.workspaceId;
  const userId = req.user?.id;
  const { name, description } = req.body;

  if (typeof workspaceId !== "string") {
    throw badRequest("Workspace ID is required");
  }

  if (!userId) {
    throw unauthorized("Authentication required");
  }

  if (!name) {
    throw badRequest("Title is required");
  }

  const project = await createProjectService(
    workspaceId,
    userId,
    name,
    description,
  );

  const response: ApiResponse<Project> = {
    success: true,
    message: "Project created successfully",
    data: project,
  };

  res.status(201).json(response);
};

export const getProjectSummary: RequestHandler = async (req, res) => {
  const projectId = req.params.projectId;
  const workspaceId = req.query.workspaceId;
  const userId = req.user?.id;

  if (typeof projectId !== "string") {
    throw badRequest("Project ID is required");
  }

  if (typeof workspaceId !== "string") {
    throw badRequest("Workspace ID is required");
  }

  if (!userId) {
    throw unauthorized("Authentication required");
  }

  const taskCounts = await getTaskCountsByStatusService(
    projectId,
    workspaceId,
    userId,
  );

  const response: ApiResponse<{
    projectId: string;
    taskCounts: Awaited<
      ReturnType<typeof getTaskCountsByStatusService>
    >;
  }> = {
    success: true,
    message: "Project summary fetched",
    data: {
      projectId,
      taskCounts,
    },
  };

  res.json(response);
};