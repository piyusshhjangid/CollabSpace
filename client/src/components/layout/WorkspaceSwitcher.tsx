import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Settings2 } from "lucide-react";
import Badge from "../Badge";
import type { Workspace } from "../../types/workspace";

interface WorkspaceSwitcherProps {
  currentWorkspace: Workspace;
  setCurrentWorkspace: React.Dispatch<React.SetStateAction<Workspace | null>>;
  workspaces: Workspace[];
}

const roleColors: Record<Workspace["role"], "red" | "blue" | "green" | "yellow"> = {
  OWNER: "red", ADMIN: "blue", MEMBER: "green", VIEWER: "yellow",
};

export default function WorkspaceSwitcher({ currentWorkspace, setCurrentWorkspace, workspaces }: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("mousedown", closeOnOutsideClick); document.removeEventListener("keydown", closeOnEscape); };
  }, [open]);

  const handleSelect = (workspace: Workspace) => { setCurrentWorkspace(workspace); setOpen(false); };

  return <div ref={rootRef} className={`relative z-50 inline-block min-w-0 text-left ${open ? "isolate" : ""}`}>
    <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="menu" className="flex max-w-[min(18rem,55vw)] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500/20">
      <span className="truncate">{currentWorkspace.name}</span>
      <span className="hidden shrink-0 sm:inline-flex"><Badge color={roleColors[currentWorkspace.role]}>{currentWorkspace.role}</Badge></span>
      <ChevronDown size={15} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
    {open && <div className="absolute left-0 top-full z-[100] mt-2 w-[min(19rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-950/15">
      <ul role="menu" className="max-h-[min(60vh,24rem)] overflow-y-auto p-1.5 text-sm text-slate-700">
        {workspaces.map((workspace) => <li key={workspace.id}><button type="button" onClick={() => handleSelect(workspace)} role="menuitem" className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50 ${workspace.id === currentWorkspace.id ? "bg-violet-50/70" : ""}`}><span className="min-w-0 truncate font-medium">{workspace.name}</span><Badge color={roleColors[workspace.role]}>{workspace.role}</Badge></button></li>)}
      </ul>
      <div className="border-t border-slate-100 p-1.5"><Link to="/workspaces" role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-violet-700"><Settings2 size={15}/>Manage workspaces</Link></div>
    </div>}
  </div>;
}
