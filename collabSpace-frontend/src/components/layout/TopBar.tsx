import { Search, Bell, Moon } from "lucide-react";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
import type { Workspace } from "../types/workspace";

interface TopBarProps {
  currentWorkspace: Workspace;
  setCurrentWorkspace: React.Dispatch<React.SetStateAction<Workspace>>;
}

const TopBar: React.FC<TopBarProps> = ({ currentWorkspace, setCurrentWorkspace }) => {
  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-gray-50 px-6">
      <div className="relative w-80">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
        />
        <input
          type="text"
          placeholder="Search projects, tasks..."
          className="w-full rounded-lg border border-zinc-300 bg-zinc-100 py-2 pl-10 pr-4 text-sm text-zinc-700 outline-none transition focus:border-violet-500 focus:bg-white"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="rounded-lg p-2 transition hover:bg-zinc-200">
          <Bell size={20} className="text-zinc-700" />
        </button>
        <button className="rounded-lg p-2 transition hover:bg-zinc-200">
          <Moon size={20} className="text-zinc-700" />
        </button>

        <WorkspaceSwitcher
          currentWorkspace={currentWorkspace}
          setCurrentWorkspace={setCurrentWorkspace}
        />

        {/* User Profile */}
        <div className="flex items-center gap-3 rounded-lg border border-zinc-300 px-3 py-1 hover:bg-zinc-100 transition">
          <img
            src="https://i.pinimg.com/736x/7c/69/0c/7c690cec9701e11f3995b0c16583ed21.jpg"
            alt="User"
            className="h-9 w-9 rounded-full object-cover"
          />
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-zinc-900">Piyush</p>
            <p className="text-xs text-zinc-500">Free Plan</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
