import { prisma } from "../db/prisma.js";
import {
  decodeTaskCursor,
  encodeTaskCursor,
} from "../lib/taskCursor.js";

export async function findTasksByProject(
  projectId: string,
  workspaceId: string,
  limit: number,
  cursor?: string,
) {
  const decodedCursor = cursor ? decodeTaskCursor(cursor) : undefined;

  const tasks = await prisma.tasks.findMany({
    where: {
      project_id: projectId,
      workspace_id: workspaceId,
      ...(decodedCursor
        ? {
            OR: [
              {
                created_at: {
                  lt: new Date(decodedCursor.createdAt),
                },
              },
              {
                created_at: new Date(decodedCursor.createdAt),
                id: {
                  lt: decodedCursor.id,
                },
              },
            ],
          }
        : {}),
    },
    orderBy: [
      {
        created_at: "desc",
      },
      {
        id: "desc",
      },
    ],
    take: limit + 1,
    include: {
      users: true,
      projects: true,
    },
  });

  const hasMore = tasks.length > limit;
  const pageTasks = hasMore ? tasks.slice(0, limit) : tasks;

  const items = pageTasks.map((task) => ({
    id: task.id,
    projectId: task.project_id,
    title: task.title,
    completed: task.completed,
    project: task.projects.name,
    assigned_to: task.users?.name ?? null,
  }));

  const lastTask = pageTasks[pageTasks.length - 1];

  const nextCursor =
    hasMore && lastTask
      ? encodeTaskCursor({
          createdAt: lastTask.created_at.toISOString(),
          id: lastTask.id,
        })
      : null;

  return {
    items,
    nextCursor,
    hasMore,
  };
}

export async function createTask(
  projectId: string,
  workspaceId: string,
  title: string,
  completed: string,
  _id: string,
) {
  const project = await prisma.projects.findFirst({
    where: {
      id: projectId,
      workspace_id: workspaceId,
    },
    select: {
      workspace_id: true,
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const task = await prisma.tasks.create({
    data: {
      project_id: projectId,
      workspace_id: workspaceId,
      title,
      completed: completed === "true",
    },
  });

  return {
    id: task.id,
    projectId: task.project_id,
    title: task.title,
    completed: task.completed,
  };
}

export async function getOverdueTasks(workspaceId: string) {
  return prisma.tasks.findMany({
    where: {
      workspace_id: workspaceId,
      due_date: {
        lt: new Date(),
      },
      status: {
        not: "DONE",
      },
    },
    orderBy: {
      due_date: "asc",
    },
  });
}

export async function getTaskCountsByStatus(
  projectId: string,
  workspaceId: string,
) {
  const tasks = await prisma.tasks.findMany({
    where: {
      project_id: projectId,
      workspace_id: workspaceId,
    },
    select: {
      status: true,
    },
  });

  const counts = new Map<string, number>();

  for (const task of tasks) {
    counts.set(task.status, (counts.get(task.status) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([status, task_count]) => ({
      status,
      task_count: String(task_count),
    }))
    .sort((a, b) => a.status.localeCompare(b.status));
}

export async function findTaskForUpdate(
  taskId: string,
  workspaceId: string,
) {
  return prisma.tasks.findFirst({
    where: {
      id: taskId,
      workspace_id: workspaceId,
    },
    select: {
      id: true,
      workspace_id: true,
      project_id: true,
      assigned_to: true,
      title: true,
      completed: true,
      status: true,
    },
  });
}

export async function updateTask(
  taskId: string,
  workspaceId: string,
  changedBy: string,
  data: {
    title?: string | undefined;
    completed?: boolean | undefined;
    status?: string | undefined;
  },
) {
  return prisma.$transaction(async (tx) => {
    const currentTask = await tx.tasks.findFirst({
      where: {
        id: taskId,
        workspace_id: workspaceId,
      },
      select: {
        id: true,
        workspace_id: true,
        project_id: true,
        assigned_to: true,
        title: true,
        completed: true,
        status: true,
      },
    });

    if (!currentTask) {
      throw new Error("Task not found");
    }

    const updateData: {
      title?: string;
      completed?: boolean;
      completed_at?: Date | null;
      status?: string;
    } = {};

    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    if (data.completed !== undefined) {
      updateData.completed = data.completed;
      updateData.completed_at = data.completed ? new Date() : null;
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    const statusChanged =
      data.status !== undefined && data.status !== currentTask.status;

    const updated = await tx.tasks.updateMany({
      where: {
        id: taskId,
        workspace_id: workspaceId,
        ...(statusChanged
          ? { status: currentTask.status }
          : {}),
      },
      data: updateData,
    });

    if (updated.count === 0) {
      throw new Error("Task was modified by another request");
    }

    if (statusChanged) {
      await tx.task_status_history.create({
        data: {
          task_id: currentTask.id,
          workspace_id: currentTask.workspace_id,
          from_status: currentTask.status,
          to_status: data.status!,
          changed_by: changedBy,
        },
      });
    }

    return tx.tasks.findFirst({
      where: {
        id: taskId,
        workspace_id: workspaceId,
      },
    });
  });
}