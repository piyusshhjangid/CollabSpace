import { Folder } from "lucide-react";
import Badge from "./Badge";
import type { Task } from "../types/task";
import { useState } from "react";

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
  onDragStart: (task: Task) => void;
}

const PriorityColors = {
  Low: "green",
  Medium: "blue",
  High: "yellow",
  Urgent: "red",
} as const;

function formatDueDate(date: string) {
  const target = new Date(date).getTime();
  const now = Date.now();
  const diff = target - now;

  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (diff <= 0) {
    const overdueDays = Math.abs(days);
    if (overdueDays < 1) return "⚠️ Past due (today)";
    if (overdueDays >= 1) return "⚠️ Overdue ";
  }

  if (mins < 60) return `⏳ Due in ${mins} min`;
  if (hours < 24) return `⏳ Due in ${hours} hr`;
  if (days === 1) return "📅 Due tomorrow";
  if (days <= 7) return `📅 Due in ${days} days`;

  // For longer deadlines, show exact date
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };
  return `📅 Due on ${new Date(date).toLocaleDateString(undefined, options)}`;
}

export default function TaskCard({ task, onClick, onDragStart }: TaskCardProps) {
  return (
    <article
      draggable
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDragStart={() => onDragStart(task)}
      onClick={() => onClick(task)}
      className="group flex h-full flex-col rounded-2xl border border-zinc-200 bg-white cursor-pointer p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl"
    >
      <div className="flex flex-row items-center gap-2 mb-2">
        <Folder size={16} className="text-violet-500" />
        <h1 className="text-xs font-semibold uppercase tracking-wide text-purple-500">
          {task.project.name}
        </h1>
      </div>
      <div className="flex items-start justify-between">
        <div className="flex w-full items-center justify-between">
          <h2 className="cursor-pointer font-semibold hover:text-violet-600 transition text-gray-700">
            {task.title}
          </h2>
          <Badge color={PriorityColors[task.priority]}>{task.priority}</Badge>
        </div>
      </div>

      <div className="mt-3">
        <p className="line-clamp-2 text-sm leading-6 text-zinc-500">
          {task.description}
        </p>
      </div>

      <div className="mt-auto pt-3">
        <div className="flex items-center justify-between border-t border-zinc-200 pt-2 text-sm text-zinc-600">
          <div className="flex items-center gap-3">
            <img
              src={task.assigneeAvatar}
              className="h-8 w-8 rounded-full"
              alt={task.assigneeName}
            />
            <h3 className="text-[16px] font-normal text-zinc-600 tracking-tight  ">
              {task.assigneeName}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {formatDueDate(task.dueDate)}
          </div>
        </div>
      </div>
    </article>
  );
}
