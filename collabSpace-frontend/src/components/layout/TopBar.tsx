import { Search, Bell, Moon, Menu } from "lucide-react";

export default function TopBar() {
  return (
    <header className="flex h-16  border-b border-zinc-300 bg-gray-50 pl-3 pr-6">
      <div className="w-53 gap-3 flex flex-row items-center border-r border-zinc-300">
        <button className="rounded-lg p-2 transition hover:bg-zinc-200">
          <Menu size={20} className="text-black" />
        </button>
        <h1 className="font-bold text-2xl mr-3 text-zinc-800">CollabSpace</h1>
      </div>
      <div className="flex flex-row gap-111 items-center">
        <div className=" ml-6 relative w-85">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            placeholder="Search projects, tasks..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-100 py-2 pl-10 pr-4 text-sm text-zinc-500 outline-none transition focus:border-violet-500"
          />
        </div>
        <div className="flex items-center gap-4">
          <button className="rounded-lg p-2 transition hover:bg-zinc-200">
            <Bell size={20} />
          </button>
          <button className="rounded-lg p-2 transition hover:bg-zinc-200">
            <Moon size={20} />
          </button>

          <div className="flex items-center gap-3 rounded-lg border border-zinc-400 px-2.5 py-1">
            <img
              src="https://i.pinimg.com/736x/7c/69/0c/7c690cec9701e11f3995b0c16583ed21.jpg"
              alt="User"
              className="h-9 w-9 rounded-full"
            />

            <div className="hidden md:block">
              <p className="text-sm font-semibold text-zinc-900">Piyush</p>
              <p className="text-xs text-zinc-400">Free Plan</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
