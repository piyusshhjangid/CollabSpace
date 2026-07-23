import ProjectCard from "../components/ProjectCard";
import { projects } from "../data/projects";
const ProjectPage = () => {
  return (
    <div className="p-6">
      {" "}
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">Projects</h1>{" "}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {" "}
        {projects.map((item) => (
          <ProjectCard key={item.id} project={item} />
        ))}{" "}
      </div>{" "}
    </div>
  );
};
export default ProjectPage;
