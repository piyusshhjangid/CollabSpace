import { useQuery } from "@tanstack/react-query";
import { fetchTasks } from "../api/tasks";

export const taskKeys = {
  all: ["tasks"] as const,

  project: (workspaceId: string, projectId: string) =>
    ["tasks", workspaceId, projectId] as const,
};

export function useTasks(
  workspaceId: string | null,
  projectId: string | null,
) {
  return useQuery({
    queryKey: taskKeys.project(
      workspaceId ?? "",
      projectId ?? "",
    ),
    queryFn: () => fetchTasks(workspaceId!, projectId!),
    enabled: Boolean(workspaceId && projectId),
  });
}
