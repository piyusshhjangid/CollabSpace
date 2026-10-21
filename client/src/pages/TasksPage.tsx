import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ProjectBoard from "../components/board/ProjectBoard";
import { useWorkspace } from "../context/WorkspaceContext";
import { useProjects } from "../hooks/useProjects";

const TasksPage = () => {
  const { currentWorkspace } = useWorkspace();
  const [searchParams] = useSearchParams();

  const {
    data: projects = [],
    isLoading,
    isError,
    error,
  } = useProjects(currentWorkspace?.id ?? null);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    () => searchParams.get("projectId"),
  );

  useEffect(() => {
    const requestedProjectId = searchParams.get("projectId");
    if (requestedProjectId && projects.some((project) => project.id === requestedProjectId)) {
      setSelectedProjectId(requestedProjectId);
      return;
    }

    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
      return;
    }

    if (
      selectedProjectId &&
      projects.length > 0 &&
      !projects.some((project) => project.id === selectedProjectId)
    ) {
      setSelectedProjectId(projects[0].id);
    }

    if (projects.length === 0) {
      setSelectedProjectId(null);
    }
  }, [projects, selectedProjectId, searchParams]);

  if (!currentWorkspace) {
    return (
      <div className="flex h-80 items-center justify-center">
        <p className="text-zinc-500">No workspace selected.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <p className="text-zinc-500">Loading projects...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-80 items-center justify-center">
        <p className="text-red-500">
          Failed to load projects:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex min-h-[24rem] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
        <h2 className="text-lg font-semibold text-slate-900">Start with a project</h2>
        <p className="mt-2 max-w-md text-sm text-slate-500">Tasks live inside projects, so create one first and then add your first task.</p>
        <Link to="/projects?newProject=1" className="mt-5 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700">Create a project</Link>
      </div>
    );
  }

  if (!selectedProjectId) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">
          Tasks
        </h1>

        <select
          value={selectedProjectId}
          onChange={(event) => setSelectedProjectId(event.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700"
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      <ProjectBoard
        workspaceId={currentWorkspace.id}
        projectId={selectedProjectId}
        projectName={projects.find((project) => project.id === selectedProjectId)?.name}
        canWrite={currentWorkspace.role !== "VIEWER"}
      />
    </div>
  );
};

export default TasksPage;
