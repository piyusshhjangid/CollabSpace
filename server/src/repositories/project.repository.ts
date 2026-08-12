import { projects, workspaces } from "../data/fakeStore.js";
import type { Project } from "../types/project.js";
import { notFound } from "../lib/AppError.js";

export async function findProjectsByWorkspace(workspaceId: string) {
  const workspace = workspaces.find((w) => w.id === workspaceId);

  if (!workspace) {
    throw notFound("Workspace not found");
  }

  return projects.filter((p) => p.workspaceId === workspaceId);
}

export async function createProject(project: Project) {
  projects.push(project);

  return project;
}

// findById()

// update()

// delete()
