import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWorkspaces, createWorkspace, acceptInvitation } from "../api/workspaces";
import { useAppDispatch } from "../store/hooks";
import { setCurrentWorkspaceId } from "../store/slices/uiSlice";
import { workspaceRoleKeys } from "./useWorkspaceRole";
import { projectKeys } from "./useProjects";
import type { Workspace } from "../types/workspace";

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
 * On success:
 * 1. Seeds the TanStack Query cache immediately so subsequent renders see the new workspace.
 * 2. Seeds the workspace role cache for the creator with trusted backend-assigned OWNER role.
 * 3. Sets current workspace in Redux.
 * 4. Refetches workspace list from the server to guarantee canonical consistency.
 */
export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (name: string) => createWorkspace({ name }),
    onSuccess: async (newWorkspace) => {
      // 1. Immediately seed the workspace list cache with the created workspace
      queryClient.setQueryData<Workspace[]>(workspaceKeys.all, (oldWorkspaces = []) => {
        const exists = oldWorkspaces.some((w) => w.id === newWorkspace.id);
        if (exists) return oldWorkspaces;
        return [...oldWorkspaces, newWorkspace];
      });

      // 2. Immediately seed role cache for creator (OWNER assigned by backend)
      queryClient.setQueryData(
        workspaceRoleKeys.detail(newWorkspace.id),
        newWorkspace.role,
      );

      // 3. Immediately select the new workspace in Redux
      dispatch(setCurrentWorkspaceId(newWorkspace.id));

      // 4. Refetch workspaces query to ensure complete synchronization with backend
      await queryClient.refetchQueries({
        queryKey: workspaceKeys.all,
      });
    },
  });
}

/**
 * Mutation to accept an invitation token.
 * On success:
 * 1. Seeds role cache for the joined workspace.
 * 2. Sets current workspace in Redux.
 * 3. Refetches workspace list so the newly joined workspace is populated.
 * 4. Invalidates project and task caches.
 */
export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (token: string) => acceptInvitation({ token }),
    onSuccess: async (result) => {
      // 1. Seed role cache with member role returned by server
      queryClient.setQueryData(
        workspaceRoleKeys.detail(result.workspaceId),
        result.role,
      );

      // 2. Immediately select the joined workspace in Redux
      dispatch(setCurrentWorkspaceId(result.workspaceId));

      // 3. Refetch workspace list from backend
      await queryClient.refetchQueries({
        queryKey: workspaceKeys.all,
      });

      // 4. Invalidate project caches for this workspace
      queryClient.invalidateQueries({
        queryKey: projectKeys.workspace(result.workspaceId),
      });
    },
  });
}
