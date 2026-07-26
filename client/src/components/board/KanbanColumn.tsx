import { MoreHorizontal } from "lucide-react";
import TaskCard from "../TaskCard";
import type { Task, TaskStatus } from "../../types/task";

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const statusConfig = {
  TODO: {
    label: "To Do",
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-700",
  },
  IN_PROGRESS: {
    label: "In Progress",
    dot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700",
  },
  DONE: {
    label: "Done",
    dot: "bg-green-500",
    badge: "bg-green-100 text-green-700",
  },
} as const;

export default function KanbanColumn({ status, tasks, onTaskClick }: KanbanColumnProps) {
  const filteredTasks = tasks.filter((task) => task.status === status);

  const config = statusConfig[status];

  return (
    <section className="flex h-fit min-h-150 flex-col rounded-2xl border border-zinc-200 bg-zinc-50 p-2">
      <div className=" p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full ${config.dot}`} />

          <h2 className="text-lg font-semibold text-zinc-900">
            {config.label}
          </h2>

          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${config.badge}`}
          >
            {filteredTasks.length}
          </span>
        </div>

        <button className="rounded-lg p-2 transition hover:bg-zinc-200">
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4">
        {filteredTasks.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 text-center">
            <div>
              <p className="font-medium text-zinc-700">No tasks yet</p>

              <p className="mt-1 text-sm text-zinc-500">
                Create a task to get started.
              </p>
            </div>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={onTaskClick} />
          ))
        )}
      </div>
    </section>
  );
}
