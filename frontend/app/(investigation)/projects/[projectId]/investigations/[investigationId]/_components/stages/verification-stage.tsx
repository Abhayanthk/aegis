/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { motion } from "motion/react";
import { RotateCcw, Check, Loader2, Pause, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InvestigationStatus } from "@/app/(investigation)/_components/investigation-context";

export function VerificationStage({
  data,
  onStageSelect,
  repairAttempt,
  maxAttempts,
  investigationStatus = "completed",
}: {
  data: any;
  onStageSelect: (id: string) => void;
  repairAttempt: number;
  maxAttempts: number;
  investigationStatus?: InvestigationStatus;
}) {
  const { baseline, verification, target, sandbox, reproduction, configuration } = data;
  const bm = baseline?.metrics;
  const vm = verification?.metrics;

  const isRunning = investigationStatus === "running" && data?.status === "verifying";
  const isFailed = investigationStatus === "failed";
  const isPaused = investigationStatus === "paused" || investigationStatus === "pausing";

  const targetEndpoint = target ? `${target.method} ${target.endpoint}` : "POST /orders/process";
  const requestsPerSec = reproduction?.workload?.requestsPerSecond || configuration?.workload?.requestsPerSecond || 100;
  const durationSec = reproduction?.workload?.durationSeconds || 30;
  const sandboxId = sandbox?.id || "daytona-7f2a";

  const comparisons = [
    {
      label: "Event-loop P99",
      before: `${bm?.eventLoopP99?.value?.toLocaleString() || "4,217"} ${bm?.eventLoopP99?.unit || "ms"}`,
      after: `${vm?.eventLoopP99?.after ?? 3.2} ${vm?.eventLoopP99?.unit || "ms"}`,
      delta: "−99.9%",
      improved: vm?.eventLoopP99?.passed ?? true,
    },
    {
      label: "Health availability",
      before: `${bm?.healthAvailability?.value ?? 16}${bm?.healthAvailability?.unit || "%"}`,
      after: `${vm?.healthAvailability?.after ?? 100}${vm?.healthAvailability?.unit || "%"}`,
      delta: "+84%",
      improved: vm?.healthAvailability?.passed ?? true,
    },
    {
      label: "Endpoint P99",
      before: `${bm?.endpointP99?.value?.toLocaleString() || "5,102"} ${bm?.endpointP99?.unit || "ms"}`,
      after: `${vm?.endpointP99?.after ?? 52} ${vm?.endpointP99?.unit || "ms"}`,
      delta: "−99.0%",
      improved: vm?.endpointP99?.passed ?? true,
    },
    {
      label: "Functional tests",
      before: `${bm?.functionalTests?.passed ?? 100} / ${bm?.functionalTests?.total ?? 100}`,
      after: `${vm?.functionalTests?.after ?? 100} / ${vm?.functionalTests?.total ?? 100}`,
      delta: "100% passed",
      improved: true,
    },
  ];

  if (isFailed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex flex-col max-w-[840px]"
      >
        <div className="flex flex-col gap-1.5 mb-8">
          <span className="text-[10px] font-bold tracking-widest text-red-500 uppercase font-heading">
            Verification Failed
          </span>
          <h1 className="text-[26px] md:text-[30px] font-semibold text-[var(--ds-ink)] tracking-tight leading-tight font-heading">
            Verification failed
          </h1>
          <p className="text-[13px] text-[var(--ds-ink-subtle)] leading-relaxed max-w-[680px]">
            The candidate repair did not pass deterministic verification under the original workload.
          </p>
        </div>

        <div className="pt-0">
          <Button
            onClick={() => onStageSelect("candidate_test")}
            className="h-9 px-5 text-[13px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] gap-2 border-0 shadow-sm"
          >
            Retry candidate <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col max-w-[840px]"
    >
      {/* Header */}
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-[26px] md:text-[30px] font-semibold text-[var(--ds-ink)] tracking-tight leading-tight font-heading">
          Verification
        </h1>
        <p className="text-[13px] text-[var(--ds-ink-subtle)] leading-relaxed max-w-[680px]">
          {isRunning
            ? "AEGIS is running the original workload in a fresh sandbox."
            : "AEGIS reran the same workload against the repaired candidate and compared the result with the original baseline."}
        </p>
      </div>

      {/* Running State Surface */}
      {isRunning ? (
        <div className="flex flex-col mb-8 p-5 rounded-[8px] border border-amber-500/20 bg-amber-500/[0.04] gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[11px] font-bold tracking-wider text-amber-500 uppercase font-heading">
              RUNNING DETERMINISTIC VERIFICATION
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[12px] font-mono">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-sans text-[var(--ds-ink-tertiary)]">Target</span>
              <span className="text-[var(--ds-ink)] font-semibold">{targetEndpoint}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-sans text-[var(--ds-ink-tertiary)]">Workload</span>
              <span className="text-[var(--ds-ink)]">{requestsPerSec} req/s · {durationSec}s</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-sans text-[var(--ds-ink-tertiary)]">Environment</span>
              <span className="text-[var(--ds-ink)]">Fresh sandbox ({sandboxId})</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-amber-500/10 text-[11px] text-amber-500/80">
            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
            <span>Running deterministic verification…</span>
          </div>
        </div>
      ) : (
        <>
          {/* Paused State Surface */}
          {isPaused && (
            <div className="flex items-center gap-2.5 mb-6 p-3.5 rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] text-[12px] text-[var(--ds-ink-subtle)]">
              <Pause className="h-4 w-4 text-[var(--ds-ink-tertiary)] shrink-0" />
              <span>Verification is paused. Current results are preserved.</span>
            </div>
          )}

          {/* Before -> After Comparison Table */}
          <div className="flex flex-col mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                Before → After
              </span>
              <span className="text-[11px] font-mono text-[var(--ds-ink-subtle)]">
                Deterministic Workload Evidence
              </span>
            </div>

            <div className="flex flex-col rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-12 px-4 py-2.5 border-b border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                <span className="col-span-4">Metric</span>
                <span className="col-span-3 text-right">Before (Baseline)</span>
                <span className="col-span-3 text-right">After (Candidate)</span>
                <span className="col-span-2 text-right">Delta</span>
              </div>

              {/* Rows */}
              {comparisons.map((c, i) => (
                <motion.div
                  key={c.label}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                  className="grid grid-cols-12 px-4 py-3 border-b border-[var(--ds-hairline)] last:border-0 text-[12px] items-center"
                >
                  <span className="col-span-4 font-medium text-[var(--ds-ink)]">{c.label}</span>
                  <span className="col-span-3 text-right font-mono text-[var(--ds-ink-subtle)] line-through decoration-[var(--ds-ink-tertiary)]">
                    {c.before}
                  </span>
                  <span
                    className={cn(
                      "col-span-3 text-right font-mono font-medium",
                      c.improved ? "text-emerald-500" : "text-[var(--ds-ink)]"
                    )}
                  >
                    {c.after}
                  </span>
                  <span className="col-span-2 text-right font-mono text-[11px] text-emerald-500 font-medium">
                    {c.delta}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Verification Evidence Summary */}
          <div className="flex flex-col mb-6 p-4 rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] gap-2">
            <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-1">
              Verification Outcomes
            </span>
            <div className="flex flex-col gap-1.5 text-[13px] text-[var(--ds-ink)]">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" strokeWidth={2.5} />
                <span>Performance improved under concurrent load</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" strokeWidth={2.5} />
                <span>Health availability recovered to 100%</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" strokeWidth={2.5} />
                <span>Functional behavior preserved across test suite</span>
              </div>
            </div>
          </div>

          {/* Test & Repair Metadata Summary */}
          <div className="grid grid-cols-3 gap-4 p-4 rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] text-[12px] mb-8">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                Functional tests
              </span>
              <span className="font-mono text-[var(--ds-ink)]">
                {vm?.functionalTests?.after ?? 100} / {vm?.functionalTests?.total ?? 100} passed
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                Regression checks
              </span>
              <span className="font-mono text-emerald-500">Passed</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                Repair attempts
              </span>
              <span className="font-mono text-[var(--ds-ink)]">
                {repairAttempt} / {maxAttempts}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Primary Action Button */}
      <div className="pt-0">
        <Button
          onClick={() => onStageSelect("human_gate")}
          disabled={isRunning}
          className="h-9 px-5 text-[13px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] gap-2 border-0 shadow-sm disabled:opacity-50"
        >
          Review decision <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}
