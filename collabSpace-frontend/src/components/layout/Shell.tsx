import Sidebar from "./SideBar";
import TopBar from "./TopBar";

interface ShellProps {
  children: React.ReactNode;
}

export default function Shell({ children }: ShellProps) {
  return (
    <div className="flex h-screen w-screen flex-col bg-gray-50">
      <TopBar />

      <div className="flex flex-1">
        <div className="flex flex-col w-56 border-r border-zinc-300 bg-white">
          <Sidebar />
        </div>

        <main className="flex-1 overflow-y-auto bg-white p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
