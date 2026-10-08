import { useQuery } from "@tanstack/react-query";
import { fetchProjects } from "../api/projects";

export const projectKeys = {
  all: ["projects"] as const,
  workspace: (workspaceId: string) =>
    ["projects", workspaceId] as const,
};

export function useProjects(workspaceId: string | null) {
  return useQuery({
    queryKey: projectKeys.workspace(workspaceId ?? ""),
    queryFn: () => fetchProjects(workspaceId!),
    enabled: Boolean(workspaceId),
  });
}
