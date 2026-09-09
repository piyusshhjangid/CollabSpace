import { prisma } from "../db/prisma.js";

export async function findProjectsByWorkspace(workspaceId: string) {
  const projects = await prisma.projects.findMany({
    where: {
      workspace_id: workspaceId,
    },
    orderBy: {
      created_at: "desc",
    },
  });

  return projects.map((project) => ({
    id: project.id,
    workspaceId: project.workspace_id,
    name: project.name,
    description: project.description ?? undefined,
    createdAt: project.created_at,
  }));
}

export async function createProject(
  workspaceId: string,
  name: string,
  description: string | undefined,
) {
  const project = await prisma.projects.create({
    data: {
      workspace_id: workspaceId,
      name,
      description: description ?? null,
    },
  });

  return {
    id: project.id,
    workspaceId: project.workspace_id,
    name: project.name,
    description: project.description ?? undefined,
    createdAt: project.created_at,
  };
}

// findById()

// update()

// delete()
