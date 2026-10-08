import { useQuery } from "@tanstack/react-query";
import { fetchWorkspaceRole } from "../api/workspaces";

export const workspaceRoleKeys = {
  all: ["workspace-role"] as const,
  detail: (workspaceId: string) =>
    ["workspace-role", workspaceId] as const,
};

export function useWorkspaceRole(workspaceId: string | null) {
  return useQuery({
    queryKey: workspaceRoleKeys.detail(workspaceId ?? ""),
    queryFn: () => fetchWorkspaceRole(workspaceId!),
    enabled: Boolean(workspaceId),
  });
}
