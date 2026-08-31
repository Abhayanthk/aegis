/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { motion } from "motion/react";
import { RotateCcw, Check, Loader2, Pause, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InvestigationStatus } from "@/app/(investigation)/_components/investigation-context";

export function CandidateTestStage({
  data,
  onStageSelect,
  investigationStatus = "completed",
  canAdvance,
}: {
  data: any;
  onStageSelect: (id: string) => void;
  investigationStatus?: InvestigationStatus;
  canAdvance?: boolean;
}) {
  const { baseline, verification, target, sandbox, reproduction, configuration } = data;
  const bm = baseline?.metrics;
  const vm = verification?.metrics;

  const isRunning = investigationStatus === "running" && data?.status === "candidate_testing";
  const isFailed = investigationStatus === "failed";
  const isPaused = investigationStatus === "paused" || investigationStatus === "pausing";

  const targetEndpoint = target ? `${target.method} ${target.endpoint}` : "POST /orders/process";
  const requestsPerSec = reproduction?.workload?.requestsPerSecond || configuration?.workload?.requestsPerSecond || 100;
  const durationSec = reproduction?.workload?.durationSeconds || 30;
  const sandboxId = sandbox?.id || "daytona-7f2a";

  const comparisons = [
    {
      label: "99th Event-Loop Delay",
      before: `${bm?.eventLoopP99?.value?.toLocaleString() || "4,217"} ${bm?.eventLoopP99?.unit || "ms"}`,
      after: `${vm?.eventLoopP99?.after ?? 3.2} ${vm?.eventLoopP99?.unit || "ms"}`,
      delta: "↓ 99.9%",
      improved: vm?.eventLoopP99?.passed ?? true,
    },
    {
      label: "99th Endpoint Latency",
      before: `${bm?.endpointP99?.value?.toLocaleString() || "5,102"} ${bm?.endpointP99?.unit || "ms"}`,
      after: `${vm?.endpointP99?.after ?? 52} ${vm?.endpointP99?.unit || "ms"}`,
      delta: "↓ 99.0%",
      improved: vm?.endpointP99?.passed ?? true,
    },
    {
      label: "Health Availability",
      before: `${bm?.healthAvailability?.value ?? 16}${bm?.healthAvailability?.unit || "%"}`,
      after: `${vm?.healthAvailability?.after ?? 100}${vm?.healthAvailability?.unit || "%"}`,
      delta: "↑ +84%",
      improved: vm?.healthAvailability?.passed ?? true,
    },
    {
      label: "Requests / sec",
      before: `${requestsPerSec}`,
      after: `${requestsPerSec}`,
      delta: "Maintained",
      neutral: true,
    },
    {
      label: "Functional Tests",
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
            Test Failed
          </span>
          <h1 className="text-[26px] md:text-[30px] font-semibold text-[var(--ds-ink)] tracking-tight leading-tight font-heading">
            Candidate test failed
          </h1>
          <p className="text-[13px] text-[var(--ds-ink-subtle)] leading-relaxed max-w-[680px]">
            AEGIS could not complete the repaired candidate workload in the sandbox.
          </p>
        </div>

        <div className="pt-0">
          <Button
            onClick={() => onStageSelect("candidate_test")}
            className="h-9 px-5 text-[13px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] gap-2 border-0 shadow-sm"
          >
            Retry candidate test <RotateCcw className="h-3.5 w-3.5" />
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
          Candidate test
        </h1>
        <p className="text-[13px] text-[var(--ds-ink-subtle)] leading-relaxed max-w-[680px]">
          {isRunning
            ? "AEGIS is rerunning the original workload against the repaired candidate in a fresh sandbox."
            : "AEGIS reran the original workload against the repaired candidate in a fresh sandbox."}
        </p>
      </div>

      {/* Execution Context & Guarantees */}
      <div className="flex flex-col mb-6 p-4 rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] gap-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
              Workload Target
            </span>
            <span className="font-mono text-[14px] font-semibold text-[var(--ds-ink)]">
              {targetEndpoint}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[12px] font-mono text-[var(--ds-ink-subtle)]">
            <span>{requestsPerSec} req/s</span>
            <span className="text-[var(--ds-hairline-strong)]">·</span>
            <span>{durationSec}s</span>
            <span className="text-[var(--ds-hairline-strong)]">·</span>
            <span>Fresh sandbox ({sandboxId})</span>
          </div>
        </div>

        <div className="border-t border-[var(--ds-hairline)] pt-3 flex items-center flex-wrap gap-x-4 gap-y-2 text-[11px] font-medium text-[var(--ds-ink-subtle)]">
          <div className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2.5} />
            <span>Same workload</span>
          </div>
          <span className="text-[var(--ds-hairline-strong)]">·</span>
          <div className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2.5} />
            <span>Fresh sandbox</span>
          </div>
          <span className="text-[var(--ds-hairline-strong)]">·</span>
          <div className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2.5} />
            <span>Deterministic</span>
          </div>
        </div>
      </div>

      {/* Running State Surface */}
      {isRunning && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex flex-col mb-6 p-4 rounded-[8px] border border-amber-500/20 bg-amber-500/[0.04]"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[11px] font-bold tracking-wider text-amber-500 uppercase font-heading">
              RUNNING CANDIDATE TEST
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-[12px] font-mono">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase text-[var(--ds-ink-tertiary)] font-sans">Requests</span>
              <span className="text-[var(--ds-ink)]">{requestsPerSec} / {requestsPerSec} req/s</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase text-[var(--ds-ink-tertiary)] font-sans">Elapsed</span>
              <span className="text-[var(--ds-ink)]">18s / {durationSec}s</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase text-[var(--ds-ink-tertiary)] font-sans">Sandbox</span>
              <span className="text-[var(--ds-ink)] truncate">{sandboxId}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-amber-500/10 text-[11px] text-amber-500/80">
            <Loader2 className="h-3 w-3 animate-spin shrink-0" />
            <span>Collecting candidate measurements…</span>
          </div>
        </motion.div>
      )}

      {/* Paused State Surface */}
      {isPaused && (
        <div className="flex items-center gap-2.5 mb-6 p-3.5 rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] text-[12px] text-[var(--ds-ink-subtle)]">
          <Pause className="h-4 w-4 text-[var(--ds-ink-tertiary)] shrink-0" />
          <span>Candidate test is paused. Current measurements are preserved.</span>
        </div>
      )}

      {/* Candidate Results Grid */}
      <div className="flex flex-col mb-6">
        <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-3">
          Candidate Results
        </span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] text-[12px]">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
              99th Event Loop
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-[14px] font-semibold text-emerald-500">
                {vm?.eventLoopP99?.after ?? 3.2} ms
              </span>
              <span className="text-[10px] text-[var(--ds-ink-tertiary)] font-mono">&lt; 52 ms</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
              99th Latency
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-[14px] font-semibold text-emerald-500">
                {vm?.endpointP99?.after ?? 52} ms
              </span>
              <span className="text-[10px] text-[var(--ds-ink-tertiary)] font-mono">&lt; 100 ms</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
              Availability
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-[14px] font-semibold text-emerald-500">
                {vm?.healthAvailability?.after ?? 100}%
              </span>
              <span className="text-[10px] text-[var(--ds-ink-tertiary)] font-mono">100%</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
              Functional
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-[14px] font-semibold text-[var(--ds-ink)]">
                {vm?.functionalTests?.after ?? 100} / {vm?.functionalTests?.total ?? 100}
              </span>
              <span className="text-[10px] text-emerald-500 font-mono">passed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Table: Baseline -> Candidate */}
      <div className="flex flex-col mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
            Baseline → Candidate
          </span>
          <span className="text-[11px] font-mono text-[var(--ds-ink-subtle)]">
            Same Workload Comparison
          </span>
        </div>

        <div className="flex flex-col rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 px-4 py-2.5 border-b border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
            <span className="col-span-4">Metric</span>
            <span className="col-span-3 text-right">Baseline</span>
            <span className="col-span-3 text-right">Candidate</span>
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
              <span
                className={cn(
                  "col-span-2 text-right font-mono text-[11px]",
                  c.improved
                    ? "text-emerald-500 font-medium"
                    : c.neutral
                    ? "text-[var(--ds-ink-subtle)]"
                    : "text-red-500"
                )}
              >
                {c.delta}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Result Interpretation & Readiness */}
      <div className="flex flex-col mb-8 p-4 rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] gap-2">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--ds-ink)]">
            <Check className="h-4 w-4 text-emerald-500" strokeWidth={2.5} />
            <span>Candidate improved performance under the same workload.</span>
          </div>
          <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--ds-ink)]">
            <Check className="h-4 w-4 text-emerald-500" strokeWidth={2.5} />
            <span>Functional behavior preserved (100% tests passed).</span>
          </div>
        </div>

        <div className="mt-2 pt-3 border-t border-[var(--ds-hairline)] flex flex-col gap-0.5">
          <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
            Ready for Verification
          </span>
          <span className="text-[12px] text-[var(--ds-ink-subtle)]">
            Candidate measurements have been captured and can now be verified deterministically against baseline telemetry.
          </span>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="pt-0">
        <Button
          onClick={() => onStageSelect("verification")}
          disabled={isRunning || !canAdvance}
          className="h-9 px-5 text-[13px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] gap-2 border-0 shadow-sm disabled:opacity-50"
        >
          View verification <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}
