import { navItems } from "../../types/navigation";

export default function Sidebar() {
  const currentPath = "/";

  return (
    <aside className="w-56 border-r border-zinc-300 bg-gray-50 ">
      <nav className=" flex flex-col gap-2 py-3 px-3 justify-between">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              className={`flex items-center gap-3 rounded-lg px-4 py-1 text-left transition
              ${
                currentPath === item.path
                  ? "bg-violet-100 text-violet-700 font-semibold"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <Icon size={20} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}