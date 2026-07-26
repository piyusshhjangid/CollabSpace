import type { Project } from "../types/project";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Bot,
  Users,
  BarChart3,
  FileUp,
} from "lucide-react";

export const projects: (Project & { icon: LucideIcon })[] = [
  {
    id: 1,
    name: "CollabSpace Dashboard",
    description: "Frontend shell layout with Sidebar and TopBar integration.",
    taskCount: 12,
    updatedAt: "2026-07-20T14:32:00Z",
    status: "ACTIVE",
    icon: LayoutDashboard,
  },
  {
    id: 2,
    name: "AI Assistant Module",
    description: "Building conversational AI integration for task management.",
    taskCount: 8,
    updatedAt: "2026-07-18T09:15:00Z",
    status: "IN_PROGRESS",
    icon: Bot,
  },
  {
    id: 3,
    name: "Team Management",
    description: "Role-based access control and workspace switching.",
    taskCount: 15,
    updatedAt: "2026-07-17T17:45:00Z",
    status: "PENDING",
    icon: Users,
  },
  {
    id: 4,
    name: "Reports & Insights",
    description: "Generate analytics dashboards with charts and KPIs.",
    taskCount: 20,
    updatedAt: "2026-07-19T11:05:00Z",
    status: "ACTIVE",
    icon: BarChart3,
  },
  {
    id: 5,
    name: "File Upload Service",
    description: "Implement Express.js + Multer for document uploads.",
    taskCount: 6,
    updatedAt: "2026-07-16T22:20:00Z",
    status: "IN_PROGRESS",
    icon: FileUp,
  },
];
