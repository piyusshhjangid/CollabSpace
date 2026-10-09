import React from "react";
import type { Workspace } from "../../types/workspace";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
import { useAuth } from "../../hooks/useAuth";
import { LogOut, User } from "lucide-react";

interface TopBarProps {
  currentWorkspace: Workspace;
  setCurrentWorkspace: React.Dispatch<
    React.SetStateAction<Workspace | null>
  >;
  workspaces: Workspace[];
}

const TopBar: React.FC<TopBarProps> = ({
  currentWorkspace,
  setCurrentWorkspace,
  workspaces,
}) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Even if network error occurs, local logout already cleans up
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <WorkspaceSwitcher
          currentWorkspace={currentWorkspace}
          setCurrentWorkspace={setCurrentWorkspace}
          workspaces={workspaces}
        />
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-xs">
              {user.name ? user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
            </div>
            <div className="text-left text-xs">
              <p className="font-medium text-zinc-900 leading-tight">{user.name}</p>
              <p className="text-zinc-500 leading-tight truncate max-w-[150px]">{user.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          aria-label="Sign out"
          title="Sign out of CollabSpace"
          className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-zinc-400/20"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign out</span>
        </button>
      </div>
    </header>
  );
};

export default TopBar;
