import { useState } from "react";
import { ArrowUpRight, FolderKanban } from "lucide-react";
import type { Task } from "../types/task";

interface TaskCardProps { task: Task; onClick: (task: Task) => void; onDragStart: (task: Task) => void; readOnly?: boolean; }
const statusStyle: Record<Task["status"], string> = {
  TODO: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  DONE: "bg-emerald-50 text-emerald-700",
};
const statusLabel: Record<Task["status"], string> = { TODO: "To do", IN_PROGRESS: "In progress", DONE: "Done" };

export default function TaskCard({ task, onClick, onDragStart, readOnly = false }: TaskCardProps) {
  const [dragging, setDragging] = useState(false);
  return <article draggable={!readOnly} onDragStart={() => { if (!readOnly) { setDragging(true); onDragStart(task); } }} onDragEnd={() => setDragging(false)} onClick={() => { if (!readOnly) onClick(task); }} onKeyDown={(event) => { if (!readOnly && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onClick(task); } }} role={readOnly ? "article" : "button"} tabIndex={readOnly ? undefined : 0} aria-label={!readOnly ? `Edit ${task.title}` : undefined} className={`group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition ${readOnly ? "" : "cursor-grab hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-violet-200"} ${dragging ? "rotate-1 opacity-50" : ""}`}>
    <div className="flex items-start justify-between gap-3"><h3 className="text-sm font-semibold leading-5 text-slate-800 transition group-hover:text-violet-700">{task.title}</h3><span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold ${statusStyle[task.status]}`}>{statusLabel[task.status]}</span></div>
    {task.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{task.description}</p>}
    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] text-slate-400"><span className="inline-flex min-w-0 items-center gap-1.5"><FolderKanban size={12} className="shrink-0 text-violet-500"/><span className="truncate">{task.project.name}</span></span><ArrowUpRight size={13} className="text-slate-300 transition group-hover:text-violet-500"/></div>
  </article>;
}
