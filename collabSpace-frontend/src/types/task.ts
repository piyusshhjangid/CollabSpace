import type { Project } from "./project";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeName: string;
  assigneeAvatar: string;
  dueDate: string;
  project: Project;
}
