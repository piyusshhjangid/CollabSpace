import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { fakeWorkspaces } from "../../data/workspaces";
import Badge from "../Badge";
import type { Workspace } from "../../types/workspace";

interface WorkspaceSwitcherProps {
  currentWorkspace: Workspace;
  setCurrentWorkspace: React.Dispatch<React.SetStateAction<Workspace>>;
}

const roleColors: Record<Workspace["role"], "red" | "blue" | "green" | "yellow"> = {
  OWNER: "red",
  ADMIN: "blue",
  MEMBER: "green",
  VIEWER: "yellow",
};

const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  currentWorkspace,
  setCurrentWorkspace,
}) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    setOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm font-sans text-zinc-700 hover:bg-zinc-100"
      >
        <div className="flex items-center gap-1">
          {currentWorkspace.name}
          <Badge color={roleColors[currentWorkspace.role]}>
            {currentWorkspace.role}
          </Badge>
        </div>
        <ChevronDown
          size={16}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-md border border-zinc-200 bg-white shadow-lg">
          <ul className="py-1 text-sm text-zinc-700">
            {fakeWorkspaces.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleSelect(item)}
                  className="flex w-full items-center justify-between gap-1 px-3 py-1 text-left hover:bg-zinc-100"
                >
                  <span>{item.name}</span>
                  <Badge color={roleColors[item.role]}>{item.role}</Badge>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default WorkspaceSwitcher;
