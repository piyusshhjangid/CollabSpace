import KanbanColumn from "./KanbanColumn";
import { Folder } from "lucide-react";
import { useState } from "react";
import type { TaskFilters } from "../../types/filters";
import type { Task } from "../../types/task";
import { fetchTasks } from "../../data/fakeapi";
import TaskModal from "./TaskModal";
import BoardToolbar from "./BoardToolbar";

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

  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const [filters, setFilters] = useState<TaskFilters>({
    search: "",
    priority: "ALL",
    assignee: "",
  });

  const filteredTasks = boardTasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      task.project.name.toLowerCase().includes(filters.search.toLowerCase());

    const matchesPriority =
      filters.priority === "ALL" || task.priority === filters.priority;

    const matchesAssignee =
      filters.assignee === "" || task.assigneeName === filters.assignee;

    return matchesSearch && matchesPriority && matchesAssignee;
  });

  const openTask = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDrop = (status: Task["status"]) => {
    if (!draggedTask) return;

    setBoardTasks((prev) =>
      prev.map((task) =>
        task.id === draggedTask.id ? { ...task, status } : task,
      ),
    );

    setDraggedTask(null);
  };

  const handleSaveTask = (updatedTask: Task) => {
    setBoardTasks((prev) =>
      prev.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
    );

    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-row items-center justify-between w-full px-5 mb-4">
        <div className="flex items-center gap-3">
          <div className="text-violet-600 bg-violet-100 rounded-md px-2 py-2">
            <Folder size={28} />
          </div>
          <div className="flex flex-col items-start">
            <h1 className="text-xl font-bold text-zinc-900 ">My Tasks</h1>
            <p className="text-zinc-600 tracking-tighter ">
              Track and manage all tasks across projects.
            </p>
          </div>
        </div>
      </div>
      <div className="mb-4 flex w-full">
        <BoardToolbar
          filters={filters}
          setFilters={setFilters}
          tasks={boardTasks}
          onCreateTask={() => {
            console.log("Create Task");
          }}
        />
      </div>
      <div className="bg-white rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 p-6 overflow-x-auto">
        {statuses.map((status) => (
          <KanbanColumn
            onTaskClick={openTask}
            key={status}
            status={status}
            tasks={filteredTasks}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
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
