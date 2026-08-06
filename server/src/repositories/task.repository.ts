import { tasks } from "../data/fakeStore.js";
import type { Task } from "../types/task.js";

export async function findTasksByProject(projectId: string) {
  return tasks.filter(
    (task) => task.projectId === projectId,
  );
}

export async function createTask(task: Task) {
  tasks.push(task);

  return task;
}

// findById()

// update()

// delete()