import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ProjectCard from "../components/ProjectCard";
import { Plus, Search } from "lucide-react";
import { Button } from "../components/Button";
import { useWorkspace } from "../context/WorkspaceContext";
import { useProjects } from "../hooks/useProjects";
import { usePermissions } from "../hooks/usePermissions";
import { createProject } from "../api/projects";
import { projectKeys } from "../hooks/useProjects";

const ProjectPage = () => {
  const { currentWorkspace } = useWorkspace();
  const permissions = usePermissions();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: () => createProject(currentWorkspace?.id ?? "", name.trim(), description.trim()),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: projectKeys.workspace(currentWorkspace?.id ?? "") }); setName(""); setDescription(""); setOpen(false); },
  });

  const {
    data: projects = [],
    isLoading,
    isError,
    error,
  } = useProjects(currentWorkspace?.id ?? null);

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
      <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-600">
        {error instanceof Error
          ? error.message
          : "Failed to load projects"}
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

        {permissions.canCreateProject && (
          <Button variant="primary" onClick={() => setOpen(!open)}>
            <Plus size={18} />
            New Project
          </Button>
        )}
      </div>

      {open && <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/30 px-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
        <form role="dialog" aria-modal="true" aria-labelledby="new-project-title" onSubmit={(event) => { event.preventDefault(); createMutation.mutate(); }} className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
          <h2 id="new-project-title" className="text-xl font-semibold text-slate-900">Create a project</h2><p className="mt-1 text-sm text-slate-500">Start with a focused workspace for related tasks.</p>
          <label className="mt-5 block text-xs font-semibold text-slate-700">Project name<input autoFocus required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Product launch" className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"/></label>
          <label className="mt-4 block text-xs font-semibold text-slate-700">Description <span className="font-normal text-slate-400">(optional)</span><textarea maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="What is this project aiming to deliver?" className="mt-2 w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"/></label>
          {createMutation.isError && <p role="alert" className="mt-3 text-xs text-rose-600">{createMutation.error.message}</p>}
          <div className="mt-5 flex justify-end gap-2"><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" variant="primary" disabled={!name.trim() || createMutation.isPending}>{createMutation.isPending ? "Creating…" : "Create project"}</Button></div>
        </form>
      </div>}

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
