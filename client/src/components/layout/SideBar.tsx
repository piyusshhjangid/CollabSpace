import { NavLink } from "react-router-dom";
import { NavItems } from "../../types/navigation";
import { Menu } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-56 border-r border-zinc-300 bg-gray-50 ">
      <div className="w-56 h-16 border-b gap-3 flex flex-row items-center border-zinc-300">
        <button className="rounded-lg p-2 ml-4 transition hover:bg-zinc-200">
          <Menu size={20} className="text-black" />
        </button>
        <h1 className="font-bold text-2xl mr-3 text-zinc-800">CollabSpace</h1>
      </div>
      <nav className=" flex flex-col gap-2 py-3 px-3 justify-between">
        {NavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              to={item.path}
              key={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-4 py-1 transition ${
                  isActive
                    ? "bg-violet-100 text-violet-700 font-semibold"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`
              }
            >
              <Icon size={20} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
