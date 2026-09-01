"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import type { StageContentProps } from "./types";
import { PausedOverlay } from "./shared/paused-overlay";
import { CancelledOverlay } from "./shared/cancelled-overlay";
import { RepoInfoStage } from "./repo-info-stage";
import { RepoAnalyzerStage } from "./repo-analyzer-stage";
import { EndpointFinderStage } from "./endpoint-finder-stage";
import { BaselineStage } from "./baseline-stage";
import { RepairAgentStage } from "./repair-agent-stage";
import { CandidateTestStage } from "./candidate-test-stage";
import { VerificationStage } from "./verification-stage";
import { HumanDecisionStage } from "./human-decision-stage";
import { RaisingPRStage } from "./raising-pr-stage";

export function StageContent(props: StageContentProps) {
  const {
    data,
    activeStage,
    onStageSelect,
    investigationStatus,
    repairAttempt,
    maxAttempts,
    onRetry,
    onReject,
    onResume,
  canAdvance,
  getStageStatus,
  } = props;
  // Handle global investigation states
  if (investigationStatus === "paused" || investigationStatus === "pausing") {
    return (
      <div className="p-8 lg:p-12 max-w-5xl mx-auto min-h-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          <PausedOverlay onResume={onResume} />
        </AnimatePresence>
      </div>
    );
  }

  if (investigationStatus === "cancelled" || investigationStatus === "cancelling") {
    return (
      <div className="p-8 lg:p-12 max-w-5xl mx-auto min-h-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          <CancelledOverlay />
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-12 max-w-5xl mx-auto min-h-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStage}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {(activeStage === "repo_context" || activeStage === "discover") && (
            <RepoInfoStage data={data} onStageSelect={onStageSelect} canAdvance={canAdvance} />
          )}
          {activeStage === "repo_analyzer" && (
            <RepoAnalyzerStage
              data={data}
              onStageSelect={onStageSelect}
              investigationStatus={investigationStatus}
              canAdvance={canAdvance}
              stageStatus={getStageStatus?.("repo_analyzer")}
            />
          )}
          {(activeStage === "endpoint_finder" || activeStage === "reproduce") && (
            <EndpointFinderStage data={data} onStageSelect={onStageSelect} canAdvance={canAdvance} />
          )}
          {(activeStage === "baseline_test" || activeStage === "measure") && (
            <BaselineStage
              data={data}
              onStageSelect={onStageSelect}
              investigationStatus={investigationStatus}
              canAdvance={canAdvance}
            />
          )}
          {(activeStage === "repair" || activeStage === "diagnose") && (
            <RepairAgentStage
              data={data}
              onStageSelect={onStageSelect}
              investigationStatus={investigationStatus}
              canAdvance={canAdvance}
            />
          )}
          {activeStage === "candidate_test" && (
            <CandidateTestStage
              data={data}
              onStageSelect={onStageSelect}
              investigationStatus={investigationStatus}
              canAdvance={canAdvance}
            />
          )}
          {(activeStage === "verification" || activeStage === "validation") && (
            <VerificationStage
              data={data}
              onStageSelect={onStageSelect}
              repairAttempt={repairAttempt}
              maxAttempts={maxAttempts}
              investigationStatus={investigationStatus}
              canAdvance={canAdvance}
            />
          )}
          {(activeStage === "human_gate" || activeStage === "verify") && (
            <HumanDecisionStage
              data={data}
              onStageSelect={onStageSelect}
              repairAttempt={repairAttempt}
              maxAttempts={maxAttempts}
              onRetry={onRetry}
              onReject={onReject}
              canAdvance={canAdvance}
            />
          )}
          {(activeStage === "pull_request" || activeStage === "approval") && (
            <RaisingPRStage
              data={data}
              onStageSelect={onStageSelect}
              investigationStatus={investigationStatus}
              canAdvance={canAdvance}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
