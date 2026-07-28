import type { Task } from "./task";

export interface TaskFilters {
  search: string;
  priority: Task["priority"] | "ALL";
  assignee: string;
}