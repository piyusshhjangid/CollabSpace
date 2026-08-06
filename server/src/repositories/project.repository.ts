import { projects } from "../data/fakeStore.js";

export async function findProjectsByWorkspace(workspaceId: string) {
  return projects.filter(
    (project) => project.workspaceId === workspaceId,
  );
}

// findById()

// create()

// update()

// delete()