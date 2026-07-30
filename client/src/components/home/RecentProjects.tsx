import React from "react";
import { projects } from "../../data/projects";
import { Folder, Clock, ListChecks, ArrowRight } from "lucide-react";

const RecentProjects: React.FC = () => {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-zinc-900">Recent Projects</h2>
        <button className="flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700 transition">
          View All
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="flex flex-col divide-y divide-zinc-200">
        {projects.slice(0, 3).map((project) => (
          <div
            key={project.id}
            className="py-4 flex items-center gap-6 justify-between rounded-lg hover:bg-zinc-50 cursor-pointer transition-colors px-2"
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Folder className="text-violet-500 w-4 h-4" />
                <h3 className="text-md font-semibold text-zinc-800">
                  {project.name}
                </h3>
              </div>
              <p className="text-sm text-zinc-500 line-clamp-1">
                {project.description}
              </p>
              <div className="flex items-center gap-4 text-xs text-zinc-500 mt-1">
                <div className="flex items-center gap-1">
                  <ListChecks className="w-3 h-3 text-green-600" />
                  {project.taskCount} Tasks
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-600" />
                  Updated{" "}
                  {new Date(project.updatedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>

            <button
              aria-label={`View ${project.name}`}
              className="h-10 w-10 rounded-full hover:bg-purple-100 transition flex items-center justify-center text-violet-600 hover:text-violet-700"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentProjects;
