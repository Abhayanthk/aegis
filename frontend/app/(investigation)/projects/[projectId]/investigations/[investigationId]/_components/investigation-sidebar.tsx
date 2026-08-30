import { Check, Circle, Loader2, GitMerge, Lock } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
interface InvestigationSidebarProps {
  data: any;
  activeStage: string;
  onStageSelect: (stageId: string) => void;
}
export function InvestigationSidebar({
  data,
  activeStage,
  onStageSelect,
}: InvestigationSidebarProps) {
  const { stages, attempt, maxAttempts, title, target } = data;
  const getStageStatusColor = (status: string, id: string) => {
    if (activeStage === id) return "text-amber-500";
    if (status === "completed") return "text-emerald-500";
    return "text-[var(--ds-ink-tertiary)]";
  };
  const getStageIcon = (status: string, id: string) => {
    if (activeStage === id)
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />;
    if (status === "completed")
      return <Check className="h-3.5 w-3.5 text-emerald-500" />;
    return <Circle className="h-3.5 w-3.5 text-[var(--ds-ink-tertiary)]" />;
  };
  return (
    <Sidebar
      collapsible="offcanvas"
      className="!border-r-0 bg-transparent p-3 md:p-4 [&>[data-slot=sidebar-inner]]:bg-transparent !top-[calc(var(--ds-navbar-h))] !h-[calc(100svh-var(--ds-navbar-h))]"
      style={{ "--sidebar-width": "18.5rem" } as React.CSSProperties}
    >
      {" "}
      <div className="relative flex h-full flex-col overflow-hidden rounded-[var(--ds-rounded-xxl)] border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)]">
        {" "}
        {/* Header */}{" "}
        <SidebarHeader className="p-4 md:p-5 border-b border-[var(--ds-hairline)] shrink-0">
          {" "}
          <div className="flex items-center justify-between mb-4">
            {" "}
            <span className="text-[11px] font-semibold tracking-[0.08em] text-[var(--ds-ink-tertiary)] uppercase font-heading">
              {" "}
              Investigation{" "}
            </span>{" "}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--ds-surface-2)] border border-[var(--ds-hairline)]">
              {" "}
              <span className="text-[10px] font-medium text-[var(--ds-ink-subtle)]">
                {" "}
                attempt {attempt.toString().padStart(2, "0")} /{" "}
                {maxAttempts.toString().padStart(2, "0")}{" "}
              </span>{" "}
            </div>{" "}
          </div>{" "}
          <h2 className="text-[16px] font-semibold text-[var(--ds-ink)] tracking-tight leading-tight mb-1.5">
            Reliability run
          </h2>
          <div className="text-[12px] text-[var(--ds-ink-subtle)] font-mono">
            {target.method} {target.endpoint}
          </div>
        </SidebarHeader>{" "}
        {/* Content (Timeline) */}{" "}
        <SidebarContent className="relative flex-1 p-5 md:p-6">
          {" "}
          <div className="relative h-full">
            {" "}
            <div className="absolute left-[7px] top-3 bottom-4 w-px bg-[var(--ds-hairline-strong)]" />{" "}
            <div className="flex flex-col gap-5 relative pb-8">
              {" "}
              {stages.map((stage: any, index: number) => {
                const isActive = activeStage === stage.id;
                const activeIndex = stages.findIndex(
                  (s: any) => s.id === activeStage,
                );
                const isCompleted = index < activeIndex;

                let dynamicStatus = stage.status;
                let dynamicDescription = stage.description;

                if (isActive) {
                  dynamicStatus = "active";
                  if (stage.id === "pull_request")
                    dynamicDescription = "Branch and PR created";
                  if (stage.id === "qodo_review")
                    dynamicDescription = "Automated review";
                } else if (isCompleted) {
                  dynamicStatus = "completed";
                  if (stage.id === "pull_request")
                    dynamicDescription = "Branch and PR created";
                } else {
                  dynamicStatus = "pending";
                  if (stage.id === "pull_request")
                    dynamicDescription = "Branch and commit pending";
                  if (stage.id === "qodo_review")
                    dynamicDescription = "Automated review pending";
                }

                return (
                  <button
                    key={stage.id}
                    className={cn(
                      "flex items-start gap-3 text-left w-full group transition-colors",
                      isActive ? "opacity-100" : "opacity-70 hover:opacity-100",
                    )}
                    onClick={() => onStageSelect(stage.id)}
                  >
                    {" "}
                    <div
                      className={cn(
                        "relative z-10 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--ds-surface-1)]",
                        isActive && "ring-2 ring-[var(--ds-surface-1)]",
                      )}
                    >
                      {" "}
                      {getStageIcon(dynamicStatus, stage.id)}{" "}
                    </div>{" "}
                    <div className="flex flex-col -mt-0.5">
                      {" "}
                      <span
                        className={cn(
                          "text-[13px] font-medium transition-colors",
                          isActive
                            ? "text-[var(--ds-ink)]"
                            : "text-[var(--ds-ink-muted)] group-hover:text-[var(--ds-ink)]",
                        )}
                      >
                        {" "}
                        {stage.name}{" "}
                      </span>{" "}
                      <span className="text-[12px] text-[var(--ds-ink-subtle)] mt-0.5">
                        {" "}
                        {dynamicDescription}{" "}
                      </span>{" "}
                    </div>{" "}
                  </button>
                );
              })}{" "}
            </div>{" "}
          </div>{" "}
        </SidebarContent>{" "}
      </div>{" "}
    </Sidebar>
  );
}
