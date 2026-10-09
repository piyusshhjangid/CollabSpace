import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Outlet } from "react-router-dom";
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
import { useAuth } from "../../hooks/useAuth";
import { Building2, LogOut, Loader2, AlertCircle } from "lucide-react";

interface ShellProps {
  children?: ReactNode;
}

export default function Shell({ children }: ShellProps) {
  const dispatch = useAppDispatch();
  const { logout } = useAuth();

  const currentWorkspaceId = useAppSelector(
    (state) => state.ui.currentWorkspaceId,
  );

  const {
    data: workspaces = [],
    isLoading,
    isError,
    error,
    refetch,
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
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-zinc-500">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-sm text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-zinc-900">
            Failed to Load Workspaces
          </h2>
          <p className="mt-2 text-xs text-zinc-500">
            {error instanceof Error ? error.message : "An unexpected error occurred while loading workspaces."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => refetch()}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-zinc-800"
            >
              Retry
            </button>
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!workspaceForUi) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Building2 className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-zinc-900">
            No Workspace Found
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            Your account is authenticated, but you are not currently a member of any workspace.
            Please contact your organization administrator for an invitation link.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => logout()}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-red-600"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign out of CollabSpace</span>
            </button>
          </div>
        </div>
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
            {children ?? <Outlet />}
          </main>
        </div>
      </div>
    </WorkspaceContext.Provider>
  );
}
