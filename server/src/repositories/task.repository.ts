import { prisma } from "../db/prisma.js";

export async function findTasksByProject(
  projectId: string,
  workspaceId: string,
) {
  const tasks = await prisma.tasks.findMany({
    where: {
      project_id: projectId,
      workspace_id: workspaceId,
    },
    include: {
      users: true,
      projects: true,
    },
  });

  return tasks.map((task) => ({
    id: task.id,
    projectId: task.project_id,
    title: task.title,
    completed: task.completed,
    project: task.projects.name,
    assigned_to: task.users?.name ?? null,
  }));
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
  data: {
    title?: string | undefined;
    completed?: boolean | undefined;
    status?: string | undefined;
  },
) {
  const updateData: {
    title?: string;
    completed?: boolean;
    status?: string;
  } = {};

  if (data.title !== undefined) {
    updateData.title = data.title;
  }

  if (data.completed !== undefined) {
    updateData.completed = data.completed;
  }

  if (data.status !== undefined) {
    updateData.status = data.status;
  }

  const updated = await prisma.tasks.updateMany({
    where: {
      id: taskId,
      workspace_id: workspaceId,
    },
    data: updateData,
  });

  if (updated.count === 0) {
    throw new Error("Task not found");
  }

  return prisma.tasks.findFirst({
    where: {
      id: taskId,
      workspace_id: workspaceId,
    },
  });
}