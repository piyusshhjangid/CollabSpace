import SideBar from "./SideBar";
import TopBar from "./TopBar";
import { fetchWorkspaceRole, fetchWorkspaces } from "../../api/workspaces";
import { useEffect, useState } from "react";
import type { Workspace } from "../../types/workspace";
import { WorkspaceContext } from "../../context/WorkspaceContext";


interface ShellProps {
  children: React.ReactNode;
}

export default function Shell({ children }: ShellProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] =
    useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadWorkspaces() {
      try {
        const data = await fetchWorkspaces();

        setWorkspaces(data);
        setCurrentWorkspace(data[0] ?? null);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load workspaces",
        );
      } finally {
        setLoading(false);
      }
    }

    loadWorkspaces();
  }, []);

  useEffect(() => {
  if (!currentWorkspace) return;

  async function loadCurrentRole() {
    try {
      const role = await fetchWorkspaceRole(currentWorkspace.id);

      setCurrentWorkspace((previous) => {
        if (!previous || previous.id !== currentWorkspace.id) {
          return previous;
        }

        if (previous.role === role) {
          return previous;
        }

        return {
          ...previous,
          role,
        };
      });

      setWorkspaces((previous) =>
        previous.map((workspace) =>
          workspace.id === currentWorkspace.id &&
          workspace.role !== role
            ? { ...workspace, role }
            : workspace,
        ),
      );
    } catch (error) {
      console.error("Failed to load workspace role:", error);
    }
  }

  loadCurrentRole();
}, [currentWorkspace?.id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-100">
        <p className="text-zinc-500">Loading workspaces...</p>
      </div>
    );
  }

  

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-100">
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-100">
        <p className="text-zinc-500">No workspaces available.</p>
      </div>
    );
  }

  

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        setCurrentWorkspace,
        workspaces,
      }}
    >
      <div className="flex h-screen overflow-hidden">
        <SideBar />

        <div className="flex flex-1 flex-col">
          <TopBar
            currentWorkspace={currentWorkspace}
            setCurrentWorkspace={setCurrentWorkspace}
            workspaces={workspaces}
          />

          <main className="flex-1 overflow-y-auto bg-zinc-100 p-6">
            {children}
          </main>
        </div>
      </div>
    </WorkspaceContext.Provider>
  );
}