/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, AlertTriangle, Pause, Loader2, ChevronDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InvestigationStatus } from "@/app/(investigation)/_components/investigation-context";

export function RepoAnalyzerStage({
  data,
  onStageSelect,
  investigationStatus = "completed",
}: {
  data: any;
  onStageSelect: (id: string) => void;
  investigationStatus?: InvestigationStatus;
}) {
  const discovery = data?.discovery;
  const diagnosis = data?.diagnosis;
  const findings: any[] = discovery?.suspiciousPaths || [];
  const primaryFinding = diagnosis?.primaryFinding;

  // Expanded finding state (first finding expanded by default)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const toggleExpand = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  // Determine stage state
  const isPaused = investigationStatus === "paused" || investigationStatus === "pausing";
  const isFailed = investigationStatus === "failed";
  const isAnalyzing = investigationStatus === "running" && data?.status === "analyzing";

  const statusType: "analyzing" | "completed" | "failed" | "paused" = isPaused
    ? "paused"
    : isFailed
      ? "failed"
      : isAnalyzing
        ? "analyzing"
        : "completed";

  const totalFindings = findings.length;
  const filesInspected = discovery?.filesInspected;
  const filesRelevant = discovery?.filesRelevant;
  const runtime = discovery?.runtime || data?.sandbox?.runtime || data?.repository?.runtime;
  const primaryFile = findings[0]?.file || primaryFinding?.affectedEndpoint || discovery?.entrypoint;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col max-w-[840px]"
    >
      {/* Dynamic Animated Status Pill & Header */}
      <div className="flex flex-col gap-2 mb-8">
        <div className="flex items-center gap-2">
          {statusType === "analyzing" && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-500 text-[11px] font-bold tracking-[0.08em] uppercase font-heading">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              ANALYZING
            </div>
          )}
          {statusType === "completed" && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-[11px] font-bold tracking-[0.08em] uppercase font-heading">
              <Check className="h-3 w-3" strokeWidth={2.5} />
              ANALYSIS COMPLETE
            </div>
          )}
          {statusType === "failed" && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-red-500/20 bg-red-500/10 text-red-500 text-[11px] font-bold tracking-[0.08em] uppercase font-heading">
              <AlertTriangle className="h-3 w-3" />
              ANALYSIS FAILED
            </div>
          )}
          {statusType === "paused" && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[var(--ds-hairline)] bg-[var(--ds-surface-2)] text-[var(--ds-ink-subtle)] text-[11px] font-bold tracking-[0.08em] uppercase font-heading">
              <Pause className="h-3 w-3" />
              PAUSED
            </div>
          )}
        </div>

        <h1 className="text-[26px] md:text-[30px] font-semibold text-[var(--ds-ink)] tracking-tight leading-tight font-heading">
          Repository analyzer
        </h1>
        <p className="text-[13px] text-[var(--ds-ink-subtle)] leading-relaxed max-w-[680px]">
          {statusType === "analyzing"
            ? "AEGIS is inspecting execution paths for runtime bottlenecks."
            : totalFindings > 0
              ? "AEGIS identified the execution paths most likely to affect runtime reliability."
              : "Repository analysis completed with no actionable bottlenecks identified."}
        </p>
      </div>

      {/* When Analyzing (Running state) */}
      {statusType === "analyzing" && (
        <div className="flex flex-col rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] p-4 md:p-5 mb-8">
          <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-3">
            Analysis Progress
          </span>
          <div className="flex flex-col gap-2.5 text-[12px] font-mono">
            <div className="flex items-center justify-between text-[var(--ds-ink)]">
              <span>Repository structure</span>
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <div className="flex items-center justify-between text-[var(--ds-ink)]">
              <span>Runtime characteristics</span>
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <div className="flex items-center justify-between text-amber-500 font-medium">
              <span>Execution paths</span>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            </div>
            <div className="flex items-center justify-between text-[var(--ds-ink-tertiary)]">
              <span>Bottleneck detection</span>
              <span>…</span>
            </div>
          </div>
        </div>
      )}

      {/* When Completed with Findings */}
      {statusType !== "analyzing" && totalFindings > 0 && (
        <div className="flex flex-col mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
              Identified Bottlenecks
            </span>
            <span className="text-[11px] font-mono text-[var(--ds-ink-subtle)]">
              {totalFindings} {totalFindings === 1 ? "finding" : "findings"}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {findings.map((path: any, index: number) => {
              const isExpanded = expandedIndex === index;
              const isPrimary = index === 0;
              const severity = (path.severity || "high").toLowerCase();

              // Evidence items related to this finding (if available)
              const relatedEvidence = diagnosis?.evidence?.filter((ev: any) =>
                ev.file === path.file || ev.type === "profile" || ev.type === "runtime"
              );

              return (
                <motion.div
                  key={path.file || index}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.04 }}
                  className={cn(
                    "flex flex-col rounded-[8px] border transition-colors overflow-hidden",
                    isPrimary
                      ? "border-[var(--ds-hairline-strong)] bg-[var(--ds-canvas)]"
                      : "border-[var(--ds-hairline)] bg-[var(--ds-canvas)]",
                  )}
                >
                  {/* Finding Header (Clickable) */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(index)}
                    className="flex items-start justify-between p-4 text-left w-full hover:bg-[var(--ds-surface-1)]/60 transition-colors gap-3"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isPrimary && (
                          <span className="text-[9px] font-bold tracking-wider text-[var(--ds-primary)] bg-[var(--ds-primary)]/10 px-1.5 py-0.5 rounded uppercase font-heading">
                            Primary Finding
                          </span>
                        )}
                        <span className="text-[13px] font-mono font-medium text-[var(--ds-ink)] truncate">
                          {path.file}
                        </span>
                      </div>
                      <p className="text-[13px] text-[var(--ds-ink-subtle)] leading-relaxed mt-0.5">
                        {path.reason}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 pt-0.5">
                      <span
                        className={cn(
                          "text-[10px] font-mono font-semibold px-2 py-0.5 rounded uppercase tracking-wider",
                          severity === "high" && "text-amber-500 bg-amber-500/10 border border-amber-500/20",
                          severity === "medium" && "text-amber-400 bg-amber-400/10 border border-amber-400/20",
                          severity === "low" && "text-[var(--ds-ink-subtle)] bg-[var(--ds-surface-2)] border border-[var(--ds-hairline)]",
                        )}
                      >
                        {severity === "high" ? "High Risk" : severity}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-[var(--ds-ink-tertiary)] transition-transform duration-200",
                          isExpanded && "rotate-180 text-[var(--ds-ink)]",
                        )}
                      />
                    </div>
                  </button>

                  {/* Expanded Detail Panel */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-3 border-t border-[var(--ds-hairline)] bg-[var(--ds-surface-1)]/40 flex flex-col gap-3.5 text-[12px]">
                          {/* File and Affected Scope */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                                Source File
                              </span>
                              <span className="font-mono text-[var(--ds-ink)] text-[12px]">{path.file}</span>
                            </div>
                            {primaryFinding?.affectedEndpoint && (
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                                  Affected Endpoint
                                </span>
                                <span className="font-mono text-[var(--ds-ink)] text-[12px]">
                                  {primaryFinding.affectedEndpoint}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Technical Cause */}
                          {primaryFinding?.cause && (
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                                Root Mechanism
                              </span>
                              <p className="text-[12px] text-[var(--ds-ink)] leading-relaxed">
                                {primaryFinding.cause}
                              </p>
                            </div>
                          )}

                          {/* Evidence Signals */}
                          {relatedEvidence && relatedEvidence.length > 0 && (
                            <div className="flex flex-col gap-1.5 pt-1">
                              <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                                Supporting Evidence
                              </span>
                              <div className="flex flex-col gap-1.5 font-mono text-[11px]">
                                {relatedEvidence.map((ev: any, evIdx: number) => (
                                  <div
                                    key={evIdx}
                                    className="flex items-center gap-2 text-[var(--ds-ink-subtle)] bg-[var(--ds-canvas)] py-1.5 px-2.5 rounded border border-[var(--ds-hairline)]"
                                  >
                                    <span className="text-[var(--ds-ink-tertiary)] uppercase text-[9px] w-14 shrink-0">
                                      {ev.type}
                                    </span>
                                    <span className="text-[var(--ds-ink)] truncate">
                                      {ev.description || `${ev.metric}: ${ev.value} ${ev.unit || ""}`}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State when no findings */}
      {statusType !== "analyzing" && totalFindings === 0 && (
        <div className="flex flex-col p-6 rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] mb-8 text-center items-center justify-center">
          <Check className="h-5 w-5 text-emerald-500 mb-2" />
          <h3 className="text-[14px] font-semibold text-[var(--ds-ink)] font-heading">
            No actionable bottlenecks identified
          </h3>
          <p className="text-[12px] text-[var(--ds-ink-subtle)] mt-1 max-w-[420px]">
            Repository analysis completed with no high-risk execution bottlenecks detected.
          </p>
        </div>
      )}

      {/* Technical Summary Surface */}
      <div className="flex flex-col rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] p-4 md:p-5 mb-8">
        <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-3">
          Analysis Metadata
        </span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[12px]">
          {filesInspected !== undefined && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                Files Inspected
              </span>
              <span className="font-mono text-[var(--ds-ink)]">{filesInspected}</span>
            </div>
          )}
          {filesRelevant !== undefined && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                Relevant Files
              </span>
              <span className="font-mono text-[var(--ds-ink)]">{filesRelevant}</span>
            </div>
          )}
          {runtime && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                Runtime
              </span>
              <span className="font-mono text-[var(--ds-ink)] truncate">{runtime}</span>
            </div>
          )}
          {primaryFile && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                Primary Path
              </span>
              <span className="font-mono text-[var(--ds-ink)] truncate">{primaryFile}</span>
            </div>
          )}
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="pt-0">
        <Button
          onClick={() => onStageSelect("endpoint_finder")}
          disabled={statusType === "analyzing"}
          className="h-9 px-5 text-[13px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] gap-2 border-0 shadow-sm disabled:opacity-50"
        >
          Find testable endpoints <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}
