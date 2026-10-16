import type { RequestHandler } from "express";

import type { CreateTaskBody, UpdateTaskBody } from "../schemas/task.schema.js";

import {
  getTasksByProject,
  createTaskService,
  updateTaskService,
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

  const rawLimit = req.query.limit;
  const rawCursor = req.query.cursor;

  let limit = 20;

  if (rawLimit !== undefined) {
    if (typeof rawLimit !== "string") {
      throw badRequest("Invalid limit");
    }

    const parsedLimit = Number(rawLimit);

    if (
      !Number.isInteger(parsedLimit) ||
      parsedLimit < 1 ||
      parsedLimit > 100
    ) {
      throw badRequest("limit must be an integer between 1 and 100");
    }

    limit = parsedLimit;
  }

  const cursor =
    typeof rawCursor === "string" ? rawCursor : undefined;

  const result = await getTasksByProject(
    projectId,
    workspaceId,
    userId,
    limit,
    cursor,
  );

  const response: ApiResponse<Task[]> & {
    meta: {
      limit: number;
      nextCursor: string | null;
      hasMore: boolean;
    };
  } = {
    success: true,
    message: "Tasks fetched",
    data: result.items,
    meta: {
      limit,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    },
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

export const updateTask: RequestHandler = async (req, res) => {
  const taskId = req.params.taskId;
  const userId = req.user?.id;

  if (typeof taskId !== "string") {
    throw badRequest("taskId is required");
  }

  if (!userId) {
    throw unauthorized("Authentication required");
  }

  if (!req.workspace) {
    throw badRequest("Workspace context is required");
  }

  const body = req.body as UpdateTaskBody;

  const task = await updateTaskService(
    taskId,
    req.workspace.id,
    userId,
    req.workspace.role,
    body,
  );

  const response: ApiResponse<typeof task> = {
    success: true,
    message: "Task updated successfully",
    data: task,
  };

  res.json(response);
};
