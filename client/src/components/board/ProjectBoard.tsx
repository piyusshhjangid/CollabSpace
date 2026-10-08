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

interface ProjectBoardProps {
  workspaceId: string;
  projectId: string;
}

export default function ProjectBoard({
  workspaceId,
  projectId,
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

  const handleDragStart = (_task: Task) => {
    // Mutation layer comes after the Day 49 read architecture.
  };

  const handleDrop = (_status: Task["status"]) => {
    // Optimistic updates are intentionally deferred on Day 49.
  };

  const handleSaveTask = (_updatedTask: Task) => {
    dispatch(closeTaskModal());
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
        filters={filters}
        setFilters={setFilters}
        onCreateTask={() => {
          console.log("Create Task");
        }}
      />

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
      />
    </div>
  );
}
