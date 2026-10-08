import React from "react";
import { Folder, Clock, ListChecks, ArrowRight } from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useProjects } from "../../hooks/useProjects";

const RecentProjects: React.FC = () => {
  const { currentWorkspace } = useWorkspace();

  const {
    data: projects = [],
    isLoading,
    isError,
  } = useProjects(currentWorkspace?.id ?? null);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-zinc-900">
          Recent Projects
        </h2>
        <p className="text-sm text-zinc-500">
          Loading projects...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="mb-2 text-lg font-bold text-red-900">
          Recent Projects
        </h2>
        <p className="text-sm text-red-600">
          Failed to load projects.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-900">
          Recent Projects
        </h2>

        <button className="flex items-center gap-1 text-sm font-medium text-violet-600 transition hover:text-violet-700">
          View All
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="flex flex-col divide-y divide-zinc-200">
        {projects.slice(0, 3).map((project) => (
          <div
            key={project.id}
            className="flex cursor-pointer items-center justify-between gap-6 rounded-lg px-2 py-4 transition-colors hover:bg-zinc-50"
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-violet-500" />

                <h3 className="text-md font-semibold text-zinc-800">
                  {project.name}
                </h3>
              </div>

              <p className="line-clamp-1 text-sm text-zinc-500">
                {project.description}
              </p>

              <div className="mt-1 flex items-center gap-4 text-xs text-zinc-500">
                <div className="flex items-center gap-1">
                  <ListChecks className="h-3 w-3 text-green-600" />
                  {project.taskCount} Tasks
                </div>

                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-blue-600" />
                  Updated{" "}
                  {project.updatedAt
                    ? new Date(
                        project.updatedAt,
                      ).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })
                    : "Recently"}
                </div>
              </div>
            </div>

            <button
              aria-label={`View ${project.name}`}
              className="flex h-10 w-10 items-center justify-center rounded-full text-violet-600 transition hover:bg-purple-100 hover:text-violet-700"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        ))}

        {projects.length === 0 && (
          <p className="py-6 text-sm text-zinc-500">
            No projects in this workspace yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default RecentProjects;
