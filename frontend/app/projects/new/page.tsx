import { AddProjectFlow } from "./_components/add-project-flow";
import { CursorDotBackground } from "@/components/ui/cursor-dot-background";

export default function NewProjectPage() {
  return (
    <>
      <CursorDotBackground />
      <div className="flex flex-col flex-1 pb-12 items-center px-6 pt-16 relative z-10">
        <div className="w-full max-w-3xl flex flex-col gap-6">
          <h1 className="text-[28px] font-semibold text-[var(--ds-ink)] tracking-tight">
            Import Git Repository
          </h1>
          <AddProjectFlow />
        </div>
      </div>
    </>
  );
}
