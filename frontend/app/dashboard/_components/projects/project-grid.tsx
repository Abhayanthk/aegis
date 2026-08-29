import { ProjectCard, type Project } from "./project-card";
import { Empty } from "@/components/ui/empty";

interface ProjectGridProps {
  projects: Project[];
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <Empty>
        <Empty.Icon />
        <Empty.Title>No projects yet</Empty.Title>
        <Empty.Description>
          Create your first project to get started.
        </Empty.Description>
      </Empty>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
