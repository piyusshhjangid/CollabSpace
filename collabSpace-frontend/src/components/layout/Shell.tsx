import SideBar from "./SideBar";
import TopBar from "./TopBar";

interface ShellProps {
  children: React.ReactNode;
}

export default function Shell({ children }: ShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <SideBar />

      <div className="flex flex-1 flex-col">
        <TopBar />

        <main className="flex-1 overflow-y-auto bg-zinc-100 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
