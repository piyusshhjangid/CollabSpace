import {
  findTasksByProject,
  createTask,
} from "../repositories/task.repository.js";
import type { Task } from "../types/task.js";

export async function getTasksByProject(projectId: string) {
  return await findTasksByProject(projectId);
}

export function createTaskService(
  projectId: string,
  title: string,
  completed: boolean | undefined,
) {
  if (title.trim() === "") {
    throw new Error("Task title is required");
  }
  const task: Task = {
    id: `t${Date.now()}`,
    projectId,
    title,
    completed: completed ?? false,
  };
  
  return createTask(task);
}
