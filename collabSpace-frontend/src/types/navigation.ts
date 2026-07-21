import {
  Home,
  ListTodo,
  Calendar,
  Activity,
  FolderKanban,
  Users,
  FileText,
  MessageSquare,
  Bot,
  BarChart3,
  PieChart,
  Settings,
  User,
  CreditCard,
  HelpCircle
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

export interface navItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

export const navItems: navItem[] = [
    //General
  { label: "Home", icon: Home, path: "/" },
  { label: "My Tasks", icon: ListTodo, path: "/tasks" },
  { label: "Calendar", icon: Calendar, path: "/calendar" },
  { label: "Activity", icon: Activity, path: "/activity" },
  //Collabration
  { label: "Projects", icon: FolderKanban, path: "/projects" },
  { label: "Teams", icon: Users, path: "/teams" },
  { label: "Documents", icon: FileText, path: "/documents" },
  { label: "Messages", icon: MessageSquare, path: "/messages" },
  //Intelligence
  { label: "AI Assistant", icon: Bot, path: "/assistant" },
  { label: "Insights", icon: BarChart3, path: "/insights" },
  { label: "Reports", icon: PieChart, path: "/reports" },
  //Manage
  { label: "Settings", icon: Settings, path: "/settings" },
  { label: "Members", icon: User, path: "/members" },
  { label: "Billing", icon: CreditCard, path: "/billing" },
  { label: "Help & Support", icon: HelpCircle, path: "/support" },
];
