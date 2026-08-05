import type { Request, Response } from "express";
import type { CreateTaskBody } from "../types/requests.js";
import {
  getTasksByProject,
  createTaskService,
} from "../services/task.service.js";

interface TaskParams {
  projectId: string;
}

export function getTasks(req: Request<TaskParams>, res: Response) {
  const projectId = req.params.projectId;
  const projectTasks = getTasksByProject(projectId);
  res.json(projectTasks);
}

export function createTask(
  req: Request<TaskParams, {}, CreateTaskBody>,
  res: Response,
) {
  const projectId = req.params.projectId;
  const { title, completed } = req.body;
  if (!title) {
    return res.status(400).json({
      message: "Title is required",
    });
  }

  try {
    const task = createTaskService(projectId, title, completed);

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
}
