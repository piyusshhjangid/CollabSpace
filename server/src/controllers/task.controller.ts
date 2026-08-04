import type { Request, Response } from "express";
import { tasks } from "../data/fakeStore.js";
import type { Task } from "../types/task.js";
import type { CreateTaskBody } from "../types/requests.js";

interface TaskParams {
  projectId: string;
}

export function getTasks(req: Request<TaskParams>, res: Response) {
  const projectId = req.params.projectId;
  const projectTasks = tasks.filter((task) => task.projectId === projectId);
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

  const newTask: Task = {
    id: `t${tasks.length + 1}`,
    projectId,
    title,
    completed: completed ?? false,
  };

  tasks.push(newTask);

  res.status(201).json(newTask);
}
