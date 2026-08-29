import { Topbar } from "../_components/topbar";
import { ProjectGrid } from "../_components/projects/project-grid";

export default function ProjectsPage() {
  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Projects" />
      <div className="p-6">
        <ProjectGrid projects={[]} />
      </div>
    </div>
  );
}
