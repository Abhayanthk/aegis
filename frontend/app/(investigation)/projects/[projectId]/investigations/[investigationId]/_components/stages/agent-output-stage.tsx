"use client";

import { Loader2 } from "lucide-react";
import { motion } from "motion/react";

type StageStatus = "completed" | "active" | "pending" | "failed";

export function AgentOutputStage({
  title,
  status,
  reports,
}: {
  title: string;
  status: StageStatus;
  reports?: unknown[];
}) {
  const latestReport = reports?.at(-1);
  const isWaiting = status === "active" && !latestReport;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex max-w-[840px] flex-col"
    >
      <div className="mb-8 flex flex-col gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--ds-ink-tertiary)] font-heading">
          Agent output
        </span>
        <h1 className="text-[26px] font-semibold tracking-tight text-[var(--ds-ink)] font-heading md:text-[30px]">
          {title}
        </h1>
      </div>

      {isWaiting ? (
        <div className="rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] p-5">
          <div className="mb-4 flex items-center gap-2.5 text-[13px] font-mono text-amber-500">
            <Loader2 className="size-4 animate-spin" />
            Waiting for this agent’s structured report…
          </div>
          <div className="space-y-3 animate-pulse">
            <div className="h-3 w-2/5 rounded bg-[var(--ds-surface-2)]" />
            <div className="h-3 w-full rounded bg-[var(--ds-surface-2)]" />
            <div className="h-3 w-4/5 rounded bg-[var(--ds-surface-2)]" />
            <div className="h-3 w-3/5 rounded bg-[var(--ds-surface-2)]" />
          </div>
        </div>
      ) : latestReport ? (
        <pre className="max-h-[620px] overflow-auto whitespace-pre-wrap break-words rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] p-4 font-mono text-[12px] leading-6 text-[var(--ds-ink)]">
          {JSON.stringify(latestReport, null, 2)}
        </pre>
      ) : (
        <div className="rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] p-5 text-[13px] text-[var(--ds-ink-subtle)]">
          {status === "failed" ? "This agent did not return a structured report." : "No report has been returned yet."}
        </div>
      )}
    </motion.div>
  );
}
