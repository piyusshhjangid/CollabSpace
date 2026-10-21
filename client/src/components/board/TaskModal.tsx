import { useEffect, useState } from "react";
import type { Task } from "../../types/task";
import { Button } from "../Button";
import { FolderKanban, X } from "lucide-react";

interface TaskModalProps {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: (task: Task) => void;
  isSaving?: boolean;
}

export default function TaskModal({ open, task, onClose, onSave, isSaving = false }: TaskModalProps) {
  const [formData, setFormData] = useState<Task | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { if (task) { setFormData(task); setError(""); } }, [task]);
  useEffect(() => { if (!open) return; const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [open, onClose]);
  if (!open || !task || !formData) return null;
  const handleSave = () => {
    if (!formData.title.trim()) { setError("Task title is required"); return; }
    setError(""); onSave(formData);
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="edit-task-title" className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
      <header className="flex items-start justify-between border-b border-slate-100 px-6 py-5"><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-violet-600"><FolderKanban size={13}/>{formData.project.name}</div><h2 id="edit-task-title" className="mt-2 text-xl font-semibold tracking-tight text-slate-900">Edit task</h2><p className="mt-1 text-xs text-slate-500">Keep the task title clear and the current state accurate.</p></div><button type="button" onClick={onClose} aria-label="Close task editor" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={18}/></button></header>
      <div className="space-y-5 px-6 py-5"><label className="block text-xs font-semibold text-slate-700">Task title<input autoFocus value={formData.title} onChange={(event) => setFormData({ ...formData, title: event.target.value })} maxLength={200} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-normal text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100" /></label>
        <label className="block text-xs font-semibold text-slate-700">Status<select value={formData.status} onChange={(event) => setFormData({ ...formData, status: event.target.value as Task["status"] })} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-normal text-slate-700 outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"><option value="TODO">To do</option><option value="IN_PROGRESS">In progress</option><option value="DONE">Done</option></select></label>
        {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
      </div>
      <footer className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={handleSave} disabled={!formData.title.trim() || isSaving}>{isSaving ? "Saving…" : "Save changes"}</Button></footer>
    </section>
  </div>;
}
