import { useEffect, useState } from "react";
import ProjectBoard from "../components/board/ProjectBoard";
import { useWorkspace } from "../context/WorkspaceContext";
import { useProjects } from "../hooks/useProjects";

const TasksPage = () => {
  const { currentWorkspace } = useWorkspace();

  const {
    data: projects = [],
    isLoading,
    isError,
    error,
  } = useProjects(currentWorkspace?.id ?? null);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );

  useEffect(() => {
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
  }, [projects, selectedProjectId]);

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
      <div className="flex h-80 items-center justify-center">
        <p className="text-zinc-500">
          No projects found in this workspace.
        </p>
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
      />
    </div>
  );
};

export default TasksPage;