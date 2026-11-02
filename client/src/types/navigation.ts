import {
  Home,
  ListTodo,
  FolderKanban,
  GitBranch,
  Building2,
  Activity,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

export const NavItems: NavItem[] = [
  { label: "Overview", icon: Home, path: "/" },
  { label: "My Tasks", icon: ListTodo, path: "/tasks" },
  { label: "Projects", icon: FolderKanban, path: "/projects" },
  { label: "Execution", icon: GitBranch, path: "/execution" },
  { label: "Delivery Health", icon: Activity, path: "/delivery-health" },
  { label: "Workspaces", icon: Building2, path: "/workspaces" },
];
