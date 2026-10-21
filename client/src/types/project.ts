import type { LucideIcon } from "lucide-react";

export interface Project {
  id: string;
  outcomeId?: string;
  name: string;
  icon: LucideIcon;
  description: string;
  taskCount: number;
  updatedAt: string;
  status: "ACTIVE" | "IN_PROGRESS" | "PENDING";
}
