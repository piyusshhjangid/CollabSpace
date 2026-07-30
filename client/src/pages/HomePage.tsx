import QuickActions from "../components/home/QuickActions";
import RecentProjects from "../components/home/RecentProjects";
import StatCard from "../components/home/StatCard";
import { ClipboardList, Folder, Users, TrendingUp } from "lucide-react";

export default function HomePage() {
  const hour = new Date().getHours();

  const greeting =
    hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  return (
    <div>
      <div className="px-4 mb-8">
        <h1 className="text-3xl text-zinc-900 font-bold">
          {greeting}, Piyush 👋
        </h1>
        <p className="text-zinc-500">
          Welcome back to CollabSpace. Manage your projects and stay productive.
        </p>
      </div>

      <div className="grid gap-8 px-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ClipboardList}
          title="Tasks"
          value={12}
          subtitle="+3 today"
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
        <StatCard
          icon={Folder}
          title="Projects"
          value={5}
          subtitle="Active now"
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatCard
          icon={Users}
          title="Members"
          value={8}
          subtitle="2 new this week"
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatCard
          icon={TrendingUp}
          title="Productivity"
          value="92%"
          subtitle="5% vs last week"
          color="text-yellow-600"
          bgColor="bg-yellow-100"
        />
      </div>
      <div className="flex flex-row gap-10 mt-8 px-4">
        <RecentProjects />
        <QuickActions />
      </div>
    </div>
  );
}
