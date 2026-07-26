import KanbanColumn from "./KanbanColumn";
import { tasks } from "../../data/tasks";
import { Folder } from "lucide-react";
import { Button } from "../Button";
import { useState } from "react";
import { Plus, Search } from "lucide-react";

const statuses = ["TODO", "IN_PROGRESS", "DONE"] as const;

const ProjectBoard = () => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(search.trim().toLowerCase()),
  );
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-row items-center justify-between w-full shadow-sm bg-gray-50 rounded-xl p-5">
        <div className="flex items-center gap-3">
          <div className="text-violet-500 bg-violet-100 rounded-md px-2 py-2">
            <Folder size={28} />
          </div>
          <div className="flex flex-col items-start">
            <h1 className="text-xl font-bold text-zinc-900 ">My Tasks</h1>
            <p className="text-zinc-600 tracking-tighter ">
              Track and manage all tasks across projects.
            </p>
          </div>
        </div>
        <div className="flex flex-row items-center gap-3">
          <div className="relative w-75">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Search tasks..."
              className="w-full rounded-lg border border-zinc-300 bg-zinc-100 py-2 pl-10 pr-4 text-sm text-zinc-700 outline-none transition focus:border-violet-500 focus:bg-white"
            />
          </div>
          <div>
            <Button
              variant="primary"
              disabled={false}
              onClick={() => {
                setOpen(!open);
                console.log("Open Create Task Modal");
              }}
            >
              <Plus size={18} />
              New Task
            </Button>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 p-6 overflow-x-auto">
        {statuses.map((status) => (
          <KanbanColumn key={status} status={status} tasks={filteredTasks} />
        ))}
      </div>
    </div>
  );
};

export default ProjectBoard;
