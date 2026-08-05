import { tasks } from "../data/fakeStore.js";
import type { Task } from "../types/task.js";

export async function getTasksByProject(projectId: string) {
  return tasks.filter((task) => task.projectId === projectId);
}

export function createTaskService(
  projectId: string,
  title: string,
  completed: boolean | undefined,
) {
  if (title.trim() === "") {
    throw new Error("Task title is required");
  }
  const newTask: Task = {
    id: `t${tasks.length + 1}`,
    projectId,
    title,
    completed: completed ?? false,
  };

  tasks.push(newTask);
  return newTask;
}
