import { useQuery } from "@tanstack/react-query";
import { fetchWorkspaces } from "../api/workspaces";

export const workspaceKeys = {
  all: ["workspaces"] as const,
};

export function useWorkspaces() {
  return useQuery({
    queryKey: workspaceKeys.all,
    queryFn: fetchWorkspaces,
  });
}
