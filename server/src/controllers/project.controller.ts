import type { RequestHandler } from "express";
import {
  getProjectsByWorkspace,
  createProjectService,
  deleteProjectService,
  setProjectOutcomeService,
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
  const { name, description, outcomeId } = req.body;

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
    outcomeId,
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

export const deleteProject: RequestHandler = async (
  req,
  res,
) => {
  const projectId = req.params.projectId;

  if (typeof projectId !== "string") {
    throw badRequest("Project ID is required");
  }

  if (!req.workspace) {
    throw badRequest(
      "Workspace context is required",
    );
  }

  const userId = req.user?.id;



  if (!userId) {


    throw unauthorized("Authentication required");


  }



  const result = await deleteProjectService(


    projectId,


    req.workspace.id,


    userId,


  );

  const response: ApiResponse<typeof result> = {
    success: true,
    message: "Project deleted successfully",
    data: result,
  };

  res.json(response);
};

export const updateProjectOutcome: RequestHandler = async (req, res) => {
  const projectId = req.params.projectId;
  if (typeof projectId !== "string" || !req.workspace) throw badRequest("Project and workspace are required");
  const data = await setProjectOutcomeService(projectId, req.workspace.id, req.body.outcomeId);
  const response: ApiResponse<typeof data> = { success: true, message: "Project outcome updated", data };
  res.json(response);
};
