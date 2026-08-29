import { ProjectGrid } from "../_components/projects/project-grid";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import projectData from "@/data/Project.json";

export default function ProjectsPage() {
  const { projects, recentActivity } = projectData;

  // We enforce type matching via type assertion here for the imported JSON
  // In a real app this would be validated via zod or similar upon fetching.
  const typedProjects = projects as any;
  const typedActivity = recentActivity as any;

  return (
    <div className="flex flex-col flex-1 pb-12">
      {/* Header Area */}
      <div className="flex items-center justify-between px-6 pt-10 pb-6 gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ds-ink-tertiary)]" />
          <Input
            placeholder="Search repositories..."
            className="pl-8 h-8 text-[13px] border-0 bg-[var(--ds-surface-1)]/50 hover:bg-[var(--ds-surface-1)] focus-visible:ring-0 focus-visible:bg-[var(--ds-surface-1)] transition-colors placeholder:text-[var(--ds-ink-tertiary)]"
          />
        </div>

        <div className="flex items-center gap-3">
          <select className="h-8 rounded border-0 bg-transparent px-2 text-[13px] font-medium text-[var(--ds-ink-subtle)] outline-none hover:text-[var(--ds-ink)] cursor-pointer appearance-none">
            {projectData.filters.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>

          <Button
            size="sm"
            className="h-8 px-3 text-[12px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] border-0 gap-1.5 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Add project
          </Button>
        </div>
      </div>

      <div className="p-6 mx-auto w-full max-w-screen-2xl">
        <ProjectGrid projects={typedProjects} />
      </div>
    </div>
  );
}
