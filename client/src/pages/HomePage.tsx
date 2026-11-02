import QuickActions from "../components/home/QuickActions";
import RecentProjects from "../components/home/RecentProjects";
import StatCard from "../components/home/StatCard";
import { ClipboardList, Folder, Users, ChartNoAxesCombined } from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import { useWorkspace } from "../context/WorkspaceContext";
import { useWorkspaceOverview } from "../hooks/useWorkspaceOverview";

export default function HomePage() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { data: overview, isLoading, isError } = useWorkspaceOverview(currentWorkspace?.id ?? null);
  const hour = new Date().getHours();

  const greeting =
    hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  return (
    <div>
      <div className="px-4 mb-8">
        <h1 className="text-3xl text-zinc-900 font-bold">
          {greeting}, {user?.name || "there"} 👋
        </h1>
        <p className="text-zinc-500">
          Welcome back to CollabSpace. Here’s what’s happening in {currentWorkspace?.name}.
        </p>
      </div>

      <div className="grid gap-8 px-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ClipboardList}
          title="Tasks"
          value={isLoading ? "…" : isError ? "—" : overview?.taskCount ?? 0}
          subtitle={isLoading ? "Loading workspace tasks…" : isError ? "Couldn’t load workspace stats" : `${overview?.openTaskCount ?? 0} open in this workspace`}
          color="text-purple-600"
          bgColor="bg-purple-100"
          to="/tasks"
        />
        <StatCard
          icon={Folder}
          title="Projects"
          value={isLoading ? "…" : isError ? "—" : overview?.projectCount ?? 0}
          subtitle={isLoading ? "Loading workspace projects…" : isError ? "Couldn’t load workspace stats" : "Projects in this workspace"}
          color="text-blue-600"
          bgColor="bg-blue-100"
          to="/projects"
        />
        <StatCard
          icon={Users}
          title="Members"
          value={isLoading ? "…" : isError ? "—" : overview?.memberCount ?? 0}
          subtitle={isLoading ? "Loading workspace members…" : isError ? "Couldn’t load workspace stats" : "People in this workspace"}
          color="text-green-600"
          bgColor="bg-green-100"
          to="/workspaces"
        />
        <StatCard
          icon={ChartNoAxesCombined}
          title="Task completion"
          value={isLoading ? "…" : isError ? "—" : overview?.taskCount ? `${overview.completionRate}%` : "—"}
          subtitle={isLoading ? "Loading completion progress…" : isError ? "Couldn’t load workspace stats" : overview?.taskCount ? `${overview.completedTaskCount} of ${overview.taskCount} tasks complete` : "Create a task to start tracking progress"}
          color="text-yellow-600"
          bgColor="bg-yellow-100"
          to="/tasks"
        />
      </div>
      <div className="flex flex-row gap-10 mt-8 px-4">
        <RecentProjects />
        <QuickActions />
      </div>
    </div>
  );
}
