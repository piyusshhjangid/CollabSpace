import { projects } from "../data/fakeStore.js";
import type { Project } from "../types/project.js";

export async function findProjectsByWorkspace(workspaceId: string) {
  return projects.filter(
    (project) => project.workspaceId === workspaceId,
  );
}

export async function createProject(project: Project) {
  projects.push(project);

  return project;
}

// findById()

// update()

// delete()