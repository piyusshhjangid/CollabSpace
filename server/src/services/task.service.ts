import {
  findTasksByProject,
  createTask,
  getOverdueTasks,
  getTaskCountsByStatus,
  findTaskForUpdate,
  updateTask,
} from "../repositories/task.repository.js";

import { findWorkspaceMembership } from "../repositories/workspace.repository.js";
import { findProjectByWorkspace } from "../repositories/project.repository.js";

import type { Task } from "../types/task.js";

import { badRequest, forbidden } from "../lib/AppError.js";

import type { Role } from "../types/role.js";
import { canManageResource } from "../lib/resourceAuthorization.js";

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

  return membership;
}

async function verifyProjectWorkspace(
  projectId: string,
  workspaceId: string,
) {
  const project = await findProjectByWorkspace(
    projectId,
    workspaceId,
  );

  if (!project) {
    throw badRequest("Project not found");
  }

  return project;
}

export async function getTasksByProject(
  projectId: string,
  workspaceId: string,
  userId: string,
  limit: number,
  cursor?: string,
) {
  await verifyWorkspaceMember(workspaceId, userId);

  await verifyProjectWorkspace(
    projectId,
    workspaceId,
  );

  return findTasksByProject(
    projectId,
    workspaceId,
    limit,
    cursor,
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

  await verifyProjectWorkspace(
    projectId,
    workspaceId,
  );

  if (title.trim() === "") {
    throw badRequest("Task title is required");
  }

  const task: Task = {
    id: `t${Date.now()}`,
    projectId,
    title,
    completed: completed ?? false,
  };

  try {
    return await createTask(
      task.projectId,
      workspaceId,
      task.title,
      String(task.completed),
      task.id,
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Project not found"
    ) {
      throw badRequest("Project not found");
    }

    throw error;
  }
}

export async function updateTaskService(
  taskId: string,
  workspaceId: string,
  userId: string,
  role: Role,
  data: {
    title?: string | undefined;
    completed?: boolean | undefined;
    status?: string | undefined;
  },
) {
  const task = await findTaskForUpdate(
    taskId,
    workspaceId,
  );

  if (!task) {
    throw badRequest("Task not found");
  }

  const allowed = canManageResource(
    role,
    userId,
    task.assigned_to,
  );

  if (!allowed) {
    throw forbidden(
      "You can only update tasks assigned to you",
    );
  }

  if (
    data.title !== undefined &&
    data.title.trim() === ""
  ) {
    throw badRequest("Task title is required");
  }

  const updated = await updateTask(
    taskId,
    workspaceId,
    userId,
    data,
  );

  return {
    id: updated?.id ?? task.id,
    projectId: updated?.project_id ?? task.project_id,
    title: updated?.title ?? task.title,
    completed: updated?.completed ?? task.completed,
  };
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

  await verifyProjectWorkspace(
    projectId,
    workspaceId,
  );

  return getTaskCountsByStatus(
    projectId,
    workspaceId,
  );
}
