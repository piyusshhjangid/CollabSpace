import type { RequestHandler } from "express";
import type { CreateTaskBody } from "../schemas/task.schema.js";
import {
  getTasksByProject,
  createTaskService,
} from "../services/task.service.js";
import { badRequest, unauthorized } from "../lib/AppError.js";
import type { ApiResponse } from "../types/apiResponse.js";
import type { Task } from "../types/task.js";

export const getTasks: RequestHandler = async (req, res) => {
  const projectId = req.params.projectId;
  const workspaceId = req.query.workspaceId;
  const userId = req.user?.id;

  if (typeof projectId !== "string") {
    throw badRequest("projectId is required");
  }

  if (typeof workspaceId !== "string") {
    throw badRequest("Workspace ID is required");
  }

  if (!userId) {
    throw unauthorized("Authentication required");
  }

  const projectTasks = await getTasksByProject(
    projectId,
    workspaceId,
    userId,
  );

  const response: ApiResponse<Task[]> = {
    success: true,
    message: "Tasks fetched",
    data: projectTasks,
  };

  res.json(response);
};

export const createTask: RequestHandler = async (req, res) => {
  const projectId = req.params.projectId;
  const workspaceId = req.query.workspaceId;
  const userId = req.user?.id;
  const { title, completed } = req.body as CreateTaskBody;

  if (typeof projectId !== "string") {
    throw badRequest("projectId is required");
  }

  if (typeof workspaceId !== "string") {
    throw badRequest("Workspace ID is required");
  }

  if (!userId) {
    throw unauthorized("Authentication required");
  }

  if (!title) {
    throw badRequest("Title is required");
  }

  const task = await createTaskService(
    projectId,
    workspaceId,
    userId,
    title,
    completed,
  );

  const response: ApiResponse<Task> = {
    success: true,
    message: "Task created successfully",
    data: task,
  };

  res.status(201).json(response);
};