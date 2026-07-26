import { useEffect, useState } from "react";
import type { Task } from "../../types/task";
import { Button } from "../Button";
import { Folder, X } from "lucide-react";

interface TaskModalProps {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: (task: Task) => void;
}

export default function TaskModal({
  open,
  task,
  onClose,
  onSave,
}: TaskModalProps) {
  const [formData, setFormData] = useState<Task | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!task) return;
    setFormData(task);
    setError("");
  }, [task]);

  if (!open || !task || !formData) return null;

  const handleChange = <K extends keyof Task>(key: K, value: Task[K]) => {
    setFormData((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = () => {
    if (formData.title.trim() === "") {
      setError("Task title is required");
      return;
    }
    onSave(formData);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-3">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">Edit Task</h2>
            <p className="text-sm text-zinc-500">
              Update task details and save your changes.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition hover:bg-zinc-100"
          >
            <X size={18} className="text-zinc-500" />
          </button>
        </div>

        <div className="flex flex-row items-center justify-between px-8 pt-4">
          <div className="flex items-center gap-2 text-sm font-medium text-violet-600">
            <Folder size={18} />
            {formData.project.name}
          </div>
          <div className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
            TASK-{String(formData.id).padStart(3, "0")}
          </div>
        </div>

        <div className="max-h-[65vh] space-y-2 overflow-y-auto px-8 pt-2 pb-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-700">
              Title
            </label>
            <input
              autoFocus
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-violet-500 focus:bg-white"
            />
            {error && (
              <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-700">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="w-full min-h-8 resize-none rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-violet-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-700">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  handleChange("status", e.target.value as Task["status"])
                }
                className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:bg-white"
              >
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="DONE">DONE</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-700">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  handleChange("priority", e.target.value as Task["priority"])
                }
                className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:bg-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-700">
                Assignee
              </label>
              <input
                value={formData.assigneeName}
                onChange={(e) => handleChange("assigneeName", e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-violet-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-700">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate.slice(0, 10)}
                onChange={(e) => handleChange("dueDate", e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-violet-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-zinc-200 bg-white px-8 py-3">
          <Button variant="secondary" disabled={!formData.title.trim()} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={formData.title.trim() === ""}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
