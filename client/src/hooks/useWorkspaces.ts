import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWorkspaces, createWorkspace, acceptInvitation } from "../api/workspaces";
import { useAppDispatch } from "../store/hooks";
import { setCurrentWorkspaceId } from "../store/slices/uiSlice";
import { workspaceRoleKeys } from "./useWorkspaceRole";
import { projectKeys } from "./useProjects";

export const workspaceKeys = {
  all: ["workspaces"] as const,
};

export function useWorkspaces() {
  return useQuery({
    queryKey: workspaceKeys.all,
    queryFn: fetchWorkspaces,
  });
}

/**
 * Mutation to create a new workspace.
 * On success, invalidates the workspace list and selects the newly created workspace.
 * OWNER role is assigned by the backend; never by the client.
 */
export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (name: string) => createWorkspace({ name }),
    onSuccess: (newWorkspace) => {
      // Invalidate workspace list so it re-fetches with the new workspace included
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
      // Also invalidate role cache for clean state
      queryClient.invalidateQueries({ queryKey: workspaceRoleKeys.all });
      // Select the new workspace immediately
      dispatch(setCurrentWorkspaceId(newWorkspace.id));
    },
  });
}

/**
 * Mutation to accept an invitation token.
 * On success, invalidates workspace list so the newly joined workspace appears.
 * Role is determined by backend invitation logic; never by the client.
 */
export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (token: string) => acceptInvitation({ token }),
    onSuccess: (result) => {
      // Invalidate workspace list to include the newly joined workspace
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
      // Invalidate role cache for this workspace
      queryClient.invalidateQueries({
        queryKey: workspaceRoleKeys.detail(result.workspaceId),
      });
      // Invalidate project cache for this workspace
      queryClient.invalidateQueries({
        queryKey: projectKeys.workspace(result.workspaceId),
      });
      // Select the newly joined workspace
      dispatch(setCurrentWorkspaceId(result.workspaceId));
    },
  });
}
