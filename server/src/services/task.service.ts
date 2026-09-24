import {
  findTasksByProject,
  createTask,
  getOverdueTasks,
  getTaskCountsByStatus,
} from "../repositories/task.repository.js";
import { findWorkspaceMembership } from "../repositories/workspace.repository.js";
import type { Task } from "../types/task.js";
import { badRequest, forbidden } from "../lib/AppError.js";

async function verifyWorkspaceMember(
  workspaceId: string,
  userId: string,
) {
  const membership = await findWorkspaceMembership(
    workspaceId,
    userId,
  );

  if (!membership) {
    throw forbidden("You are not a member of this workspace");
  }
}

export async function getTasksByProject(
  projectId: string,
  workspaceId: string,
  userId: string,
) {
  await verifyWorkspaceMember(workspaceId, userId);

  return findTasksByProject(
    projectId,
    workspaceId,
  );
}

export async function createTaskService(
  projectId: string,
  workspaceId: string,
  userId: string,
  title: string,
  completed: boolean | undefined,
) {
  await verifyWorkspaceMember(workspaceId, userId);

  if (title.trim() === "") {
    throw badRequest("Task title is required");
  }

  const task: Task = {
    id: `t${Date.now()}`,
    projectId,
    title,
    completed: completed ?? false,
  };

  return createTask(
    task.projectId,
    workspaceId,
    task.title,
    String(task.completed),
    task.id,
  );
}

export async function getOverdueTasksService(
  workspaceId: string,
  userId: string,
) {
  await verifyWorkspaceMember(workspaceId, userId);

  return getOverdueTasks(workspaceId);
}

export async function getTaskCountsByStatusService(
  projectId: string,
  workspaceId: string,
  userId: string,
) {
  await verifyWorkspaceMember(workspaceId, userId);

  return getTaskCountsByStatus(
    projectId,
    workspaceId,
  );
}