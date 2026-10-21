import { prisma } from "../db/prisma.js";

export async function findProjectByWorkspace(
  projectId: string,
  workspaceId: string,
) {
  return prisma.projects.findFirst({
    where: {
      id: projectId,
      workspace_id: workspaceId,
    },
    select: {
      id: true,
      workspace_id: true,
    },
  });
}

export async function findProjectsByWorkspace(workspaceId: string) {
  const projects = await prisma.projects.findMany({
    where: {
      workspace_id: workspaceId,
    },
    orderBy: {
      created_at: "desc",
    },
    include: { _count: { select: { tasks: true } } },
  });

  return projects.map((project) => ({
    id: project.id,
    workspaceId: project.workspace_id,
    name: project.name,
    description: project.description ?? undefined,
    outcomeId: project.outcome_id ?? undefined,
    taskCount: project._count.tasks,
    createdAt: project.created_at,
  }));
}

export async function createProject(
  workspaceId: string,
  name: string,
  description: string | undefined,
  outcomeId?: string,
) {
  const project = await prisma.projects.create({
    data: {
      workspace_id: workspaceId,
      name,
      description: description ?? null,
      outcome_id: outcomeId ?? null,
    },
  });

  return {
    id: project.id,
    workspaceId: project.workspace_id,
    name: project.name,
    description: project.description ?? undefined,
    outcomeId: project.outcome_id ?? undefined,
    taskCount: 0,
    createdAt: project.created_at,
  };
}

export async function deleteProject(
  projectId: string,
  workspaceId: string,
) {
  const deleted = await prisma.projects.deleteMany({
    where: {
      id: projectId,
      workspace_id: workspaceId,
    },
  });

  if (deleted.count === 0) {
    throw new Error("Project not found");
  }

  return {
    id: projectId,
    workspaceId,
  };
}

export async function setProjectOutcome(projectId: string, workspaceId: string, outcomeId: string | null) {
  const updated = await prisma.projects.updateMany({ where: { id: projectId, workspace_id: workspaceId }, data: { outcome_id: outcomeId } });
  if (!updated.count) throw new Error("Project not found");
  return { id: projectId, workspaceId, outcomeId };
}
