import { useEffect, useState } from "react";
import ProjectCard from "../components/ProjectCard";
import { fetchProjects } from "../api/projects";
import { Plus, Search } from "lucide-react";
import { Button } from "../components/Button";
import { useWorkspace } from "../context/WorkspaceContext";
import type { Project } from "../types/project";

const ProjectPage = () => {
  const { currentWorkspace } = useWorkspace();

  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentWorkspace) return;

    async function loadProjects() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchProjects(currentWorkspace.id);
        setProjects(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load projects",
        );
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, [currentWorkspace]);

  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <p className="text-zinc-500">Loading projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-600">
        {error}
      </div>
    );
  }

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="mt-1 text-zinc-500">
            Manage all your projects in one place.
          </p>
        </div>

        <Button
          variant="primary"
          disabled={false}
          onClick={() => setOpen(!open)}
        >
          <Plus size={18} />
          New Project
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
        />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects..."
          className="w-full rounded-xl border border-zinc-300 bg-white py-3 pl-10 pr-4 outline-none focus:border-violet-500"
        />
      </div>

      {filteredProjects.length === 0 ? (
        <div className="flex h-80 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300">
          <h2 className="text-xl font-semibold">No Projects Found</h2>

          <p className="mt-2 text-zinc-500">
            Try another search or create a project.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectPage;