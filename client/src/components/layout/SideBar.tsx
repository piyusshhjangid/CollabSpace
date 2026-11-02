import { NavLink } from "react-router-dom";
import { NavItems } from "../../types/navigation";
import { LogoIcon } from "../Logo";

export default function Sidebar() {
  return (
    <aside className="z-20 flex w-[68px] shrink-0 flex-col border-r border-slate-200/80 bg-white px-2.5 py-4 md:w-[248px] md:px-4">
      <NavLink
        to="/"
        className="group mb-8 flex items-center gap-3 rounded-2xl p-1.5 transition-all duration-200 hover:bg-slate-50/80 active:scale-[0.98]"
        aria-label="CollabSpace home"
      >
        <LogoIcon size="md" />
        <div className="hidden min-w-0 md:block">
          <span className="block text-[15.5px] font-bold tracking-tight text-slate-900 transition-colors group-hover:text-violet-950">
            CollabSpace
          </span>
          <span className="block text-[10px] font-semibold tracking-wider uppercase text-violet-600/90">
            Control Plane
          </span>
        </div>
      </NavLink>
      <div className="mb-2 hidden px-3 text-[9px] font-bold uppercase tracking-[.18em] text-slate-400 md:block">
        Workspace
      </div>
      <nav aria-label="Main navigation" className="flex flex-col gap-1">
        {NavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              end={item.path === "/"}
              key={item.path}
              to={item.path}
              title={item.label}
              className={({ isActive }) =>
                `group flex items-center justify-center gap-3 rounded-xl px-2.5 py-2.5 text-[13px] font-medium transition-colors md:justify-start md:px-3 ${
                  isActive
                    ? "bg-violet-50 text-violet-700 font-semibold"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} strokeWidth={isActive ? 2.25 : 1.9} />
                  <span className="hidden md:block">{item.label}</span>
                  {isActive && (
                    <span className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-violet-600 md:block" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
