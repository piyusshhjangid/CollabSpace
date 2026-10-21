import type { Task } from "../../types/task";
import type { TaskFilters } from "../../types/filters";
import { Button } from "../Button";
import { Plus, Search } from "lucide-react";

interface BoardToolbarProps {
  filters: TaskFilters;
  setFilters: React.Dispatch<React.SetStateAction<TaskFilters>>;
  tasks: Task[];
  onCreateTask: () => void;
  canCreateTask: boolean;
}

export default function BoardToolbar({ filters, setFilters, tasks, onCreateTask, canCreateTask }: BoardToolbarProps) {
  return <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
    <label className="relative block w-full sm:max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><span className="sr-only">Search tasks</span><input value={filters.search} type="search" placeholder={`Search ${tasks.length} task${tasks.length === 1 ? "" : "s"}…`} className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs text-slate-700 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100" onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}/></label>
    {canCreateTask && <Button variant="primary" onClick={onCreateTask}><Plus size={16}/>New task</Button>}
  </div>;
}
