import React from "react";
import type { Workspace } from "../../types/workspace";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
import { useAuth } from "../../hooks/useAuth";
import { LogOut, Moon, Sun, User } from "lucide-react";

interface TopBarProps {
  currentWorkspace: Workspace;
  setCurrentWorkspace: React.Dispatch<
    React.SetStateAction<Workspace | null>
  >;
  workspaces: Workspace[];
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  currentWorkspace,
  setCurrentWorkspace,
  workspaces,
  isDarkMode,
  onToggleTheme,
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
    <header className="relative z-40 flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <WorkspaceSwitcher
          currentWorkspace={currentWorkspace}
          setCurrentWorkspace={setCurrentWorkspace}
          workspaces={workspaces}
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleTheme}
          role="switch"
          aria-checked={isDarkMode}
          aria-label="Dark theme"
          title={`Turn ${isDarkMode ? "off" : "on"} dark theme`}
          className="group flex h-10 items-center gap-2.5 rounded-full border border-zinc-200 bg-white py-1 pl-3 pr-2 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-violet-300 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
        >
          <span className="hidden sm:inline">{isDarkMode ? "Dark" : "Light"}</span>
          <span className={`relative flex h-7 w-12 items-center rounded-full p-0.5 transition-colors ${isDarkMode ? "bg-violet-600" : "bg-zinc-200"}`} aria-hidden="true">
            <span className={`theme-toggle-thumb flex h-6 w-6 items-center justify-center rounded-full bg-white text-violet-700 shadow-sm transition-transform duration-200 ${isDarkMode ? "translate-x-5" : "translate-x-0"}`}>
              {isDarkMode ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            </span>
          </span>
        </button>

        {user && (
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-semibold text-xs">
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
