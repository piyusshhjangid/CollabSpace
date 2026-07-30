import type { Task } from "../../types/task";
import type { TaskFilters } from "../../types/filters";
import { Button } from "../Button";
import { Plus, Search } from "lucide-react";

interface BoardToolbarProps {
  filters: TaskFilters;
  setFilters: React.Dispatch<React.SetStateAction<TaskFilters>>;

  tasks: Task[];

  onCreateTask: () => void;
}

const BoardToolbar = ({
  filters,
  setFilters,
  tasks,
  onCreateTask,
}: BoardToolbarProps) => {
  const assignees = [...new Set(tasks.map((task) => task.assigneeName))];
  return (
    <div className="flex flex-row items-center justify-between w-full shadow-sm bg-gray-50 rounded-xl px-5 pb-3 pt-4">
      <div className="relative w-80">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
        />
        <input
          value={filters.search}
          type="text"
          placeholder="Search tasks..."
          className="w-full rounded-lg border border-zinc-300 bg-zinc-100 py-2 pl-10 pr-4 text-sm text-zinc-700 outline-none transition focus:border-violet-500 focus:bg-white"
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              search: e.target.value,
            }))
          }
        />
      </div>
      <div className="-translate-y-1.75">
        <h1 className="text-xs text-zinc-500 px-2 pb-0.25">Priority</h1>
        <select
          value={filters.priority}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              priority: e.target.value as TaskFilters["priority"],
            }))
          }
          className="rounded-lg border border-zinc-300 bg-white px-6 py-2 text-sm focus:border-violet-500"
        >
          <option value="ALL">ALL Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Urgent">Urgent</option>
        </select>
      </div>
      <div className="-translate-y-1.75">
        <h1 className="text-xs text-zinc-500 px-2 pb-0.25">Assignee</h1>
        <select
          value={filters.assignee}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              assignee: e.target.value,
            }))
          }
          className="rounded-lg border border-zinc-300 bg-white px-6 py-2 text-sm focus:border-violet-500"
        >
          <option value="">ALL Assignees</option>
          {assignees.map((assignee) => {
            return (
              <option key={assignee} value={assignee}>
                {assignee}
              </option>
            );
          })}
        </select>
      </div>
      <div>
        <Button
          variant="primary"
          disabled={false}
          onClick={onCreateTask}
        >
          <Plus size={18} />
          New Task
        </Button>
      </div>
    </div>
  );
};

export default BoardToolbar;
