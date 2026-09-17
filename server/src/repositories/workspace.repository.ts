import { prisma } from "../db/prisma.js";

export async function findWorkspacesByUser(userId: string) {
  const memberships = await prisma.workspace_members.findMany({
    where: {
      user_id: userId,
    },
    include: {
      workspaces: true,
    },
    orderBy: {
      created_at: "desc",
    },
  });

  return memberships.map((membership) => ({
    id: membership.workspaces.id,
    name: membership.workspaces.name,
    createdAt: membership.workspaces.created_at,
    role: membership.role,
  }));
}

export async function createWorkspaceWithOwner(
  userId: string,
  name: string,
) {
  return prisma.$transaction(async (tx) => {
    const workspace = await tx.workspaces.create({
      data: {
        name,
      },
    });

    const membership = await tx.workspace_members.create({
      data: {
        user_id: userId,
        workspace_id: workspace.id,
        role: "OWNER",
      },
    });

    return {
      workspace,
      membership,
    };
  });
}

// findById()
// create()
// update()
// delete()