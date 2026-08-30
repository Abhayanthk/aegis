"use client";

import { useState, useCallback } from "react";
import { InvestigationSidebar } from "./_components/investigation-sidebar";
import { StageContent } from "./_components/stage-content";
import { LiveTrace } from "./_components/live-trace";
import investigationData from "@/data/Investigation.json";
import { useInvestigationControls } from "@/app/(investigation)/_components/investigation-context";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import {
  AlertDialog,
  AlertDialogPopup,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const STAGE_ORDER = [
  "repo_context",
  "repo_analyzer",
  "endpoint_finder",
  "baseline_test",
  "repair",
  "candidate_test",
  "verification",
  "human_gate",
  "pull_request",
];

export default function ProjectInvestigationPage() {
  const [activeStage, setActiveStage] = useState("repo_context");
  // Track the highest stage that has been reached (all stages up to this index are completed)
  const [highestReached, setHighestReached] = useState(0);
  const [repairAttempt, setRepairAttempt] = useState(1);

  const controls = useInvestigationControls();

  // Parse JSON data
  const data = investigationData.investigation as any;
  const maxAttempts = data.repair?.maxAttempts ?? 3;

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
  const getStageStatus = useCallback((stageId: string): "completed" | "active" | "pending" | "failed" => {
    if (controls?.status === "cancelled") {
      const index = STAGE_ORDER.indexOf(stageId);
      if (index === STAGE_ORDER.indexOf("human_gate")) return "failed";
      if (index < highestReached) return "completed";
      return "pending";
    }

    const index = STAGE_ORDER.indexOf(stageId);
    if (index < highestReached) return "completed";
    if (index === highestReached) return "active";
    return "pending";
  }, [highestReached, controls?.status]);

  const handleRetry = useCallback(() => {
    if (repairAttempt >= maxAttempts) return;
    setRepairAttempt((prev) => prev + 1);
    // Jump back to repair stage while keeping repo_context, repo_analyzer, endpoint_finder, baseline_test completed
    const repairIndex = STAGE_ORDER.indexOf("repair");
    setActiveStage("repair");
    setHighestReached(repairIndex);
  }, [repairAttempt, maxAttempts]);

  const handleReject = useCallback(() => {
    controls?.setStatus("cancelled");
  }, [controls]);

  return (
    <>
      <SidebarProvider
        className="flex-1 h-[calc(100svh-var(--ds-navbar-h))] overflow-hidden bg-[var(--ds-canvas)]"
        style={{ "--sidebar-width": "18.5rem" } as React.CSSProperties}
      >
        <InvestigationSidebar
          activeStage={activeStage}
          onStageSelect={handleStageSelect}
          getStageStatus={getStageStatus}
          isPaused={controls?.isPaused}
          attempt={repairAttempt}
          maxAttempts={maxAttempts}
          target={data.target}
        />

        <SidebarInset className="min-w-0 bg-transparent flex flex-row">
          <div className="h-full flex-1 overflow-y-auto bg-[var(--ds-surface-1)]/30 relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <StageContent
              data={data}
              activeStage={activeStage}
              onStageSelect={handleStageSelect}
              investigationStatus={controls?.status ?? "running"}
              repairAttempt={repairAttempt}
              maxAttempts={maxAttempts}
              onRetry={handleRetry}
              onReject={handleReject}
              onResume={controls?.onResume}
              onPause={controls?.onPause}
            />
          </div>
        </SidebarInset>

        <LiveTrace data={data} activeStage={activeStage} />
      </SidebarProvider>

      {/* Cancel confirmation dialog */}
      {controls && (
        <AlertDialog open={controls.showCancelDialog}>
          <AlertDialogPopup className="w-full max-w-[420px]">
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel investigation?</AlertDialogTitle>
              <AlertDialogDescription className="text-[13px] text-[var(--ds-ink-subtle)] leading-relaxed mt-2">
                This will stop the current investigation. Any unapproved repair
                changes will be discarded and no GitHub write will occur.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter variant="bare" className="flex items-center justify-end gap-3 mt-4 px-6 pb-6">
              <Button
                onClick={controls.onDismissCancel}
                variant="outline"
                className="h-8 px-4 text-[13px] font-medium"
              >
                Keep running
              </Button>
              <Button
                onClick={controls.onConfirmCancel}
                className="h-8 px-4 text-[13px] font-medium bg-red-600 text-white hover:bg-red-700 border-0"
              >
                Cancel investigation
              </Button>
            </AlertDialogFooter>
          </AlertDialogPopup>
        </AlertDialog>
      )}
    </>
  );
}
