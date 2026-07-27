import { projects } from "./projects";
import { tasks } from "./tasks";

import type { ApiResponse } from "../types/api";
import type { Project } from "../types/project";
import type { Task } from "../types/task";

export function fetchProjects(): ApiResponse<Project[]> {
  return {
    data: projects,
    error: null,
  };
}

export function fetchTasks(): ApiResponse<Task[]> {
    return {
        data: tasks,
        error: null,
    };
}