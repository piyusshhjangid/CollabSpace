import {
  Home,
  ListTodo,
  FolderKanban,
  GitBranch
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
];
