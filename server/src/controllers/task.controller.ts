import type { RequestHandler } from "express";
import type { CreateTaskBody } from "../schemas/task.schema.js";
import { getTasksByProject, createTaskService } from "../services/task.service.js";
import { badRequest } from "../lib/AppError.js";

interface TaskParams {
  projectId: string;
}

export const getTasks: RequestHandler<TaskParams> = async (req, res) => {
  const { projectId } = req.params;

  if (!projectId) {
    throw badRequest("projectId is required");
  }

  const projectTasks = await getTasksByProject(projectId);
  res.json(projectTasks);
};

export const createTask: RequestHandler<TaskParams, any, CreateTaskBody> = async (req, res) => {
  const { projectId } = req.params;
  const { title, completed } = req.body;

  if (!projectId) {
    throw badRequest("projectId is required");
  }

  if (!title) {
    throw badRequest("Title is required");
  }

  const task = await createTaskService(projectId, title, completed);
  res.status(201).json(task);
};
