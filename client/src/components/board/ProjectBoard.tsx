import KanbanColumn from "./KanbanColumn";
import { Folder } from "lucide-react";
import { Button } from "../Button";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import type { Task } from "../../types/task";
import { fetchTasks } from "../../data/fakeapi";
import TaskModal from "./TaskModal";

const statuses = ["TODO", "IN_PROGRESS", "DONE"] as const;

const ProjectBoard = () => {
  const response = fetchTasks();

  if (response.error) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-600">
        {response.error}
      </div>
    );
  }
  const tasks = response.data;

  const [boardTasks, setBoardTasks] = useState(tasks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [search, setSearch] = useState("");

  const filteredTasks = boardTasks.filter(task =>
    task.title.toLowerCase().includes(search.toLowerCase()) ||
    task.project.name.toLowerCase().includes(search.toLowerCase())
);

  const openTask = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = (updatedTask: Task) => {
    setBoardTasks((prev) =>
      prev.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
    );

    setIsModalOpen(false);
  };

 

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
          <KanbanColumn
            onTaskClick={openTask}
            key={status}
            status={status}
            tasks={filteredTasks}
          />
        ))}
      </div>
      <TaskModal
        open={isModalOpen}
        task={selectedTask}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
      />
    </div>
  );
};

export default ProjectBoard;
