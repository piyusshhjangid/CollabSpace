import { prisma } from "../db/prisma.js";

export async function findAllWorkspaces() {
  return prisma.workspaces.findMany({
    orderBy: {
      created_at: "desc",
    },
  });
}

// findById()

// create()

// update()

// delete()