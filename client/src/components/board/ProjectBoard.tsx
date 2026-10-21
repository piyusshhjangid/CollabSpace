import { useMemo, useState } from "react";
import type { TaskFilters } from "../../types/filters";
import type { Task } from "../../types/task";
import { useTasks } from "../../hooks/useTasks";
import {
  useAppDispatch,
  useAppSelector,
} from "../../store/hooks";
import {
  closeTaskModal,
  openTaskModal,
} from "../../store/slices/uiSlice";
import BoardToolbar from "./BoardToolbar";
import KanbanColumn from "./KanbanColumn";
import TaskModal from "./TaskModal";
import { useTaskMutations } from "../../hooks/useTaskMutations";

interface ProjectBoardProps {
  workspaceId: string;
  projectId: string;
  projectName?: string;
  canWrite?: boolean;
}

export default function ProjectBoard({
  workspaceId,
  projectId,
  projectName = "Project",
  canWrite = true,
}: ProjectBoardProps) {
  const dispatch = useAppDispatch();

  const isTaskModalOpen = useAppSelector(
    (state) => state.ui.isTaskModalOpen,
  );

  const selectedTaskId = useAppSelector(
    (state) => state.ui.selectedTaskId,
  );

  const {
    data: tasks = [],
    isLoading,
    isError,
    error,
  } = useTasks(workspaceId, projectId);

  const [filters, setFilters] = useState<TaskFilters>({
    search: "",
    priority: "ALL",
    assignee: "",
  });
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const { create, update } = useTaskMutations(workspaceId, projectId, projectName);

  const selectedTask = useMemo(
    () =>
      tasks.find(
        (task) => task.id === selectedTaskId,
      ) ?? null,
    [tasks, selectedTaskId],
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        filters.search === "" ||
        task.title
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        task.description
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        task.project.name
          .toLowerCase()
          .includes(filters.search.toLowerCase());

      const matchesPriority =
        filters.priority === "ALL" ||
        task.priority === filters.priority;

      const matchesAssignee =
        filters.assignee === "" ||
        task.assigneeName === filters.assignee;

      return (
        matchesSearch &&
        matchesPriority &&
        matchesAssignee
      );
    });
  }, [tasks, filters]);

  const openTask = (task: Task) => {
    dispatch(openTaskModal(task.id));
  };

  const handleDragStart = (task: Task) => setDraggedTask(task);

  const handleDrop = (status: Task["status"]) => {
    if (draggedTask && draggedTask.status !== status) {
      update.mutate({ taskId: draggedTask.id, changes: { status } });
    }
    setDraggedTask(null);
  };

  const handleSaveTask = (updatedTask: Task) => {
    update.mutate({ taskId: updatedTask.id, changes: { title: updatedTask.title, status: updatedTask.status } }, { onSuccess: () => dispatch(closeTaskModal()) });
  };

  const handleCloseTaskModal = () => {
    dispatch(closeTaskModal());
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        Loading tasks...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        {error instanceof Error
          ? error.message
          : "Failed to load tasks."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <BoardToolbar
        tasks={tasks}
        canCreateTask={canWrite}
        filters={filters}
        setFilters={setFilters}
        onCreateTask={() => {
          setIsCreatingTask((value) => !value);
        }}
      />

      {isCreatingTask && <form className="flex flex-col gap-2 rounded-xl border border-violet-100 bg-white p-3 shadow-sm sm:flex-row" onSubmit={(event) => { event.preventDefault(); if (!newTaskTitle.trim()) return; create.mutate(newTaskTitle.trim(), { onSuccess: () => { setNewTaskTitle(""); setIsCreatingTask(false); } }); }}>
        <input autoFocus aria-label="New task title" value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} placeholder="Give this task a clear, actionable title" maxLength={200} className="min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
        <button type="submit" disabled={!newTaskTitle.trim() || create.isPending} className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50">{create.isPending ? "Adding…" : "Add task"}</button>
      </form>}
      {(create.isError || update.isError) && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{(create.error ?? update.error)?.message ?? "Could not save this change."} Your previous task data has been restored.</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {(
          ["TODO", "IN_PROGRESS", "DONE"] as const
        ).map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={filteredTasks.filter(
              (task) => task.status === status,
            )}
            onTaskClick={openTask}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            readOnly={!canWrite}
          />
        ))}
      </div>

      <TaskModal
        open={
          isTaskModalOpen &&
          selectedTask !== null
        }
        task={selectedTask}
        onClose={handleCloseTaskModal}
        onSave={handleSaveTask}
        isSaving={update.isPending}
      />
    </div>
  );
}
