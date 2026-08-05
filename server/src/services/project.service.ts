import { projects } from "../data/fakeStore.js";

export function getProjectsByWorkspace(workspaceId: string) {
  return projects.filter((project) => project.workspaceId === workspaceId);
}
