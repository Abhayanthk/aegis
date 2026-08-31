/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RotateCcw, ArrowRight, Loader2, Lock, Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HumanDecisionStage({
  data,
  onStageSelect,
  repairAttempt,
  maxAttempts,
  onRetry,
  onReject,
}: {
  data: any;
  onStageSelect: (id: string) => void;
  repairAttempt: number;
  maxAttempts: number;
  onRetry: () => void;
  onReject: () => void;
}) {
  const { baseline, verification, repair } = data;
  const bm = baseline?.metrics;
  const vm = verification?.metrics;

  const [isAccepting, setIsAccepting] = useState(false);
  const [gitStep, setGitStep] = useState(0);

  const gitSteps = [
    { name: "Accepting repair", status: "Approval recorded" },
    { name: "Writing approved changes", status: "2 files modified" },
    { name: "Creating branch", status: "aegis/fix-a91f" },
    { name: "Creating commit", status: "8d3c1f2" },
    { name: "Creating pull request", status: "Opening PR #42" },
    { name: "Pull request created", status: "PR #42 ready" },
  ];

  const handleAccept = () => {
    setIsAccepting(true);
    const intervals = [400, 900, 1400, 1900, 2400, 2900];
    intervals.forEach((delay, index) => {
      setTimeout(() => {
        setGitStep(index + 1);
        if (index === intervals.length - 1) {
          setTimeout(() => {
            onStageSelect("pull_request");
          }, 350);
        }
      }, delay);
    });
  };

  const retryDisabled = repairAttempt >= maxAttempts;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col max-w-[840px]"
    >
      {/* Header */}
      <div className="flex flex-col gap-1.5 mb-8">
        <span className="text-[10px] font-bold tracking-widest text-amber-500 uppercase font-heading">
          WAITING FOR YOU
        </span>
        <h1 className="text-[26px] md:text-[30px] font-semibold text-[var(--ds-ink)] tracking-tight leading-tight font-heading">
          Human gate
        </h1>
        <p className="text-[13px] text-[var(--ds-ink-subtle)] leading-relaxed max-w-[680px]">
          The repair has been verified. Review the result and choose what happens next.
        </p>
      </div>

      {/* Verified Result Summary */}
      <div className="flex flex-col mb-6 p-4 rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)]">
        <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-3 block">
          Verified Result
        </span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[12px]">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase font-sans text-[var(--ds-ink-tertiary)]">Event-loop P99</span>
            <div className="flex items-center gap-1.5 font-mono text-[13px]">
              <span className="text-[var(--ds-ink-subtle)] line-through text-[11px]">{bm?.eventLoopP99?.value || 4217} ms</span>
              <span className="text-[var(--ds-ink-tertiary)]">→</span>
              <span className="text-emerald-500 font-semibold">{vm?.eventLoopP99?.after ?? 3.2} ms</span>
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase font-sans text-[var(--ds-ink-tertiary)]">Availability</span>
            <div className="flex items-center gap-1.5 font-mono text-[13px]">
              <span className="text-[var(--ds-ink-subtle)] line-through text-[11px]">{bm?.healthAvailability?.value ?? 16}%</span>
              <span className="text-[var(--ds-ink-tertiary)]">→</span>
              <span className="text-emerald-500 font-semibold">{vm?.healthAvailability?.after ?? 100}%</span>
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase font-sans text-[var(--ds-ink-tertiary)]">Endpoint P99</span>
            <div className="flex items-center gap-1.5 font-mono text-[13px]">
              <span className="text-[var(--ds-ink-subtle)] line-through text-[11px]">{bm?.endpointP99?.value || 5102} ms</span>
              <span className="text-[var(--ds-ink-tertiary)]">→</span>
              <span className="text-emerald-500 font-semibold">{vm?.endpointP99?.after ?? 52} ms</span>
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase font-sans text-[var(--ds-ink-tertiary)]">Functional Tests</span>
            <div className="flex items-center gap-1.5 font-mono text-[13px]">
              <span className="text-emerald-500 font-semibold">{vm?.functionalTests?.after ?? 100} / {vm?.functionalTests?.total ?? 100}</span>
              <span className="text-[10px] text-emerald-500">passed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Repair Metadata */}
      <div className="flex flex-col mb-6 p-4 rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)]">
        <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-3 block">
          Repair Summary
        </span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[12px] font-mono">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-sans text-[var(--ds-ink-tertiary)]">Strategy</span>
            <span className="text-[var(--ds-ink)]">{repair?.strategy || "Worker offload"}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-sans text-[var(--ds-ink-tertiary)]">Files changed</span>
            <span className="text-[var(--ds-ink)]">{repair?.filesChanged || 2}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-sans text-[var(--ds-ink-tertiary)]">Tests</span>
            <span className="text-emerald-500">100 / 100</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-sans text-[var(--ds-ink-tertiary)]">Repair attempts</span>
            <span className="text-[var(--ds-ink)]">{repairAttempt} / {maxAttempts}</span>
          </div>
        </div>
      </div>

      {/* GitHub Safety Boundary */}
      <div className="flex items-center gap-3 p-4 rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] text-[12px] mb-8">
        <Lock className="h-4 w-4 text-amber-500 shrink-0" />
        <span className="text-[var(--ds-ink-subtle)] leading-relaxed">
          <span className="text-[var(--ds-ink)] font-medium">GitHub has not been modified.</span> Approval is required before AEGIS writes changes to GitHub.
        </span>
      </div>

      {/* Decision Card with Expandable Downward Action Flow */}
      <motion.div
        layout
        className="flex flex-col rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 md:p-5">
          <div className="flex items-center gap-3">
            <Button
              onClick={onReject}
              disabled={isAccepting}
              variant="outline"
              className="h-9 px-4 text-[13px] font-medium border border-red-500/40 bg-red-500/10 text-red-400 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/40 hover:!bg-red-600 hover:!text-white hover:!border-red-600 dark:hover:!bg-red-600 dark:hover:!text-white dark:hover:!border-red-600 [&:hover_*]:!text-white disabled:opacity-40 transition-colors shadow-xs"
            >
              Reject changes
            </Button>
            <Button
              onClick={onRetry}
              disabled={retryDisabled || isAccepting}
              variant="outline"
              className="h-9 px-4 text-[13px] font-medium border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] text-[var(--ds-ink-subtle)] hover:!bg-white hover:!text-black hover:!border-white dark:hover:!bg-white dark:hover:!text-black dark:hover:!border-white [&:hover_*]:!text-black disabled:opacity-40 transition-colors shadow-xs"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Retry repair
              {retryDisabled && (
                <span className="text-[11px] text-[var(--ds-ink-tertiary)] ml-1">(max reached)</span>
              )}
            </Button>
          </div>

          <Button
            onClick={handleAccept}
            disabled={isAccepting}
            className="h-9 px-5 text-[13px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] gap-2 border-0 shadow-sm disabled:opacity-50"
          >
            {isAccepting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Applying to GitHub…
              </>
            ) : (
              <>
                Accept changes <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>

        {/* Downward Expansion during Accept */}
        <AnimatePresence>
          {isAccepting && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden border-t border-[var(--ds-hairline)] bg-[var(--ds-surface-1)]/60 p-5 md:p-6"
            >
              <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-4 block">
                Executing Git Workflow
              </span>
              <div className="flex flex-col gap-3">
                {gitSteps.map((step, index) => {
                  const isDone = index < gitStep;
                  const isActive = index === gitStep;

                  return (
                    <div key={step.name} className="flex items-center justify-between text-[12px] font-mono">
                      <div className="flex items-center gap-2.5">
                        {isDone ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" strokeWidth={2.5} />
                        ) : isActive ? (
                          <Loader2 className="h-3.5 w-3.5 text-amber-500 animate-spin shrink-0" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-[var(--ds-ink-tertiary)] shrink-0" />
                        )}
                        <span className={cn(
                          isDone ? "text-[var(--ds-ink)]" : isActive ? "text-[var(--ds-ink)] font-medium" : "text-[var(--ds-ink-tertiary)]"
                        )}>
                          {step.name}
                        </span>
                      </div>
                      <span className={cn(
                        "text-[11px]",
                        isDone ? "text-emerald-500 font-medium" : isActive ? "text-amber-500" : "text-[var(--ds-ink-tertiary)]"
                      )}>
                        {isDone ? "Completed" : isActive ? "Active" : "Pending"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
