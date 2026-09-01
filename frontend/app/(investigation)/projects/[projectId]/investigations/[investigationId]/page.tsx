"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { InvestigationSidebar } from "./_components/investigation-sidebar";
import { StageContent } from "./_components/stage-content";
import { LiveTrace } from "./_components/live-trace";
import { useInvestigationControls } from "@/app/(investigation)/_components/investigation-context";
import { useTrueForgeAgent } from "@/hooks/useTrueForgeAgent";

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
  const params = useParams();
  const projectId = params.projectId as string;
  const investigationId = params.investigationId as string;

  const [activeStage, setActiveStage] = useState("repo_context");
  const [highestReached, setHighestReached] = useState(0);
  const [repairAttempt, setRepairAttempt] = useState(1);
  const [projectData, setProjectData] = useState<any>(null);
  const [investigationRecord, setInvestigationRecord] = useState<any>(null);

  const controls = useInvestigationControls();
  const agent = useTrueForgeAgent();

  // Fetch project data and investigation data
  useEffect(() => {
    if (projectId && investigationId) {
      fetch(`/api/projects/${projectId}`)
        .then(res => res.json())
        .then(data => setProjectData(data))
        .catch(console.error);

      fetch(`/api/projects/${projectId}/investigations`)
        .then(res => res.json())
        .then(data => {
          const inv = data.investigations?.find((i: any) => i.id === investigationId);
          if (inv) setInvestigationRecord(inv);
        })
        .catch(console.error);
    }
  }, [projectId, investigationId]);

  // Register controls to context
  useEffect(() => {
    if (controls?.registerCallbacks) {
      controls.registerCallbacks({
        pauseAgent: agent.pauseAgent,
        resumeAgent: agent.resumeAgent,
        stopAgent: agent.stopAgent,
      });
    }
  }, [controls, agent.pauseAgent, agent.resumeAgent, agent.stopAgent]);

  // Sync agentState with context status
  useEffect(() => {
    if (controls) {
      if (agent.agentState === "RUNNING") controls.setStatus("running");
      else if (agent.agentState === "PAUSED") controls.setStatus("paused");
      else if (agent.agentState === "ERROR") controls.setStatus("failed");
      else if (agent.agentState === "COMPLETED") controls.setStatus("completed");
    }
  }, [agent.agentState, controls]);

  // Make data available to components
  // Merge loaded static info (like repoUrl) with dynamic investigationData
  const data = {
    ...investigationRecord?.data,
    ...agent.investigationData,
    repository: {
      url: projectData?.repo_url,
      name: projectData?.name,
      branch: projectData?.branch,
      ...investigationRecord?.data?.repository,
      ...agent.investigationData?.repository
    }
  };

  // Drive stage state from TrueForge's lifecycle events. This keeps concurrent
  // subagents independent instead of marking every earlier stage complete.
  useEffect(() => {
    const activeStages = STAGE_ORDER.filter((stage) => {
      const status = agent.stageProgress[stage as keyof typeof agent.stageProgress];
      return status === "running" || status === "awaiting_input";
    });
    if (activeStages.length > 0) setActiveStage(activeStages[activeStages.length - 1]);

    let contiguousCompleted = 0;
    while (
      contiguousCompleted < STAGE_ORDER.length - 1 &&
      agent.stageProgress[STAGE_ORDER[contiguousCompleted] as keyof typeof agent.stageProgress] === "completed"
    ) {
      contiguousCompleted += 1;
    }
    setHighestReached(contiguousCompleted);
  }, [agent.stageProgress]);



  const maxAttempts = data?.repair?.maxAttempts ?? 3;

  const handleStageSelect = useCallback((stageId: string) => {
    const newIndex = STAGE_ORDER.indexOf(stageId);
    if (newIndex === -1) return;

    setActiveStage(stageId);
    if (newIndex > highestReached) {
      setHighestReached(newIndex);
    }
  }, [highestReached]);

  const getStageStatus = useCallback((stageId: string): "completed" | "active" | "pending" | "failed" => {
    if (controls?.status === "cancelled") {
      const index = STAGE_ORDER.indexOf(stageId);
      if (index === STAGE_ORDER.indexOf("human_gate")) return "failed";
      if (index < highestReached) return "completed";
      return "pending";
    }

    const streamStatus = agent.stageProgress[stageId as keyof typeof agent.stageProgress];
    if (streamStatus === "completed") return "completed";
    if (streamStatus === "running" || streamStatus === "awaiting_input") return "active";
    if (streamStatus === "failed") return "failed";

    // After a stream has begun, absent status means the agent has not reached
    // this stage. This is important when two subagents run in parallel.
    if (Object.keys(agent.stageProgress).length > 0) return "pending";

    const index = STAGE_ORDER.indexOf(stageId);
    if (index < highestReached) return "completed";
    if (index === highestReached) return "active";
    return "pending";
  }, [highestReached, controls?.status, agent.stageProgress]);

  const handleRetry = useCallback(() => {
    if (repairAttempt >= maxAttempts) return;
    setRepairAttempt((prev) => prev + 1);
    const repairIndex = STAGE_ORDER.indexOf("repair");
    setActiveStage("repair");
    setHighestReached(repairIndex);
  }, [repairAttempt, maxAttempts]);

  const handleReject = useCallback(() => {
    controls?.setStatus("cancelled");
  }, [controls]);
  
  // Custom wrapper for starting agent to inject URL
  const handleStartAgent = useCallback((stageId: string) => {
    if (projectData?.repo_url) {
      agent.startAgent(projectData.repo_url, investigationId);
      handleStageSelect(stageId);
    }
  }, [projectData?.repo_url, investigationId, agent, handleStageSelect]);

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
              canAdvance={highestReached > STAGE_ORDER.indexOf(activeStage)}
              getStageStatus={getStageStatus}
              onStageSelect={stageId => {
                if (stageId === 'repo_analyzer' && agent.agentState === 'IDLE') {
                   handleStartAgent(stageId);
                } else {
                   handleStageSelect(stageId);
                }
              }}
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

        <LiveTrace 
          data={data} 
          activeStage={activeStage} 
          traceLog={agent.traceLog} 
          currentAgent={agent.currentAgent}
          agentState={agent.agentState}
          thoughts={agent.thoughts}
          currentStep={agent.currentStep}
        />
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
