"use client";

import { useState } from "react";
import { InvestigationSidebar } from "./_components/investigation-sidebar";
import { StageContent } from "./_components/stage-content";
import { LiveTrace } from "./_components/live-trace";
import investigationData from "@/data/Investigation.json";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function ProjectInvestigationPage() {
  const [activeStage, setActiveStage] = useState("discover");

  // Parse JSON data
  const data = investigationData.investigation as any;

  return (
    <SidebarProvider
      className="flex-1 h-[calc(100svh-var(--ds-navbar-h))] overflow-hidden bg-[var(--ds-canvas)]"
      style={{ "--sidebar-width": "18.5rem" } as React.CSSProperties}
    >
      <InvestigationSidebar
        data={data}
        activeStage={activeStage}
        onStageSelect={setActiveStage}
      />

      <SidebarInset className="min-w-0 bg-transparent flex flex-row">
        <div className="h-full flex-1 overflow-y-auto bg-[var(--ds-surface-1)]/30 relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <StageContent
            data={data}
            activeStage={activeStage}
            onStageSelect={setActiveStage}
          />
        </div>
      </SidebarInset>

      <LiveTrace data={data} activeStage={activeStage} />
    </SidebarProvider>
  );
}
