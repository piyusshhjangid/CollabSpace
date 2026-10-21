import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Outlet, Navigate } from "react-router-dom";
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
import { LogOut, Loader2, AlertCircle } from "lucide-react";

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
    isFetching,
    isError,
    error,
    refetch,
  } = useWorkspaces();

  const [permissionMessage, setPermissionMessage] =
    useState<string | null>(null);

  // We are waiting for workspace data if initial load is running, or if a refetch is in progress while list is empty
  const isWorkspacesPending = isLoading || (isFetching && workspaces.length === 0);

  useEffect(() => {
    // If workspace list is actively loading/fetching and currently empty, do not reset or make selection decisions yet
    if (isWorkspacesPending) {
      return;
    }

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
  }, [workspaces, currentWorkspaceId, isWorkspacesPending, dispatch]);

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

  if (isWorkspacesPending) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-sm font-medium text-zinc-600">Loading workspaces...</p>
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
    // If a workspace ID was recently selected or a query is actively refetching,
    // wait for the selection to resolve rather than prematurely kicking the user to onboarding.
    if (currentWorkspaceId || isFetching) {
      return (
        <div className="flex h-screen items-center justify-center bg-zinc-50">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <p className="text-sm font-medium text-zinc-600">Selecting workspace...</p>
          </div>
        </div>
      );
    }

    // Confirmed authenticated user with zero accessible workspaces
    return <Navigate to="/onboarding" replace />;
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

          <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-[#f6f7fb] px-4 py-5 sm:px-6 sm:py-7">
            {children ?? <Outlet />}
          </main>
        </div>
      </div>
    </WorkspaceContext.Provider>
  );
}
