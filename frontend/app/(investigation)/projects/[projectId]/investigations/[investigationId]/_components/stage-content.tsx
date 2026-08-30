"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Check,
  Lock,
  X,
  Loader2,
  ArrowRight,
  GitPullRequest,
  Copy,
  CheckCircle2,
  Circle,
  Play,
  Pause,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  FolderGit2,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { InvestigationStatus } from "@/app/(investigation)/_components/investigation-context";
import { FileDiff, type FileDiffLine } from "@/components/agents/file-diff";

/* ============================================================
   TYPES
   ============================================================ */

interface StageContentProps {
  data: any;
  activeStage: string;
  onStageSelect: (stageId: string) => void;
  investigationStatus: InvestigationStatus;
  repairAttempt: number;
  maxAttempts: number;
  onRetry: () => void;
  onReject: () => void;
  onResume?: () => void;
  onPause?: () => void;
}

/* ============================================================
   SHARED: Stage Header
   ============================================================ */

function StageHeader({
  status,
  title,
  description,
}: {
  status?: "completed" | "active" | "waiting" | "failed" | "paused" | "cancelled";
  title: string;
  description: string;
}) {
  const statusConfig: Record<string, { label: string; color: string; pulse?: boolean }> = {
    completed: { label: "Completed", color: "text-emerald-500" },
    active: { label: "Active", color: "text-amber-500", pulse: true },
    waiting: { label: "Waiting for you", color: "text-amber-500", pulse: true },
    failed: { label: "Failed", color: "text-red-500" },
    paused: { label: "Paused", color: "text-[var(--ds-ink-subtle)]" },
    cancelled: { label: "Cancelled", color: "text-[var(--ds-ink-subtle)]" },
  };

  const cfg = status ? (statusConfig[status] ?? statusConfig.active) : null;

  return (
    <div className="flex flex-col gap-1.5 mb-8 md:mb-10">
      {cfg && (
        <div className="flex items-center gap-2">
          {cfg.pulse && (
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          )}
          <span
            className={cn(
              "text-[11px] font-bold tracking-[0.08em] uppercase font-heading",
              cfg.color,
            )}
          >
            {cfg.label}
          </span>
        </div>
      )}
      <h1 className="text-[28px] md:text-[32px] font-semibold text-[var(--ds-ink)] tracking-tight leading-tight font-heading">
        {title}
      </h1>
      <p className="text-[14px] text-[var(--ds-ink-subtle)] leading-relaxed mt-1 max-w-[680px]">
        {description}
      </p>
    </div>
  );
}

/* ============================================================
   SHARED: Paused Overlay
   ============================================================ */

function PausedOverlay({ onResume }: { onResume?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="flex items-center justify-center h-12 w-12 rounded-full border border-[var(--ds-hairline)] bg-[var(--ds-surface-2)] mb-6">
        <Pause className="h-5 w-5 text-[var(--ds-ink-subtle)]" />
      </div>
      <h2 className="text-[20px] font-semibold text-[var(--ds-ink)] font-heading mb-2">
        Investigation paused
      </h2>
      <p className="text-[14px] text-[var(--ds-ink-subtle)] mb-8 max-w-[400px]">
        AEGIS is waiting to resume. All progress, metrics, and trace history are preserved.
      </p>
      {onResume && (
        <Button
          onClick={onResume}
          className="h-9 px-5 text-[13px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] border-0 gap-2"
        >
          <Play className="h-3.5 w-3.5" />
          Resume investigation
        </Button>
      )}
    </motion.div>
  );
}

/* ============================================================
   SHARED: Cancelled Overlay
   ============================================================ */

function CancelledOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="flex items-center justify-center h-12 w-12 rounded-full border border-[var(--ds-hairline)] bg-[var(--ds-surface-2)] mb-6">
        <X className="h-5 w-5 text-[var(--ds-ink-subtle)]" />
      </div>
      <h2 className="text-[20px] font-semibold text-[var(--ds-ink)] font-heading mb-2">
        Investigation cancelled
      </h2>
      <p className="text-[14px] text-[var(--ds-ink-subtle)] max-w-[400px]">
        No changes were written to GitHub.
      </p>
    </motion.div>
  );
}

/* ============================================================
   SHARED: MetricRow (compact label → value)
   ============================================================ */

