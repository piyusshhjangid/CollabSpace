import { FolderKanban } from "lucide-react";
import { apiFetch } from "../lib/api";
import type { Task } from "../types/task";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface ApiTask {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  completed: boolean;
}

function mapTask(task: ApiTask): Task {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? "",
    status: task.completed ? "DONE" : "TODO",
    priority: "Medium",
    assigneeName: "Unassigned",
    assigneeAvatar: "",
    dueDate: "",
    project: {
      id: task.projectId,
      name: "Project",
      icon: FolderKanban,
      description: "",
      taskCount: 0,
      updatedAt: "",
      status: "ACTIVE",
    },
  };
}

export async function fetchTasks(
  workspaceId: string,
  projectId: string,
): Promise<Task[]> {
  const response = await apiFetch<ApiResponse<ApiTask[]>>(
    `/api/projects/${projectId}/tasks?workspaceId=${encodeURIComponent(workspaceId)}`,
  );

  return response.data.map(mapTask);
}
