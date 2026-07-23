import { ArrowRight, CalendarDays, CheckSquare } from "lucide-react";
import Badge from "./Badge";
import type { Project } from "../types/project";

interface ProjectCardProps {
  project: Project;
}

const statusColors = {
  ACTIVE: "green",
  IN_PROGRESS: "blue",
  PENDING: "yellow",
} as const;

function formatRelativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const Icon = project.icon;

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl">
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-violet-100 to-purple-200 text-violet-700">
          <Icon size={24} />
        </div>
        <Badge color={statusColors[project.status]}>
          {project.status.replace("_", " ")}
        </Badge>
      </div>

      <div className="mt-5">
        <h2 className="text-lg font-bold text-zinc-900">{project.name}</h2>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">
          {project.description}
        </p>
      </div>

      <div className="mt-auto pt-6">
        <div className="flex items-center justify-between border-t border-zinc-100 pt-4 text-sm text-zinc-600">
          <div className="flex items-center gap-2">
            <CheckSquare size={16} />
            {project.taskCount} Tasks
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays size={16} />
            {formatRelativeTime(project.updatedAt)}
          </div>
        </div>

        <button
          aria-label={`Open ${project.name}`}
          className="mt-5 flex w-full items-center justify-between rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-violet-600 hover:text-white"
        >
          Open Project
          <ArrowRight
            size={18}
            className="transition-transform group-hover:translate-x-1"
          />
        </button>
      </div>
    </article>
  );
}
