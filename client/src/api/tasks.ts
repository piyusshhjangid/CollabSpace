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
  status?: Task["status"];
  project?: string;
  dueDate?: string | null;
  assigned_to?: string | null;
}

function mapTask(task: ApiTask): Task {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? "",
    status: task.status ?? (task.completed ? "DONE" : "TODO"),
    priority: "Medium",
    assigneeName: task.assigned_to ?? "Unassigned",
    assigneeAvatar: "",
    dueDate: task.dueDate?.slice(0, 10) ?? "",
    project: {
      id: task.projectId,
      name: task.project ?? "Project",
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

export async function createTask(workspaceId: string, projectId: string, title: string) {
  const response = await apiFetch<ApiResponse<ApiTask>>(
    `/api/projects/${projectId}/tasks?workspaceId=${encodeURIComponent(workspaceId)}`,
    { method: "POST", body: JSON.stringify({ title }) },
  );
  return mapTask(response.data);
}

export async function updateTask(workspaceId: string, projectId: string, taskId: string, changes: { title?: string; status?: Task["status"] }) {
  const response = await apiFetch<ApiResponse<ApiTask>>(
    `/api/projects/${projectId}/tasks/${taskId}?workspaceId=${encodeURIComponent(workspaceId)}`,
    { method: "PATCH", body: JSON.stringify(changes) },
  );
  return mapTask(response.data);
}
