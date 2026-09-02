import {
  findTasksByProject,
  createTask,
  getOverdueTasks,
  getTaskCountsByStatus
} from "../repositories/task.repository.js";
import type { Task } from "../types/task.js";
import { badRequest } from "../lib/AppError.js";

export async function getTasksByProject(projectId: string) {
  return await findTasksByProject(projectId);
}

export function createTaskService(
  projectId: string,
  title: string,
  completed: boolean | undefined,
) {
  if (title.trim() === "") {
    throw badRequest("Task title is required");
  }

  const task: Task = {
    id: `t${Date.now()}`,
    projectId,
    title,
    completed: completed ?? false,
  };

  return createTask(task.projectId, task.title, String(task.completed), task.id);
}

export async function getOverdueTasksService() {
  return getOverdueTasks();
}

export async function getTaskCountsByStatusService(projectId: string) {
  return getTaskCountsByStatus(projectId);
}
