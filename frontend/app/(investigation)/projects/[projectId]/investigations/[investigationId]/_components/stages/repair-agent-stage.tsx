/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { motion } from "motion/react";
import { RotateCcw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InvestigationStatus } from "@/app/(investigation)/_components/investigation-context";
import { FileDiff, type FileDiffLine } from "@/components/agents/file-diff";
import { WhyThisRepairDisclosure } from "./shared/why-this-repair-disclosure";

export interface FilePatch {
  path: string;
  status?: "modified" | "created" | "deleted";
  added: number;
  removed: number;
  lines: FileDiffLine[];
}

export function RepairAgentStage({
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
  const { diagnosis, repair, target } = data;

  const isRunning = investigationStatus === "running" && data?.status === "repairing";
  const isFailed = investigationStatus === "failed";

  // Build structured patches from investigation data
  const patches: FilePatch[] = (repair?.files || [
    { path: "src/orders/process.ts", changes: { added: 2, removed: 2 } },
    { path: "src/workers/risk-worker.ts", changes: { added: 8, removed: 0 } },
  ]).map((file: any) => {
    if (file.path === "src/orders/process.ts") {
      return {
        path: file.path,
        status: "modified",
        added: file.changes?.added ?? 2,
        removed: file.changes?.removed ?? 2,
        lines: [
          { id: "1", type: "context", oldLine: 18, newLine: 18, content: "export async function processOrder(order) {" },
          { id: "2", type: "context", oldLine: 19, newLine: 19, content: "" },
          { id: "3", type: "removed", oldLine: 20, content: "  const result = calculateRiskScore(order);" },
          { id: "4", type: "removed", oldLine: 21, content: "  return persistOrder({ ...order, result });" },
          { id: "5", type: "added", newLine: 20, content: "  const result = await riskWorker.calculate(order);" },
          { id: "6", type: "added", newLine: 21, content: "  return persistOrder({ ...order, result });" },
          { id: "7", type: "context", oldLine: 22, newLine: 22, content: "}" },
        ],
      };
    }

    if (file.path === "src/workers/risk-worker.ts") {
      return {
        path: file.path,
        status: "created",
        added: file.changes?.added ?? 8,
        removed: file.changes?.removed ?? 0,
        lines: [
          { id: "1", type: "context", newLine: 1, content: "import { Order } from '../types';" },
          { id: "2", type: "context", newLine: 2, content: "" },
          { id: "3", type: "added", newLine: 3, content: "export const riskWorker = {" },
          { id: "4", type: "added", newLine: 4, content: "  async calculate(order: Order): Promise<number> {" },
          { id: "5", type: "added", newLine: 5, content: "    // Delegated worker thread execution offloading CPU risk scoring" },
          { id: "6", type: "added", newLine: 6, content: "    const score = executeRiskModel(order);" },
          { id: "7", type: "added", newLine: 7, content: "    return score;" },
          { id: "8", type: "added", newLine: 8, content: "  }," },
          { id: "9", type: "context", newLine: 9, content: "};" },
        ],
      };
    }

    return {
      path: file.path,
      status: "modified",
      added: file.changes?.added ?? 0,
      removed: file.changes?.removed ?? 0,
      lines: [
        { id: "1", type: "context", oldLine: 1, newLine: 1, content: `// Patch for ${file.path}` },
      ],
    };
  });

  // Expand primary file by default, secondary files collapsed
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({
    [patches[0]?.path || "src/orders/process.ts"]: true,
  });

  const totalAdded = patches.reduce((sum, p) => sum + p.added, 0);
  const totalRemoved = patches.reduce((sum, p) => sum + p.removed, 0);
  const filesChangedCount = repair?.filesChanged || patches.length;
  const rootCause = diagnosis?.primaryFinding?.cause || diagnosis?.title || "Synchronous CPU-bound work blocks the Node.js main thread.";

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
            Repair Failed
          </span>
          <h1 className="text-[26px] md:text-[30px] font-semibold text-[var(--ds-ink)] tracking-tight leading-tight font-heading">
            Repair generation failed
          </h1>
          <p className="text-[13px] text-[var(--ds-ink-subtle)] leading-relaxed max-w-[680px]">
            AEGIS could not prepare a valid candidate patch for the bottleneck.
          </p>
        </div>

        <div className="pt-0">
          <Button
            onClick={() => onStageSelect("repair")}
            className="h-9 px-5 text-[13px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] gap-2 border-0 shadow-sm"
          >
            Retry repair <RotateCcw className="h-3.5 w-3.5" />
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
          Repair
        </h1>
        <p className="text-[13px] text-[var(--ds-ink-subtle)] leading-relaxed max-w-[680px]">
          {isRunning
            ? "Preparing a focused candidate patch based on the identified bottleneck."
            : "Candidate repair prepared for validation."}
        </p>
      </div>

      {/* Horizontal Repair Summary */}
      <div className="flex flex-col mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] text-[12px]">
          {repair?.strategy && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                Strategy
              </span>
              <span className="font-mono text-[var(--ds-ink)] truncate">{repair.strategy}</span>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
              Files
            </span>
            <span className="font-mono text-[var(--ds-ink)]">{filesChangedCount} changed</span>
          </div>
          {repair?.riskSurface && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                Risk
              </span>
              <span className="font-mono text-[var(--ds-ink)]">{repair.riskSurface}</span>
            </div>
          )}
          <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
            <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
              Target
            </span>
            <span className="font-mono text-[var(--ds-ink)] truncate">
              {patches[0]?.path || target?.endpoint || "src/orders/process.ts"}
            </span>
          </div>
        </div>
      </div>

      {/* Root Cause */}
      <div className="flex flex-col mb-6">
        <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-2.5">
          Root Cause
        </span>
        <div className="p-4 rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)]">
          <p className="text-[13px] text-[var(--ds-ink)] leading-relaxed">
            {rootCause}
          </p>
        </div>
      </div>

      {/* Changed Files with FileDiff components */}
      <div className="flex flex-col mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
            Changed Files
          </span>
          <span className="text-[11px] font-mono text-[var(--ds-ink-subtle)]">
            {filesChangedCount} {filesChangedCount === 1 ? "file" : "files"}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {patches.map((file, i) => (
            <motion.div
              key={file.path}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
            >
              <FileDiff
                file={file.path}
                lines={file.lines}
                open={!!expandedFiles[file.path]}
                onOpenChange={(next) =>
                  setExpandedFiles((prev) => ({ ...prev, [file.path]: next }))
                }
                status={isRunning ? "streaming" : "complete"}
                collapseOnComplete={false}
                copyText={file.lines
                  .map((l) => `${l.type === "added" ? "+" : l.type === "removed" ? "-" : " "} ${l.content}`)
                  .join("\n")}
                maxHeight={320}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Change Summary & Why This Repair */}
      <div className="flex flex-col mb-8 pt-1">
        <div className="flex items-center gap-3 text-[12px] font-mono text-[var(--ds-ink-subtle)]">
          <span>{filesChangedCount} files changed</span>
          <span className="text-[var(--ds-hairline-strong)]">·</span>
          <span className="text-emerald-500">+{totalAdded} additions</span>
          <span className="text-[var(--ds-hairline-strong)]">·</span>
          <span className="text-red-500">−{totalRemoved} deletions</span>
        </div>

        <WhyThisRepairDisclosure
          reason={repair?.description || diagnosis?.primaryFinding?.cause}
          strategy={repair?.strategy}
        />
      </div>

      {/* Primary Action Button */}
      <div className="pt-0">
        <Button
          onClick={() => onStageSelect("candidate_test")}
          disabled={isRunning || !canAdvance}
          className="h-9 px-5 text-[13px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] gap-2 border-0 shadow-sm disabled:opacity-50"
        >
          Run candidate test <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}
