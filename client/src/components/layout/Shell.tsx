import { useEffect, useMemo, useState, type ReactNode } from "react";
import SideBar from "./SideBar";
import TopBar from "./TopBar";
import PermissionNotice from "../PermissionNotice";
import { WorkspaceContext } from "../../context/WorkspaceContext";
import type { Workspace } from "../../types/workspace";
import { useWorkspaces } from "../../hooks/useWorkspaces";
import { useWorkspaceRole } from "../../hooks/useWorkspaceRole";
import {
  useAppDispatch,
  useAppSelector,
} from "../../store/hooks";
import { setCurrentWorkspaceId } from "../../store/slices/uiSlice";

interface ShellProps {
  children: ReactNode;
}

export default function Shell({ children }: ShellProps) {
  const dispatch = useAppDispatch();

  const currentWorkspaceId = useAppSelector(
    (state) => state.ui.currentWorkspaceId,
  );

  const {
    data: workspaces = [],
    isLoading,
    isError,
    error,
  } = useWorkspaces();

  const [permissionMessage, setPermissionMessage] =
    useState<string | null>(null);

  useEffect(() => {
    if (workspaces.length === 0) {
      if (currentWorkspaceId !== null) {
        dispatch(setCurrentWorkspaceId(null));
      }
      return;
    }

    const selectedWorkspaceExists = workspaces.some(
      (workspace) => workspace.id === currentWorkspaceId,
    );

    if (!selectedWorkspaceExists) {
      dispatch(setCurrentWorkspaceId(workspaces[0].id));
    }
  }, [workspaces, currentWorkspaceId, dispatch]);

  const currentWorkspace = useMemo<Workspace | null>(() => {
    if (!currentWorkspaceId) {
      return null;
    }

    return (
      workspaces.find(
        (workspace) => workspace.id === currentWorkspaceId,
      ) ?? null
    );
  }, [workspaces, currentWorkspaceId]);

  const { data: currentRole } = useWorkspaceRole(
    currentWorkspace?.id ?? null,
  );

  const workspaceForUi = useMemo<Workspace | null>(() => {
    if (!currentWorkspace) {
      return null;
    }

    if (!currentRole || currentRole === currentWorkspace.role) {
      return currentWorkspace;
    }

    return {
      ...currentWorkspace,
      role: currentRole,
    };
  }, [currentWorkspace, currentRole]);

  useEffect(() => {
    const handleForbidden = (event: Event) => {
      const customEvent = event as CustomEvent<{
        message?: string;
      }>;

      setPermissionMessage(
        customEvent.detail?.message ??
          "You don't have permission to perform this action.",
      );
    };

    window.addEventListener(
      "collabspace:forbidden",
      handleForbidden,
    );

    return () => {
      window.removeEventListener(
        "collabspace:forbidden",
        handleForbidden,
      );
    };
  }, []);

  const setCurrentWorkspace: React.Dispatch<
    React.SetStateAction<Workspace | null>
  > = (value) => {
    const nextWorkspace =
      typeof value === "function"
        ? value(workspaceForUi)
        : value;

    dispatch(
      setCurrentWorkspaceId(
        nextWorkspace?.id ?? null,
      ),
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-100">
        <p className="text-zinc-500">
          Loading workspaces...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-100">
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-600">
          {error instanceof Error
            ? error.message
            : "Failed to load workspaces"}
        </div>
      </div>
    );
  }

  if (!workspaceForUi) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-100">
        <p className="text-zinc-500">
          No workspaces available.
        </p>
      </div>
    );
  }

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace: workspaceForUi,
        setCurrentWorkspace,
        workspaces,
      }}
    >
      {permissionMessage && (
        <PermissionNotice
          message={permissionMessage}
          onClose={() => setPermissionMessage(null)}
        />
      )}

      <div className="flex h-screen overflow-hidden">
        <SideBar />

        <div className="flex flex-1 flex-col">
          <TopBar
            currentWorkspace={workspaceForUi}
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
