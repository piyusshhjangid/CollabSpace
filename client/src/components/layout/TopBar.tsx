import type { Workspace } from "../../types/workspace";
import WorkspaceSwitcher from "./WorkspaceSwitcher";

interface TopBarProps {
  currentWorkspace: Workspace;
  setCurrentWorkspace: React.Dispatch<
    React.SetStateAction<Workspace>
  >;
  workspaces: Workspace[];
}

const TopBar: React.FC<TopBarProps> = ({
  currentWorkspace,
  setCurrentWorkspace,
  workspaces,
}) => {
  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <WorkspaceSwitcher
          currentWorkspace={currentWorkspace}
          setCurrentWorkspace={setCurrentWorkspace}
          workspaces={workspaces}
        />
      </div>

      <div className="text-sm text-zinc-500">
        CollabSpace
      </div>
    </header>
  );
};

export default TopBar;