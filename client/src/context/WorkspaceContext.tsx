import { createContext, useContext } from "react";
import type { Workspace } from "../types/workspace";

interface WorkspaceContextValue {
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: React.Dispatch<React.SetStateAction<Workspace | null>>;
  workspaces: Workspace[];
}

export const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(
  undefined,
);

export function useWorkspace() {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspace must be used inside WorkspaceContext.Provider");
  }

  return context;
}
