"use client";

import { useState, useCallback } from "react";
import { InvestigationSidebar } from "./_components/investigation-sidebar";
import { StageContent } from "./_components/stage-content";
import { LiveTrace } from "./_components/live-trace";
import investigationData from "@/data/Investigation.json";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

const STAGE_ORDER = [
  "discover",
  "reproduce",
  "measure",
  "diagnose",
  "repair",
  "validation",
  "verify",
  "approval",
  "pull_request",
  "qodo_review",
];

export default function ProjectInvestigationPage() {
  const [activeStage, setActiveStage] = useState("discover");
  // Track the highest stage that has been reached (all stages up to this index are completed)
  const [highestReached, setHighestReached] = useState(0);

  // Parse JSON data
  const data = investigationData.investigation as any;

  const handleStageSelect = useCallback((stageId: string) => {
    const newIndex = STAGE_ORDER.indexOf(stageId);
    if (newIndex === -1) return;

    setActiveStage(stageId);

    // Mark all stages before the new stage as completed
    if (newIndex > highestReached) {
      setHighestReached(newIndex);
    }
  }, [highestReached]);

  // Compute status for each stage based on highestReached
  const getStageStatus = useCallback((stageId: string): "completed" | "active" | "pending" => {
    const index = STAGE_ORDER.indexOf(stageId);
    if (index < highestReached) return "completed";
    if (index === highestReached) return "active";
    return "pending";
  }, [highestReached]);

  return (
    <SidebarProvider
      className="flex-1 h-[calc(100svh-var(--ds-navbar-h))] overflow-hidden bg-[var(--ds-canvas)]"
      style={{ "--sidebar-width": "18.5rem" } as React.CSSProperties}
    >
      <InvestigationSidebar
        activeStage={activeStage}
        onStageSelect={handleStageSelect}
        getStageStatus={getStageStatus}
      />

      <SidebarInset className="min-w-0 bg-transparent flex flex-row">
        <div className="h-full flex-1 overflow-y-auto bg-[var(--ds-surface-1)]/30 relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <StageContent
            data={data}
            activeStage={activeStage}
            onStageSelect={handleStageSelect}
          />
        </div>
      </SidebarInset>

      <LiveTrace data={data} activeStage={activeStage} />
    </SidebarProvider>
  );
}
