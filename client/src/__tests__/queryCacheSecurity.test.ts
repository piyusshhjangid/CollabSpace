import { describe, it, expect } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { workspaceKeys } from "../hooks/useWorkspaces";
import { projectKeys } from "../hooks/useProjects";
import { taskKeys } from "../hooks/useTasks";

describe("TanStack Query cache isolation on logout", () => {
  it("removes user-specific workspaces, projects, and tasks on logout", () => {
    const queryClient = new QueryClient();

    // Populate user cache with mock sensitive data
    queryClient.setQueryData(workspaceKeys.all, [
      { id: "ws-1", name: "User 1 Secret Workspace", role: "OWNER" },
    ]);
    queryClient.setQueryData(projectKeys.workspace("ws-1"), [
      { id: "p-1", name: "Confidential Project A" },
    ]);
    queryClient.setQueryData(taskKeys.project("ws-1", "p-1"), [
      { id: "t-1", title: "Sensitive Task 1" },
    ]);

    // Public / static cache
    queryClient.setQueryData(["public-app-config"], { version: "1.0.0" });

    // Verify cache exists before logout
    expect(queryClient.getQueryData(workspaceKeys.all)).toBeDefined();
    expect(queryClient.getQueryData(projectKeys.workspace("ws-1"))).toBeDefined();
    expect(queryClient.getQueryData(taskKeys.project("ws-1", "p-1"))).toBeDefined();

    // Perform selective cache purge as done in AuthContext / logout
    queryClient.removeQueries({ queryKey: workspaceKeys.all });
    queryClient.removeQueries({ queryKey: projectKeys.all });
    queryClient.removeQueries({ queryKey: taskKeys.all });

    // User data MUST be purged
    expect(queryClient.getQueryData(workspaceKeys.all)).toBeUndefined();
    expect(queryClient.getQueryData(projectKeys.workspace("ws-1"))).toBeUndefined();
    expect(queryClient.getQueryData(taskKeys.project("ws-1", "p-1"))).toBeUndefined();

    // Safe public data is preserved
    expect(queryClient.getQueryData(["public-app-config"])).toEqual({ version: "1.0.0" });
  });
});
