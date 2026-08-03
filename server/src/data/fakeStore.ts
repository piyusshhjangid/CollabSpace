import type { Workspace } from "../types/workspace.js";
import type { Project } from "../types/project.js";
import type { Task } from "../types/task.js";

export const workspaces: Workspace[] = [
  {
    id: "w1",
    name: "Engineering Workspace",
  },
  {
    id: "w2",
    name: "Design Workspace",
  },
  {
    id: "w3",
    name: "Marketing Workspace",
  },
  {
    id: "w4",
    name: "Research Workspace",
  },
];

export const projects: Project[] = [
  {
    id: "p1",
    workspaceId: "w1",
    name: "Backend API",
    description: "Core API services for CollabSpace",
  },
  {
    id: "p2",
    workspaceId: "w1",
    name: "Frontend Integration",
    description: "Connecting React frontend with backend APIs",
  },
  {
    id: "p3",
    workspaceId: "w2",
    name: "UI Redesign",
    description: "Improving user interface and experience",
  },
  {
    id: "p4",
    workspaceId: "w2",
    name: "Design System",
    description: "Reusable components and style guidelines",
  },
  {
    id: "p5",
    workspaceId: "w3",
    name: "Social Campaign",
    description: "Marketing campaign for product launch",
  },
  {
    id: "p6",
    workspaceId: "w3",
    name: "SEO Optimization",
    description: "Improving search visibility and traffic",
  },
  {
    id: "p7",
    workspaceId: "w4",
    name: "AI Research",
    description: "Exploring AI features for collaboration",
  },
  {
    id: "p8",
    workspaceId: "w4",
    name: "User Study",
    description: "Collecting feedback from early adopters",
  },
];

export const tasks: Task[] = [
  {
    id: "t1",
    projectId: "p1",
    title: "Set up Express server",
    completed: true,
  },
  {
    id: "t2",
    projectId: "p1",
    title: "Add health check route",
    completed: true,
  },
  {
    id: "t3",
    projectId: "p2",
    title: "Connect frontend to API",
    completed: false,
  },
  {
    id: "t4",
    projectId: "p2",
    title: "Implement authentication flow",
    completed: false,
  },
  {
    id: "t5",
    projectId: "p3",
    title: "Design new dashboard UI",
    completed: true,
  },
  {
    id: "t6",
    projectId: "p3",
    title: "Update color palette",
    completed: false,
  },
  {
    id: "t7",
    projectId: "p4",
    title: "Create button component",
    completed: true,
  },
  {
    id: "t8",
    projectId: "p4",
    title: "Document design tokens",
    completed: false,
  },
  {
    id: "t9",
    projectId: "p5",
    title: "Plan social media posts",
    completed: true,
  },
  {
    id: "t10",
    projectId: "p5",
    title: "Schedule campaign launch",
    completed: false,
  },
  { id: "t11", projectId: "p6", title: "Keyword research", completed: true },
  {
    id: "t12",
    projectId: "p6",
    title: "Optimize landing page",
    completed: false,
  },
  { id: "t13", projectId: "p7", title: "Research AI models", completed: true },
  {
    id: "t14",
    projectId: "p7",
    title: "Prototype collaboration assistant",
    completed: false,
  },
  {
    id: "t15",
    projectId: "p8",
    title: "Prepare survey questions",
    completed: true,
  },
  {
    id: "t16",
    projectId: "p8",
    title: "Conduct user interviews",
    completed: false,
  },
];
