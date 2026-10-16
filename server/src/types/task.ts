export interface Task {
  id: string;
  projectId: string;
  title: string;
  completed: boolean;
  status: "TODO" | "IN_PROGRESS" | "DONE";
}