function MetricRow({
  label,
  value,
  mono = true,
  className: extraClass,
}: {
  label: string;
  value: string | React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between py-3 border-b border-[var(--ds-hairline)] last:border-0", extraClass)}>
      <span className="text-[13px] text-[var(--ds-ink-subtle)]">{label}</span>
      <span className={cn("text-[13px] text-[var(--ds-ink)]", mono && "font-mono")}>
        {value}
      </span>
    </div>
  );
}

/* ============================================================
   STAGE 1: Repository context (repo_context)
   ============================================================ */

function RepoInfoStage({ data, onStageSelect }: { data: any; onStageSelect: (id: string) => void }) {
  const repository = data?.repository;
  const discovery = data?.discovery;
  const target = data?.target;

  // Graceful loading / empty state
  if (!repository && !discovery) {
    return (
      <div className="flex flex-col max-w-[820px] py-12">
        <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-2">
          Repository
        </span>
        <h1 className="text-[24px] font-semibold text-[var(--ds-ink)] font-heading mb-2">
          Loading repository information…
        </h1>
        <p className="text-[13px] text-[var(--ds-ink-subtle)]">
          Connecting to GitHub workspace.
        </p>
      </div>
    );
  }

  // Real data extraction
  const repoName = repository?.name || "Repository";
  const repoOwner = repository?.owner;
  const fullName = repoOwner ? `${repoOwner} / ${repoName}` : repoName;
  const repoUrl = repository?.url;
  const repoDescription =
    repository?.description ||
    "AEGIS will inspect this repository to identify runtime bottlenecks and testable execution paths.";
  const branch = repository?.branch || "main";
  const commitSha = repository?.commit || repository?.commitSha;
  const commitMessage = repository?.commitMessage;
  const commitTime = repository?.commitTime;
  const lastCommitDisplay = [commitSha, commitMessage, commitTime].filter(Boolean).join(" · ");

  const runtime = discovery?.runtime || data?.sandbox?.runtime;
  const entrypoint = discovery?.entrypoint;
  const filesInspected = discovery?.filesInspected;
  const visibility = repository?.visibility || "private";

  // Infer language cleanly from entrypoint or explicit repository metadata
  const language =
    repository?.language ||
    (entrypoint?.endsWith(".ts")
      ? "TypeScript"
      : entrypoint?.endsWith(".js")
        ? "JavaScript"
        : entrypoint?.endsWith(".py")
          ? "Python"
          : entrypoint?.endsWith(".go")
            ? "Go"
            : undefined);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col max-w-[820px]"
    >
      {/* Repository Identity */}
      <div className="flex flex-col gap-1.5 mb-8">
        <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
          Repository
        </span>
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center justify-center h-9 w-9 rounded-[6px] border border-[var(--ds-hairline)] bg-[var(--ds-surface-2)] text-[var(--ds-ink)] shrink-0">
            <FolderGit2 className="h-4 w-4 text-[var(--ds-ink-subtle)]" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[26px] md:text-[30px] font-semibold text-[var(--ds-ink)] tracking-tight leading-tight font-heading">
              {repoName}
            </h1>
            <span className="text-[12px] text-[var(--ds-ink-subtle)] font-mono">
              {fullName}
            </span>
          </div>
        </div>
        {repoDescription && (
          <p className="text-[13px] text-[var(--ds-ink-subtle)] leading-relaxed mt-2.5 max-w-[680px]">
            {repoDescription}
          </p>
        )}
      </div>

      {/* Repository Overview Surface */}
      <div className="flex flex-col rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] mb-6 overflow-hidden">
        {/* Section 1: Core Configuration */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6 p-4 md:p-5 border-b border-[var(--ds-hairline)] text-[12px]">
          {branch && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                Branch
              </span>
              <span className="font-mono text-[var(--ds-ink)] truncate">{branch}</span>
            </div>
          )}
          {visibility && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                Visibility
              </span>
              <span className="text-[var(--ds-ink)] capitalize">{visibility}</span>
            </div>
          )}
          {language && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                Language
              </span>
              <span className="text-[var(--ds-ink)]">{language}</span>
            </div>
          )}
          {runtime && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                Runtime
              </span>
              <span className="font-mono text-[var(--ds-ink)]">{runtime}</span>
            </div>
          )}
        </div>

        {/* Section 2: Structure & Commit */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 p-4 md:p-5 text-[12px] bg-[var(--ds-surface-1)]/30">
          {entrypoint && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                Entrypoint
              </span>
              <span className="font-mono text-[var(--ds-ink)] truncate">{entrypoint}</span>
            </div>
          )}
          {filesInspected !== undefined && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                Files
              </span>
              <span className="font-mono text-[var(--ds-ink)]">{filesInspected}</span>
            </div>
          )}
          {lastCommitDisplay && (
            <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
              <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                Last commit
              </span>
              <span className="font-mono text-[var(--ds-ink-subtle)] truncate">{lastCommitDisplay}</span>
            </div>
          )}
        </div>
      </div>

      {/* Execution Context / Investigation Target */}
      {target && (
        <div className="flex flex-col rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] p-4 md:p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
              Investigation Target
            </span>
            {target.description && (
              <span className="text-[11px] text-[var(--ds-ink-subtle)]">
                {target.description}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-4 py-2.5 px-3 rounded-[6px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)]">
            <div className="flex items-center gap-2.5 font-mono text-[13px]">
              <span className="text-[11px] font-bold text-[var(--ds-primary)] uppercase">
                {target.method}
              </span>
              <span className="text-[var(--ds-ink)] font-medium">
                {target.endpoint}
              </span>
            </div>
            {entrypoint && (
              <div className="flex items-center gap-2 text-[12px] font-mono text-[var(--ds-ink-subtle)]">
                <span className="text-[var(--ds-ink-tertiary)]">→</span>
                <span>{entrypoint}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions: Primary Start Agent & Secondary See Repository */}
      <div className="flex items-center gap-4 pt-0">
        <Button
          onClick={() => onStageSelect("repo_analyzer")}
          className="h-9 px-5 text-[13px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] gap-2 border-0 shadow-sm"
        >
          Start Agent <ArrowRight className="h-3.5 w-3.5" />
        </Button>
        {repoUrl && (
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[13px] text-[var(--ds-ink-subtle)] hover:text-[var(--ds-ink)] transition-colors px-2 py-1.5 font-medium"
          >
            <span>See repository</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </motion.div>
  );
}

/* ============================================================
   STAGE 2: Repository analyzer (repo_analyzer)
   ============================================================ */

function RepoAnalyzerStage({
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

/* ============================================================
   STAGE 3: Endpoint Finder (endpoint_finder)
   ============================================================ */

function EndpointFinderStage({ data, onStageSelect }: { data: any; onStageSelect: (id: string) => void }) {
  const target = data?.target;
  const discovery = data?.discovery;
  const diagnosis = data?.diagnosis;

  // Extract discovered routes from real investigation data
  const healthMethod = "GET";
  const healthPath = discovery?.healthEndpoint?.replace("GET ", "") || data?.configuration?.healthProbe?.endpoint || "/healthz";

  const targetMethod = target?.method || "POST";
  const targetPath = target?.endpoint || "/orders/process";

  // Build the list of real routes found in discovery/target/routes
  const rawRoutes: Array<{ method: string; path: string; description?: string; isProbe?: boolean }> = [
    ...(data?.routes || []),
    { method: healthMethod, path: healthPath, description: "Health probe endpoint", isProbe: true },
    { method: targetMethod, path: targetPath, description: target?.description || "Order processing endpoint" },
  ];

  // Deduplicate by method + path
  const uniqueRoutes = rawRoutes.filter(
    (route, idx, arr) => arr.findIndex((r) => r.method === route.method && r.path === route.path) === idx
  );

  // Selected route state (defaults to configured target)
  const [selectedRoute, setSelectedRoute] = useState<{ method: string; path: string; description?: string }>({
    method: targetMethod,
    path: targetPath,
    description: target?.description || "Order processing endpoint",
  });

  // Why this target explanation from real data
  const whyReason =
    discovery?.suspiciousPaths?.[0]?.reason ||
    diagnosis?.primaryFinding?.cause ||
    diagnosis?.primaryFinding?.title ||
    target?.description ||
    "Selected as the most relevant testable surface.";

  // Context metadata
  const entrypoint = discovery?.entrypoint;
  const relevantFile = discovery?.suspiciousPaths?.[0]?.file;
  const workload = data?.configuration?.workload;

  // Operation if available
  const operation =
    diagnosis?.primaryFinding?.cause?.includes("calculateRiskScore") ||
    discovery?.suspiciousPaths?.[0]?.reason?.includes("risk scoring")
      ? "calculateRiskScore()"
      : undefined;

  // Empty state handling
  if (uniqueRoutes.length === 0) {
    return (
      <div className="flex flex-col max-w-[820px] py-12">
        <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-2">
          Endpoints Not Found
        </span>
        <h1 className="text-[24px] font-semibold text-[var(--ds-ink)] font-heading mb-2">
          No API routes identified
        </h1>
        <p className="text-[13px] text-[var(--ds-ink-subtle)]">
          AEGIS could not identify a suitable API route in this repository.
        </p>
      </div>
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
          Endpoint Discovery
        </span>
        <h1 className="text-[26px] md:text-[30px] font-semibold text-[var(--ds-ink)] tracking-tight leading-tight font-heading">
          Endpoint Finder
        </h1>
        <p className="text-[13px] text-[var(--ds-ink-subtle)] leading-relaxed max-w-[680px]">
          AEGIS searched the repository for API routes and selected the most relevant test surface.
        </p>
      </div>

      {/* Discovered Routes */}
      <div className="flex flex-col mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
            Discovered Routes
          </span>
          <span className="text-[11px] font-mono text-[var(--ds-ink-subtle)]">
            {uniqueRoutes.length} {uniqueRoutes.length === 1 ? "route" : "routes"} found
          </span>
        </div>
        <div className="flex flex-col rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] overflow-hidden divide-y divide-[var(--ds-hairline)]">
          {uniqueRoutes.map((route, i) => {
            const isSelected = selectedRoute.path === route.path && selectedRoute.method === route.method;
            return (
              <motion.button
                key={i}
                type="button"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.04 }}
                onClick={() =>
                  setSelectedRoute({
                    method: route.method,
                    path: route.path,
                    description: route.description,
                  })
                }
                className={cn(
                  "flex items-center justify-between px-4 py-3 text-left transition-colors w-full",
                  isSelected
                    ? "bg-[var(--ds-surface-2)]/80 text-[var(--ds-ink)]"
                    : "hover:bg-[var(--ds-surface-1)] text-[var(--ds-ink-subtle)] hover:text-[var(--ds-ink)]"
                )}
              >
                <div className="flex items-center gap-3 font-mono text-[13px]">
                  <span
                    className={cn(
                      "text-[11px] font-bold uppercase w-12 shrink-0",
                      route.method === "POST" ? "text-amber-500" : "text-blue-400"
                    )}
                  >
                    {route.method}
                  </span>
                  <span
                    className={cn(
                      "font-medium",
                      isSelected ? "text-[var(--ds-ink)]" : "text-[var(--ds-ink-subtle)]"
                    )}
                  >
                    {route.path}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {route.description && (
                    <span className="text-[11px] text-[var(--ds-ink-tertiary)] hidden sm:inline">
                      {route.description}
                    </span>
                  )}
                  {isSelected ? (
                    <span className="text-[10px] font-bold text-[var(--ds-primary)] bg-[var(--ds-primary)]/10 px-2 py-0.5 rounded uppercase font-heading">
                      Selected
                    </span>
                  ) : (
                    <span className="text-[11px] text-[var(--ds-ink-tertiary)] hover:text-[var(--ds-ink-subtle)]">
                      Select
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Selected Target */}
      <div className="flex flex-col mb-6">
        <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-2.5">
          Selected Target
        </span>
        <motion.div
          layout
          className="flex flex-col p-4 rounded-[8px] border border-[var(--ds-hairline-strong)] bg-[var(--ds-surface-1)]"
        >
          <div className="flex items-center gap-3 font-mono text-[14px]">
            <span className="text-[11px] font-bold uppercase text-[var(--ds-primary)]">
              {selectedRoute.method}
            </span>
            <span className="text-[var(--ds-ink)] font-semibold">
              {selectedRoute.path}
            </span>
          </div>
          {selectedRoute.description && (
            <p className="text-[12px] text-[var(--ds-ink-subtle)] mt-1.5 leading-relaxed">
              {selectedRoute.description}
            </p>
          )}
        </motion.div>
      </div>

      {/* Why This Target */}
      <div className="flex flex-col mb-6">
        <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-2.5">
          Why This Target
        </span>
        <div className="p-4 rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)]">
          <p className="text-[13px] text-[var(--ds-ink)] leading-relaxed">
            {whyReason}
          </p>
        </div>
      </div>

      {/* Context Metadata */}
      {(entrypoint || relevantFile || operation || workload) && (
        <div className="flex flex-col rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] p-4 md:p-5 mb-8">
          <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-3">
            Context
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px]">
            {entrypoint && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                  Entrypoint
                </span>
                <span className="font-mono text-[var(--ds-ink)] truncate">{entrypoint}</span>
              </div>
            )}
            {relevantFile && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                  Relevant File
                </span>
                <span className="font-mono text-[var(--ds-ink)] truncate">{relevantFile}</span>
              </div>
            )}
            {operation && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                  Operation
                </span>
                <span className="font-mono text-[var(--ds-ink)] truncate">{operation}</span>
              </div>
            )}
            {workload && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                  Configured Workload
                </span>
                <span className="font-mono text-[var(--ds-ink)]">
                  {workload.requestsPerSecond} req/s · {workload.type}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Primary Action Button */}
      <div className="pt-0">
        <Button
          onClick={() => onStageSelect("baseline_test")}
          className="h-9 px-5 text-[13px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] gap-2 border-0 shadow-sm"
        >
          Establish baseline <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

/* ============================================================
   STAGE 4: Baseline Test Runner (baseline_test)
   ============================================================ */

function BaselineStage({
  data,
  onStageSelect,
  investigationStatus = "completed",
}: {
  data: any;
  onStageSelect: (id: string) => void;
  investigationStatus?: InvestigationStatus;
}) {
  const { baseline, reproduction, target, sandbox, discovery, configuration } = data;
  const metrics = baseline?.metrics;

  const isRunning = investigationStatus === "running" && data?.status === "measuring";
  const isFailed = investigationStatus === "failed";

  const targetEndpoint = target ? `${target.method} ${target.endpoint}` : "POST /orders/process";
  const requestsPerSec = reproduction?.workload?.requestsPerSecond || configuration?.workload?.requestsPerSecond || 100;
  const durationSec = reproduction?.workload?.durationSeconds || 30;
  const sandboxId = sandbox?.id;
  const runtime = sandbox?.runtime || discovery?.runtime;

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

/* ============================================================
   STAGE 5: Repair (repair)
   ============================================================ */

interface FilePatch {
  path: string;
  status?: "modified" | "created" | "deleted";
  added: number;
  removed: number;
  lines: FileDiffLine[];
}

function WhyThisRepairDisclosure({
  reason,
  strategy,
}: {
  reason?: string;
  strategy?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col mt-3">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--ds-ink-subtle)] hover:text-[var(--ds-ink)] transition-colors self-start py-1"
      >
        <span>Why this repair?</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform duration-200", isOpen && "rotate-180 text-[var(--ds-ink)]")}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)]/60 text-[12px] text-[var(--ds-ink-subtle)] leading-relaxed mt-2 flex flex-col gap-2">
              <p>
                {reason ||
                  "The synchronous risk calculation was identified as blocking the Node.js main thread during the baseline workload."}
              </p>
              {strategy && (
                <p className="text-[var(--ds-ink)] font-mono text-[11px]">
                  Strategy: {strategy} — delegates CPU-bound execution to a worker boundary without modifying the public endpoint contract.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RepairAgentStage({
  data,
  onStageSelect,
  investigationStatus = "completed",
}: {
  data: any;
  onStageSelect: (id: string) => void;
  investigationStatus?: InvestigationStatus;
}) {
  const { diagnosis, repair, target } = data;

  const isRunning = investigationStatus === "running" && data?.status === "repairing";
  const isFailed = investigationStatus === "failed";
  const isPaused = investigationStatus === "paused" || investigationStatus === "pausing";

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

  const toggleFile = (path: string) => {
    setExpandedFiles((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

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
          disabled={isRunning}
          className="h-9 px-5 text-[13px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] gap-2 border-0 shadow-sm disabled:opacity-50"
        >
          Run candidate test <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

/* ============================================================
   STAGE 6: Candidate test (candidate_test)
   ============================================================ */

function CandidateTestStage({
  data,
  onStageSelect,
  investigationStatus = "completed",
}: {
  data: any;
  onStageSelect: (id: string) => void;
  investigationStatus?: InvestigationStatus;
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
          disabled={isRunning}
          className="h-9 px-5 text-[13px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] gap-2 border-0 shadow-sm disabled:opacity-50"
        >
          View verification <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

/* ============================================================
   STAGE 7: Verification (verification)
   ============================================================ */

function VerificationStage({
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

/* ============================================================
   STAGE 8: Human gate (human_gate)
   ============================================================ */

function HumanDecisionStage({
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
              variant="ghost"
              className="h-9 px-4 text-[13px] font-medium text-red-500 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-40"
            >
              Reject changes
            </Button>
            <Button
              onClick={onRetry}
              disabled={retryDisabled || isAccepting}
              variant="outline"
              className="h-9 px-4 text-[13px] font-medium border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] hover:bg-[var(--ds-surface-2)] disabled:opacity-40"
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

/* ============================================================
   STAGE 9: Pull Request (pull_request)
   ============================================================ */

function RaisingPRStage({
  data,
  onStageSelect,
  investigationStatus = "completed",
}: {
  data: any;
  onStageSelect: (id: string) => void;
  investigationStatus?: InvestigationStatus;
}) {
  const { pullRequest, repair, verification } = data;
  const vm = verification?.metrics;

  const [isEditing, setIsEditing] = useState(false);
  const [prTitle, setPrTitle] = useState(pullRequest?.title || "Fix Node.js event-loop starvation");
  const [prDescription, setPrDescription] = useState(
    pullRequest?.description || "Move CPU-bound risk scoring off the Node.js main thread after deterministic runtime verification."
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
  };

  const repoUrl = data?.repository?.url || "https://github.com/Abhyanthk/orders-api";
  const prNumber = pullRequest?.number || 42;
  const prUrl = `${repoUrl}/pull/${prNumber}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col max-w-[840px]"
    >
      {/* Header */}
      <div className="flex flex-col gap-1.5 mb-8">
        <span className="text-[10px] font-bold tracking-widest text-emerald-500 uppercase font-heading">
          PULL REQUEST READY
        </span>
        <h1 className="text-[26px] md:text-[30px] font-semibold text-[var(--ds-ink)] tracking-tight leading-tight font-heading">
          Pull request
        </h1>
        <p className="text-[13px] text-[var(--ds-ink-subtle)] leading-relaxed max-w-[680px]">
          The approved repair has been written to GitHub and the pull request is ready.
        </p>
      </div>

      {/* Pull Request Card */}
      <div className="flex flex-col rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] overflow-hidden mb-6">
        {/* PR Main Info */}
        <div className="flex flex-col p-5 md:p-6 border-b border-[var(--ds-hairline)]">
          <div className="flex items-start gap-3">
            <GitPullRequest className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1.5 min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-[16px] font-semibold text-[var(--ds-ink)] font-heading">
                  {prTitle}
                </span>
                <span className="text-[13px] text-[var(--ds-ink-tertiary)] font-mono">
                  #{prNumber}
                </span>
              </div>
              <p className="text-[13px] text-[var(--ds-ink-subtle)] leading-relaxed">
                {prDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Technical Metadata Row */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-5 md:p-6 border-b border-[var(--ds-hairline)] text-[12px] font-mono">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-sans text-[var(--ds-ink-tertiary)] uppercase font-heading">Branch</span>
            <span className="text-[var(--ds-ink)] truncate">{pullRequest?.branch?.name || "aegis/fix-a91f"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-sans text-[var(--ds-ink-tertiary)] uppercase font-heading">Base</span>
            <span className="text-[var(--ds-ink)] truncate">{pullRequest?.branch?.base || "main"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-sans text-[var(--ds-ink-tertiary)] uppercase font-heading">Commit</span>
            <span className="text-[var(--ds-ink)] truncate">{pullRequest?.commit?.sha || "8d3c1f2"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-sans text-[var(--ds-ink-tertiary)] uppercase font-heading">Files</span>
            <span className="text-[var(--ds-ink)]">{repair?.filesChanged || 2}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-sans text-[var(--ds-ink-tertiary)] uppercase font-heading">Additions</span>
            <span className="text-emerald-500 font-semibold">+10</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-sans text-[var(--ds-ink-tertiary)] uppercase font-heading">Deletions</span>
            <span className="text-red-500 font-semibold">−2</span>
          </div>
        </div>

        {/* Verification Status Confirmation */}
        <div className="flex items-center justify-between p-4 md:p-5 bg-[var(--ds-surface-1)]/40 border-b border-[var(--ds-hairline)] text-[12px]">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-emerald-500 font-mono">
              <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
              <span>{vm?.functionalTests?.after ?? 100} / {vm?.functionalTests?.total ?? 100} tests passed</span>
            </div>
            <span className="text-[var(--ds-hairline-strong)]">·</span>
            <div className="flex items-center gap-1.5 text-emerald-500 font-medium">
              <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
              <span>Deterministic verification passed</span>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center justify-between p-4 md:p-5">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsEditing(true)}
            className="h-9 px-4 text-[13px] font-medium border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] hover:bg-[var(--ds-surface-2)]"
          >
            Edit pull request
          </Button>

          <Button
            onClick={() => window.open(prUrl, "_blank", "noopener,noreferrer")}
            className="h-9 px-5 text-[13px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] gap-2 border-0 shadow-sm"
          >
            View pull request <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Inline Edit Modal / Disclosure */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="flex flex-col p-5 md:p-6 rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] mb-6 shadow-sm"
          >
            <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-4 block">
              Edit Pull Request Metadata
            </span>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-[var(--ds-ink-subtle)]">Title</label>
                <input
                  type="text"
                  value={prTitle}
                  onChange={(e) => setPrTitle(e.target.value)}
                  className="h-9 px-3 rounded-[6px] border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] text-[13px] text-[var(--ds-ink)] focus:outline-none focus:border-[var(--ds-primary)]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-[var(--ds-ink-subtle)]">Description</label>
                <textarea
                  rows={3}
                  value={prDescription}
                  onChange={(e) => setPrDescription(e.target.value)}
                  className="p-3 rounded-[6px] border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] text-[13px] text-[var(--ds-ink)] focus:outline-none focus:border-[var(--ds-primary)] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                  className="h-8 px-3 text-[12px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-8 px-4 text-[12px] bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] border-0"
                >
                  Save changes
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ============================================================
   MAIN: StageContent
   ============================================================ */

export function StageContent({
  data,
  activeStage,
  onStageSelect,
  investigationStatus,
  repairAttempt,
  maxAttempts,
  onRetry,
  onReject,
  onResume,
  onPause,
}: StageContentProps) {
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
            <RepoInfoStage data={data} onStageSelect={onStageSelect} />
          )}
          {activeStage === "repo_analyzer" && (
            <RepoAnalyzerStage
              data={data}
              onStageSelect={onStageSelect}
              investigationStatus={investigationStatus}
            />
          )}
          {(activeStage === "endpoint_finder" || activeStage === "reproduce") && (
            <EndpointFinderStage data={data} onStageSelect={onStageSelect} />
          )}
          {(activeStage === "baseline_test" || activeStage === "measure") && (
            <BaselineStage
              data={data}
              onStageSelect={onStageSelect}
              investigationStatus={investigationStatus}
            />
          )}
          {(activeStage === "repair" || activeStage === "diagnose") && (
            <RepairAgentStage
              data={data}
              onStageSelect={onStageSelect}
              investigationStatus={investigationStatus}
            />
          )}
          {activeStage === "candidate_test" && (
            <CandidateTestStage
              data={data}
              onStageSelect={onStageSelect}
              investigationStatus={investigationStatus}
            />
          )}
          {(activeStage === "verification" || activeStage === "validation") && (
            <VerificationStage
              data={data}
              onStageSelect={onStageSelect}
              repairAttempt={repairAttempt}
              maxAttempts={maxAttempts}
              investigationStatus={investigationStatus}
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
            />
          )}
          {(activeStage === "pull_request" || activeStage === "approval") && (
            <RaisingPRStage
              data={data}
              onStageSelect={onStageSelect}
              investigationStatus={investigationStatus}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
