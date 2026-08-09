import type { Request, Response } from "express";
import type { CreateTaskBody } from "../schemas/task.schema.js";
import {
  getTasksByProject,
  createTaskService,
} from "../services/task.service.js";

interface TaskParams {
  projectId: string;
}

export async function getTasks(req: Request<TaskParams>, res: Response) {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({ message: "projectId is required" });
    }

    const projectTasks = await getTasksByProject(projectId);
    res.json(projectTasks);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
}


export async function createTask(
  req: Request<TaskParams, {}, CreateTaskBody>,
  res: Response,
) {
  const projectId = req.params.projectId;
  const { title, completed } = req.body;

  if (!projectId) {
    return res.status(400).json({ message: "projectId is required" });
  }

  try {
    const task = await createTaskService(projectId, title, completed);

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({
      message: (error as Error).message,
    });
  }
}
