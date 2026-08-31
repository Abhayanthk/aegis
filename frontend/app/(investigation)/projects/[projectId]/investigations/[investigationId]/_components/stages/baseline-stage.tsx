/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { motion } from "motion/react";
import { Loader2, RotateCcw, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InvestigationStatus } from "@/app/(investigation)/_components/investigation-context";

export function BaselineStage({
  data,
  onStageSelect,
  investigationStatus = "completed",
}: {
  data: any;
  onStageSelect: (id: string) => void;
  investigationStatus?: InvestigationStatus;
}) {
  const { baseline, reproduction, target, sandbox, configuration } = data;
  const metrics = baseline?.metrics;

  const isRunning = investigationStatus === "running" && data?.status === "measuring";
  const isFailed = investigationStatus === "failed";

  const targetEndpoint = target ? `${target.method} ${target.endpoint}` : "POST /orders/process";
  const requestsPerSec = reproduction?.workload?.requestsPerSecond || configuration?.workload?.requestsPerSecond || 100;
  const durationSec = reproduction?.workload?.durationSeconds || 30;
  const sandboxId = sandbox?.id;

  if (isRunning) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex flex-col max-w-[840px]"
      >
        <div className="flex flex-col gap-1.5 mb-8">
          <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
            Baseline Measurement
          </span>
          <h1 className="text-[26px] md:text-[30px] font-semibold text-[var(--ds-ink)] tracking-tight leading-tight font-heading">
            Running baseline
          </h1>
          <p className="text-[13px] text-[var(--ds-ink-subtle)] leading-relaxed max-w-[680px]">
            AEGIS is measuring the selected endpoint under the configured workload.
          </p>
        </div>

        <div className="flex flex-col rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] p-5 mb-8">
          <div className="flex items-center gap-2.5 text-[13px] text-amber-500 font-mono">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Collecting runtime measurements…</span>
          </div>
        </div>
      </motion.div>
    );
  }

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
            Measurement Failed
          </span>
          <h1 className="text-[26px] md:text-[30px] font-semibold text-[var(--ds-ink)] tracking-tight leading-tight font-heading">
            Baseline test failed
          </h1>
          <p className="text-[13px] text-[var(--ds-ink-subtle)] leading-relaxed max-w-[680px]">
            AEGIS could not complete the baseline workload against the sandbox.
          </p>
        </div>

        <div className="pt-0">
          <Button
            onClick={() => onStageSelect("baseline_test")}
            className="h-9 px-5 text-[13px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] gap-2 border-0 shadow-sm"
          >
            Retry baseline <RotateCcw className="h-3.5 w-3.5" />
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
      {/* Title & Description (No status badge) */}
      <div className="flex flex-col gap-1.5 mb-8">
        <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
          Performance Baseline
        </span>
        <h1 className="text-[26px] md:text-[30px] font-semibold text-[var(--ds-ink)] tracking-tight leading-tight font-heading">
          Baseline test
        </h1>
        <p className="text-[13px] text-[var(--ds-ink-subtle)] leading-relaxed max-w-[680px]">
          AEGIS ran the selected workload against the original repository to establish a performance baseline.
        </p>
      </div>

      {/* Workload Context */}
      <div className="flex flex-col mb-6">
        <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-2.5">
          Workload
        </span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] text-[12px]">
          <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
            <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
              Target
            </span>
            <span className="font-mono text-[var(--ds-ink)] truncate">{targetEndpoint}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
              Requests / sec
            </span>
            <span className="font-mono text-[var(--ds-ink)]">{requestsPerSec}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
              Duration
            </span>
            <span className="font-mono text-[var(--ds-ink)]">{durationSec}s</span>
          </div>
          {sandboxId && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                Sandbox
              </span>
              <span className="font-mono text-[var(--ds-ink)] truncate">{sandboxId}</span>
            </div>
          )}
        </div>
      </div>

      {/* Baseline Metrics Table */}
      {metrics && (
        <div className="flex flex-col mb-6">
          <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-2.5">
            Baseline Metrics
          </span>
          <div className="flex flex-col rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] overflow-hidden divide-y divide-[var(--ds-hairline)]">
            {metrics.eventLoopP99 && (
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.04 }}
                className="flex items-center justify-between px-4 py-3 text-[13px]"
              >
                <span className="text-[var(--ds-ink-subtle)]">99th Event-Loop Delay</span>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-amber-500 font-semibold">
                    {metrics.eventLoopP99.value.toLocaleString()} {metrics.eventLoopP99.unit}
                  </span>
                  {metrics.eventLoopP99.target && (
                    <span className="text-[11px] text-[var(--ds-ink-tertiary)]">
                      target &lt; {metrics.eventLoopP99.target} {metrics.eventLoopP99.unit}
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {metrics.endpointP99 && (
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.08 }}
                className="flex items-center justify-between px-4 py-3 text-[13px]"
              >
                <span className="text-[var(--ds-ink-subtle)]">99th Endpoint Latency</span>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-amber-500 font-semibold">
                    {metrics.endpointP99.value.toLocaleString()} {metrics.endpointP99.unit}
                  </span>
                  {metrics.endpointP99.threshold && (
                    <span className="text-[11px] text-[var(--ds-ink-tertiary)]">
                      target &lt; {metrics.endpointP99.threshold} {metrics.endpointP99.unit}
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {metrics.healthAvailability && (
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.12 }}
                className="flex items-center justify-between px-4 py-3 text-[13px]"
              >
                <span className="text-[var(--ds-ink-subtle)]">Health Availability</span>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-amber-500 font-semibold">
                    {metrics.healthAvailability.value}{metrics.healthAvailability.unit}
                  </span>
                  <span className="text-[11px] text-[var(--ds-ink-tertiary)]">
                    target 100%
                  </span>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.16 }}
              className="flex items-center justify-between px-4 py-3 text-[13px]"
            >
              <span className="text-[var(--ds-ink-subtle)]">Requests / sec</span>
              <span className="font-mono text-[var(--ds-ink)]">{requestsPerSec}</span>
            </motion.div>

            {metrics.functionalTests && (
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.2 }}
                className="flex items-center justify-between px-4 py-3 text-[13px]"
              >
                <span className="text-[var(--ds-ink-subtle)]">Functional Tests</span>
                <div className="flex items-center gap-1.5 text-emerald-500 font-mono text-[12px]">
                  <Check className="h-3.5 w-3.5" />
                  <span>
                    {metrics.functionalTests.passed} / {metrics.functionalTests.total} passed
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Baseline Status / Assessment */}
      <div className="flex flex-col mb-8">
        <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-2.5">
          Baseline Status
        </span>
        <div className="flex flex-col p-4 rounded-[8px] border border-amber-500/20 bg-amber-500/[0.04]">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[13px] font-semibold text-[var(--ds-ink)] font-heading">
              Baseline exceeds target
            </span>
          </div>
          <p className="text-[13px] text-[var(--ds-ink-subtle)] leading-relaxed">
            {baseline?.summary || reproduction?.failure || "Performance degraded under concurrent traffic. 99th latency exceeded configured targets."}
          </p>
        </div>
      </div>

      {/* Primary Action */}
      <div className="pt-0">
        <Button
          onClick={() => onStageSelect("repair")}
          className="h-9 px-5 text-[13px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] gap-2 border-0 shadow-sm"
        >
          Prepare repair <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}
