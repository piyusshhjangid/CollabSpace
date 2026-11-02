import { useQuery } from "@tanstack/react-query";
import { fetchWorkspaceOverview } from "../api/workspaces";

export const workspaceOverviewKeys = {
  detail: (workspaceId: string) => ["workspace-overview", workspaceId] as const,
};

export function useWorkspaceOverview(workspaceId: string | null) {
  return useQuery({
    queryKey: workspaceOverviewKeys.detail(workspaceId ?? ""),
    queryFn: () => fetchWorkspaceOverview(workspaceId!),
    enabled: Boolean(workspaceId),
    refetchOnMount: "always",
  });
}
