import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderKanban } from "lucide-react";
import { createTask, updateTask } from "../api/tasks";
import type { Task } from "../types/task";
import { taskKeys } from "./useTasks";

export function useTaskMutations(workspaceId: string, projectId: string, projectName: string) {
  const queryClient = useQueryClient();
  const key = taskKeys.project(workspaceId, projectId);
  const create = useMutation({
    mutationFn: (title: string) => createTask(workspaceId, projectId, title),
    onMutate: async (title) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Task[]>(key);
      const optimistic: Task = { id: `optimistic-${Date.now()}`, title, description: "", status: "TODO", priority: "Medium", assigneeName: "Unassigned", assigneeAvatar: "", dueDate: "", project: { id: projectId, name: projectName, icon: FolderKanban, description: "", taskCount: 0, updatedAt: new Date().toISOString(), status: "ACTIVE" } };
      queryClient.setQueryData<Task[]>(key, [...(previous ?? []), optimistic]);
      return { previous };
    },
    onError: (_error, _title, context) => { if (context?.previous) queryClient.setQueryData(key, context.previous); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
  const update = useMutation({
    mutationFn: ({ taskId, changes }: { taskId: string; changes: { title?: string; status?: Task["status"] } }) => updateTask(workspaceId, projectId, taskId, changes),
    onMutate: async ({ taskId, changes }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Task[]>(key);
      queryClient.setQueryData<Task[]>(key, (previous ?? []).map((task) => task.id === taskId ? { ...task, ...changes } : task));
      return { previous };
    },
    onError: (_error, _variables, context) => { if (context?.previous) queryClient.setQueryData(key, context.previous); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
  return { create, update };
}
