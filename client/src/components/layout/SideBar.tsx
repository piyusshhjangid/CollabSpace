import { NavLink } from "react-router-dom";
import { Boxes } from "lucide-react";
import { NavItems } from "../../types/navigation";

export default function Sidebar() {
  return <aside className="z-20 flex w-[68px] shrink-0 flex-col border-r border-slate-200/80 bg-white px-2.5 py-4 md:w-[248px] md:px-4">
    <NavLink to="/" className="mb-8 flex items-center gap-3 rounded-xl px-1.5 py-1.5" aria-label="CollabSpace home">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm"><Boxes size={20}/></span>
      <span className="hidden min-w-0 md:block"><span className="block text-[15px] font-bold tracking-tight text-slate-900">CollabSpace</span><span className="block text-[10px] font-medium tracking-wide text-slate-400">TEAM WORK, IN SYNC</span></span>
    </NavLink>
    <div className="mb-2 hidden px-3 text-[9px] font-bold uppercase tracking-[.18em] text-slate-400 md:block">Workspace</div>
    <nav aria-label="Main navigation" className="flex flex-col gap-1">
      {NavItems.map((item) => {
        const Icon = item.icon;
        return <NavLink end={item.path === "/"} key={item.path} to={item.path} title={item.label} className={({ isActive }) => `group flex items-center justify-center gap-3 rounded-xl px-2.5 py-2.5 text-[13px] font-medium transition-colors md:justify-start md:px-3 ${isActive ? "bg-violet-50 text-violet-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}>
          {({ isActive }) => <><Icon size={17} strokeWidth={isActive ? 2.25 : 1.9}/><span className="hidden md:block">{item.label}</span>{isActive && <span className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-violet-600 md:block"/>}</>}
        </NavLink>;
      })}
    </nav>
  </aside>;
}
