import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Check,
  Lock,
  X,
  Loader2,
  ShieldAlert,
  Cpu,
  Activity,
  Info,
  AlertTriangle,
  ArrowRight,
  GitPullRequest,
  ChevronDown,
  FileCode,
  Copy,
  CheckCircle2,
  CircleDashed,
  Circle,
  PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
interface StageContentProps {
  data: any;
  activeStage: string;
  onStageSelect: (stageId: string) => void;
}

function LocalValidationStage({ validation, repair, onStageSelect }: any) {
  const [openCheckId, setOpenCheckId] = useState<number | null>(null);
  const [openFileId, setOpenFileId] = useState<number | null>(null);

  const getDiffForFile = (path: string) => {
    if (path.includes("process.ts")) {
      return `@@ -17,4 +17,3 @@
-  calculateRisk(order)
+  await riskWorker.calculate(order)
   return result`;
    }
    return `@@ -1,0 +1,8 @@
+export async function calculate(order) {
+  // Offloaded risk score
+  return compute(order);
+}`;
  };

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-[900px]">
      {/* Header */}
      <div className="flex flex-col gap-1.5 mb-6 md:mb-7">
        <span className="text-[11px] font-bold tracking-[0.08em] text-emerald-500 uppercase font-heading">
          Completed
        </span>
        <h1 className="text-[28px] md:text-[32px] font-semibold text-[var(--ds-ink)] tracking-tight leading-tight font-heading">
          Local Validation
        </h1>
        <p className="text-[14px] text-[var(--ds-ink-subtle)] leading-relaxed mt-1 max-w-[680px]">
          The patch was checked locally in the sandbox for correctness before
          rerunning the workload.
        </p>
      </div>

      {/* LOCAL CHECKS */}
      <div className="flex flex-col mb-8 md:mb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[11px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
            Local Checks
          </h3>
          <span className="text-[11px] font-bold tracking-[0.08em] text-emerald-500 uppercase font-heading">
            4 / 4 PASSED
          </span>
        </div>

        <div className="flex flex-col border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] rounded-[8px] overflow-hidden">
          {validation.checks.map((check: any, i: number) => {
            const isOpen = openCheckId === i;
            return (
              <div
                key={i}
                className="flex flex-col border-b border-[var(--ds-hairline)] last:border-0 overflow-hidden"
              >
                <button
                  onClick={() => setOpenCheckId(isOpen ? null : i)}
                  className="flex items-center justify-between p-4 bg-[var(--ds-surface-1)] cursor-pointer hover:bg-[var(--ds-surface-2)] transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="text-[13px] font-medium text-[var(--ds-ink)]">
                      {check.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[13px] font-mono text-[var(--ds-ink)]">
                      {check.result}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 90 : 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      <ChevronDown className="h-3.5 w-3.5 text-[var(--ds-ink-tertiary)]" />
                    </motion.div>
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, y: -4 }}
                      animate={{ height: "auto", opacity: 1, y: 0 }}
                      exit={{ height: 0, opacity: 0, y: -4 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 py-4 md:px-11 bg-[var(--ds-canvas)] text-[12px] font-mono text-[var(--ds-ink-subtle)] border-t border-[var(--ds-hairline)]">
                        {check.name.includes("Functional") && (
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                              <span className="w-32">Tests executed</span>
                              <span className="text-[var(--ds-ink)]">100</span>
                              <span className="w-16 ml-4 text-emerald-500">
                                Passed
                              </span>
                              <span className="text-[var(--ds-ink)]">100</span>
                              <span className="w-16 ml-4 text-red-500">
                                Failed
                              </span>
                              <span className="text-[var(--ds-ink)]">0</span>
                              <span className="w-20 ml-4">Duration</span>
                              <span className="text-[var(--ds-ink)]">
                                8.42s
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[var(--ds-ink-tertiary)] uppercase font-heading text-[10px] tracking-widest mb-1">
                                Result
                              </span>
                              <span>All functional tests passed.</span>
                            </div>
                          </div>
                        )}
                        {check.name.includes("TypeScript") && (
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-[var(--ds-ink-tertiary)] uppercase font-heading text-[10px] tracking-widest mb-1">
                                Command
                              </span>
                              <span>$ tsc --noEmit</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[var(--ds-ink-tertiary)] uppercase font-heading text-[10px] tracking-widest mb-1">
                                Result
                              </span>
                              <span className="text-[var(--ds-ink)]">
                                No type errors detected.
                              </span>
                            </div>
                          </div>
                        )}
                        {check.name.includes("Lint") && (
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-[var(--ds-ink-tertiary)] uppercase font-heading text-[10px] tracking-widest mb-1">
                                Command
                              </span>
                              <span>$ eslint . --ext .ts,.tsx</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[var(--ds-ink-tertiary)] uppercase font-heading text-[10px] tracking-widest mb-1">
                                Result
                              </span>
                              <span className="text-[var(--ds-ink)]">
                                No lint or formatting violations.
                              </span>
                            </div>
                          </div>
                        )}
                        {check.name.includes("Changed files") && (
                          <div className="flex flex-col gap-1">
                            <span>
                              {repair.files.length} files modified in this
                              patch.
                            </span>
                            <span className="text-[var(--ds-ink)] mt-1">
                              Diff cleanly applies to working tree.
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* REPAIR IS LOCALLY VALID */}
      <div className="flex flex-col mb-8 md:mb-10">
        <div className="flex flex-col p-4 md:p-5 rounded-[8px] border border-emerald-500/20 bg-emerald-500/[0.02]">
          <div className="flex items-center gap-2 mb-2">
            <Check className="h-4 w-4 text-emerald-500 shrink-0" />
            <span className="text-[12px] font-bold tracking-widest text-[var(--ds-ink)] uppercase font-heading">
              Repair is locally valid
            </span>
          </div>
          <p className="text-[13px] text-[var(--ds-ink-subtle)] leading-relaxed pl-6">
            All repository checks passed. The patch preserves functional
            behavior and is ready for a fresh runtime reproduction.
          </p>
        </div>
      </div>

      {/* CHANGED FILES */}
      <div className="flex flex-col mb-8 md:mb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[11px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
            Changed files
          </h3>
          <span className="text-[11px] font-bold tracking-[0.08em] text-[var(--ds-ink-tertiary)] uppercase font-heading">
            {repair.files.length} FILES
          </span>
        </div>
        <div className="flex flex-col border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] rounded-[8px] overflow-hidden">
          {repair.files.map((file: any, i: number) => {
            const isFileOpen = openFileId === i;
            return (
              <div
                key={i}
                className="flex flex-col border-b border-[var(--ds-hairline)] last:border-0 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFileId(isFileOpen ? null : i)}
                  className="flex items-center justify-between px-3 md:px-4 py-3 w-full bg-[var(--ds-surface-1)] hover:bg-[var(--ds-surface-2)] transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <FileCode className="h-4 w-4 text-[var(--ds-ink-subtle)] shrink-0" />
                    <span className="text-[12px] font-mono text-[var(--ds-ink)]">
                      {file.path}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-[12px] font-mono ml-4">
                    <span className="text-[var(--ds-ink-subtle)] hidden sm:inline-block">
                      modified
                    </span>
                    <div className="flex gap-2 w-16 justify-end shrink-0">
                      <span className="text-emerald-500">
                        +{file.changes.added}
                      </span>
                      <span className="text-[var(--ds-ink-subtle)]">/</span>
                      <span className="text-red-500">
                        -{file.changes.removed}
                      </span>
                    </div>
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {isFileOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, y: -4 }}
                      animate={{ height: "auto", opacity: 1, y: 0 }}
                      exit={{ height: 0, opacity: 0, y: -4 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 md:px-4 py-3 bg-[#0a0a0a] text-[11.5px] font-mono border-t border-[var(--ds-hairline)]">
                        <div className="text-[var(--ds-ink-tertiary)] mb-2 px-2 select-none border-b border-[var(--ds-hairline)] pb-2">
                          {file.path}
                        </div>
                        <pre className="overflow-x-auto pb-1">
                          {getDiffForFile(file.path)
                            .split("\n")
                            .map((line, j) => {
                              let lineClass =
                                "text-[var(--ds-ink-subtle)] px-2";
                              let bgClass = "bg-transparent";
                              if (line.startsWith("+")) {
                                lineClass = "text-emerald-500 px-2";
                                bgClass = "bg-emerald-500/10";
                              } else if (line.startsWith("-")) {
                                lineClass = "text-red-500 px-2";
                                bgClass = "bg-red-500/10";
                              } else if (line.startsWith("@@")) {
                                lineClass =
                                  "text-[var(--ds-ink-tertiary)] px-2";
                              }
                              return (
                                <div
                                  key={j}
                                  className={`leading-relaxed w-full flex ${bgClass}`}
                                >
                                  <span className={lineClass}>{line}</span>
                                </div>
                              );
                            })}
                        </pre>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action */}
      <div className="pt-0">
        <Button
          onClick={() => onStageSelect("verify")}
          className="h-8 px-4 text-[13px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] border-0 gap-1.5"
        >
          Run fresh reproduction <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function VerificationMetricRow({
  label,
  baseline,
  verified,
  baselineWidth,
  verifiedWidth,
  delay,
  subtleVerified,
}: any) {
  return (
    <div className="flex flex-col p-4 md:p-5 border-b border-[var(--ds-hairline)] last:border-0">
      <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-3">
        {label}
      </span>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
        {/* Baseline */}
        <motion.div
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: delay }}
          className="flex flex-col flex-1"
        >
          <span className="text-[16px] md:text-[20px] font-mono text-[var(--ds-ink-subtle)] line-through decoration-[var(--ds-ink-tertiary)] decoration-1">
            {baseline}
          </span>
          <span className="text-[11px] text-[var(--ds-ink-tertiary)] mt-1 uppercase tracking-wider font-heading">
            Baseline
          </span>
        </motion.div>

        {/* Arrow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: delay + 0.15 }}
          className="hidden sm:flex items-center justify-center text-[var(--ds-ink-tertiary)]"
        >
          <ArrowRight className="h-4 w-4" />
        </motion.div>

        {/* Verified */}
        <motion.div
          initial={{ opacity: 0, x: 5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: delay + 0.3 }}
          className="flex flex-col flex-1 sm:items-end"
        >
          <span
            className={cn(
              "text-[16px] md:text-[20px] font-mono font-medium",
              subtleVerified ? "text-[var(--ds-ink)]" : "text-emerald-500",
            )}
          >
            {verified}
          </span>
          <span className="text-[11px] text-[var(--ds-ink-tertiary)] mt-1 uppercase tracking-wider font-heading">
            Verified
          </span>
        </motion.div>
      </div>

      {/* Micro visualization */}
      <div className="mt-4 flex flex-col gap-1.5 h-3">
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: baselineWidth, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: delay + 0.1 }}
          className="h-[3px] bg-[var(--ds-surface-3)] rounded-full"
        />
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: verifiedWidth, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: delay + 0.4 }}
          className={cn(
            "h-[3px] rounded-full",
            subtleVerified ? "bg-[var(--ds-ink-muted)]" : "bg-emerald-500",
          )}
        />
      </div>
    </div>
  );
}

function VerificationStage({ verification, onStageSelect }: any) {
  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-[900px]">
      {/* Header */}
      <div className="flex flex-col gap-1.5 mb-5 md:mb-6">
        <span className="text-[11px] font-bold tracking-[0.08em] text-emerald-500 uppercase font-heading">
          Completed
        </span>
        <h1 className="text-[28px] md:text-[32px] font-semibold text-[var(--ds-ink)] tracking-tight leading-tight font-heading">
          Verification
        </h1>
        <p className="text-[14px] text-[var(--ds-ink-subtle)] leading-relaxed mt-1 max-w-[680px]">
          The same workload and measurement protocol were rerun in a fresh
          sandbox to deterministically verify the repair.
        </p>
      </div>

      {/* Verification Context */}
      <div className="flex items-center flex-wrap gap-x-3 gap-y-2 mb-8 md:mb-10 text-[12px] font-medium text-[var(--ds-ink-subtle)]">
        <div className="flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-emerald-500" /> Same workload
        </div>
        <span className="text-[var(--ds-hairline-strong)]">·</span>
        <div className="flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-emerald-500" /> Fresh sandbox
        </div>
        <span className="text-[var(--ds-hairline-strong)]">·</span>
        <div className="flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-emerald-500" /> Deterministic
          verifier
        </div>
      </div>

      {/* Main Verification Result */}
      <div className="flex flex-col mb-8 md:mb-10">
        <h3 className="text-[11px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-4">
          Verification Result
        </h3>
        <div className="flex flex-col border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] rounded-[8px] overflow-hidden">
          <VerificationMetricRow
            label="Event Loop P99"
            baseline="4,217 ms"
            verified="3.2 ms"
            baselineWidth="90%"
            verifiedWidth="2%"
            delay={0.1}
          />
          <VerificationMetricRow
            label="Health Availability"
            baseline="16%"
            verified="100%"
            baselineWidth="16%"
            verifiedWidth="100%"
            delay={0.2}
          />
          <VerificationMetricRow
            label="Endpoint P99"
            baseline="5,102 ms"
            verified="52 ms"
            baselineWidth="95%"
            verifiedWidth="3%"
            delay={0.3}
          />
          <VerificationMetricRow
            label="Functional Tests"
            baseline="100 / 100"
            verified="100 / 100"
            baselineWidth="100%"
            verifiedWidth="100%"
            delay={0.4}
            subtleVerified
          />
        </div>
      </div>

      {/* Verification Details */}
      <div className="flex flex-col mb-8 md:mb-10">
        <h3 className="text-[11px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-4">
          Verification Details
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 py-4 border-y border-[var(--ds-hairline)] text-[12px]">
          <div className="flex flex-col gap-1.5">
            <span className="text-[var(--ds-ink-tertiary)]">Workload</span>
            <span className="font-mono text-[var(--ds-ink)]">100 req/s</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[var(--ds-ink-tertiary)]">Duration</span>
            <span className="font-mono text-[var(--ds-ink)]">30s</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[var(--ds-ink-tertiary)]">Runtime</span>
            <span className="font-mono text-[var(--ds-ink)]">
              Node.js 20.11
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[var(--ds-ink-tertiary)]">Sandbox</span>
            <span className="font-mono text-[var(--ds-ink)]">daytona-7f2a</span>
          </div>
        </div>
      </div>

      {/* Improvement Summary */}
      <div className="flex flex-col mb-8 md:mb-10">
        <h3 className="text-[11px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-4">
          Improvement Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
              Performance
            </span>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[var(--ds-ink-subtle)]">
                Event loop P99
              </span>
              <span className="font-mono text-emerald-500 font-medium">
                −99.9%
              </span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[var(--ds-ink-subtle)]">Endpoint P99</span>
              <span className="font-mono text-emerald-500 font-medium">
                −99.0%
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
              Health
            </span>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[var(--ds-ink-subtle)]">Availability</span>
              <span className="font-mono text-emerald-500 font-medium">
                16% → 100%
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
              Functional
            </span>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[var(--ds-ink-subtle)]">Tests</span>
              <span className="font-mono text-[var(--ds-ink)] font-medium">
                100 / 100 preserved
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* VERIFICATION PASSED */}
      <div className="flex flex-col mb-8 md:mb-10">
        <div className="flex flex-col p-4 md:p-5 rounded-[8px] border border-emerald-500/20 bg-emerald-500/[0.02]">
          <div className="flex items-center gap-2 mb-2">
            <Check className="h-4 w-4 text-emerald-500 shrink-0" />
            <span className="text-[12px] font-bold tracking-widest text-[var(--ds-ink)] uppercase font-heading">
              Verification passed
            </span>
          </div>
          <p className="text-[13px] text-[var(--ds-ink-subtle)] leading-relaxed pl-6 mb-3">
            The repair reproduced the expected improvement under the same
            workload without changing functional behavior.
          </p>
          <div className="flex flex-col gap-1 pl-6 text-[12px] text-[var(--ds-ink-muted)]">
            <span>Performance improved</span>
            <span>Health recovered</span>
            <span>Functional behavior preserved</span>
          </div>
        </div>
      </div>

      {/* Action */}
      <div className="pt-0">
        <Button
          onClick={() => onStageSelect("approval")}
          className="h-8 px-4 text-[13px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] border-0 gap-1.5"
        >
          View approval status <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function ApprovalStage({
  approval,
  verification,
  repair,
  onStageSelect,
  prTitle,
  setPrTitle,
  prDescription,
  setPrDescription,
}: any) {
  const [status, setStatus] = useState("waiting"); // waiting, approving, approved, rejected
  const [approvingStep, setApprovingStep] = useState(-1);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tempTitle, setTempTitle] = useState(prTitle);
  const [tempDescription, setTempDescription] = useState(prDescription);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setPrTitle(tempTitle);
      setPrDescription(tempDescription);
      setIsSaving(false);
      setIsEditing(false);
    }, 600);
  };

  const steps = [
    { name: "Accepting repair", status: "Approval recorded" },
    { name: "Writing approved changes", status: "2 files updated" },
    { name: "Creating branch", status: "Creating aegis/fix-a91f" },
    { name: "Creating commit", status: "Committing approved repair" },
    {
      name: "Creating pull request",
      status: "Opening pull request against main",
    },
  ];

  const handleAccept = () => {
    setStatus("approving");
    setApprovingStep(0);

    const timeouts = [700, 1400, 2100, 2800, 3600];

    timeouts.forEach((delay, i) => {
      setTimeout(() => {
        if (i === timeouts.length - 1) {
          setStatus("approved");
          setApprovingStep(5);
        } else {
          setApprovingStep(i + 1);
        }
      }, delay);
    });
  };

  if (status === "rejected") {
    return (
      <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-[900px]">
        <div className="flex flex-col gap-1.5 mb-5 md:mb-6">
          <span className="text-[11px] font-bold tracking-[0.08em] text-[var(--ds-ink-subtle)] uppercase font-heading">
            Stopped
          </span>
          <h1 className="text-[28px] md:text-[32px] font-semibold text-[var(--ds-ink)] tracking-tight leading-tight font-heading">
            Repair rejected.
          </h1>
          <p className="text-[14px] text-[var(--ds-ink-subtle)] leading-relaxed mt-1 max-w-[680px]">
            No changes were written to GitHub.
          </p>
        </div>

        <div className="pt-4">
          <Button
            onClick={() => onStageSelect("verify")}
            variant="outline"
            className="h-8 px-4 text-[13px] font-medium"
          >
            Return to investigation
          </Button>
        </div>
      </div>
    );
  }

  let headerText = "Waiting for you";
  let headerColor = "text-amber-500";
  let title = "Human Gate";
  let desc =
    "The repair has been verified. Review the result and choose what happens next.";

  if (status === "approving") {
    headerText = "Operation in progress";
    headerColor = "text-[var(--ds-ink-subtle)]";
    title = "Applying changes";
  } else if (status === "approved") {
    headerText = "Completed";
    headerColor = "text-emerald-500";
    desc = "Changes accepted and pull request created.";
  }

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-[900px]">
      <div className="flex flex-col gap-1.5 mb-8 md:mb-10">
        <div className="flex items-center gap-2">
          {status === "waiting" && (
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          )}
          <span
            className={cn(
              "text-[11px] font-bold tracking-[0.08em] uppercase font-heading transition-colors duration-300",
              headerColor,
            )}
          >
            {headerText}
          </span>
        </div>
        <h1 className="text-[28px] md:text-[32px] font-semibold text-[var(--ds-ink)] tracking-tight leading-tight font-heading transition-colors duration-300">
          {title}
        </h1>
        <p className="text-[14px] text-[var(--ds-ink-subtle)] leading-relaxed mt-1 max-w-[680px] transition-colors duration-300">
          {desc}
        </p>
      </div>

      <motion.div
        layout
        className="flex flex-col border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] rounded-[8px] overflow-hidden"
      >
        <div className="flex flex-col p-5 md:p-6 border-b border-[var(--ds-hairline)]">
          <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-4 block">
            Human Decision
          </span>
          <span className="text-[15px] font-medium text-[var(--ds-ink)] mb-1 block">
            The repair is verified and ready for review.
          </span>
          <span className="text-[13px] text-[var(--ds-ink-subtle)]">
            AEGIS has completed the investigation and verified the proposed
            repair against the original workload.
          </span>
        </div>

        <div className="flex flex-col p-5 md:p-6 border-b border-[var(--ds-hairline)]">
          <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-4 block">
            Verified Result
          </span>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[var(--ds-ink-subtle)] font-bold tracking-widest uppercase font-heading text-[10px]">
                Event loop P99
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-[var(--ds-ink-subtle)] line-through">
                  4,217 ms
                </span>
                <span className="text-[var(--ds-ink-tertiary)]">→</span>
                <span className="text-emerald-500">3.2 ms</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[var(--ds-ink-subtle)] font-bold tracking-widest uppercase font-heading text-[10px]">
                Health Availability
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-[var(--ds-ink-subtle)] line-through">
                  16%
                </span>
                <span className="text-[var(--ds-ink-tertiary)]">→</span>
                <span className="text-emerald-500">100%</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[var(--ds-ink-subtle)] font-bold tracking-widest uppercase font-heading text-[10px]">
                Endpoint P99
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-[var(--ds-ink-subtle)] line-through">
                  5,102 ms
                </span>
                <span className="text-[var(--ds-ink-tertiary)]">→</span>
                <span className="text-emerald-500">52 ms</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[var(--ds-ink-subtle)] font-bold tracking-widest uppercase font-heading text-[10px]">
                Functional tests
              </span>
              <span className="font-mono text-[var(--ds-ink)] font-medium">
                100 / 100
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col p-5 md:p-6 border-b border-[var(--ds-hairline)]">
          <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-4 block">
            Proposed Change
          </span>
          <span className="text-[13px] text-[var(--ds-ink)] mb-4 block">
            Offload CPU-bound risk scoring
          </span>
          <div className="flex flex-wrap items-center gap-6 text-[12px] font-mono text-[var(--ds-ink)]">
            <span>2 files changed</span>
            <span>100 / 100 tests passing</span>
            <span>1 / 3 repair attempts</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-4 border-b border-[var(--ds-hairline)] bg-[#111110]">
          <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span className="text-[12px] text-[var(--ds-ink)]">
            <span className="text-amber-500 font-medium">
              GitHub has not been modified.
            </span>{" "}
            Approval is required before any GitHub write occurs.
          </span>
        </div>

        <AnimatePresence initial={false} mode="wait">
          {status === "waiting" && (
            <motion.div
              key="actions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col p-5 md:p-6 bg-[var(--ds-canvas)] gap-4"
            >
              <span className="text-[12px] text-[var(--ds-ink-subtle)]">
                Your decision controls whether AEGIS writes this repair to
                GitHub.
              </span>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setStatus("rejected")}
                  variant="ghost"
                  className="h-8 px-4 text-[13px] font-medium text-red-500 hover:text-red-400 hover:bg-red-500/10"
                >
                  Reject changes
                </Button>
                <Button
                  onClick={() => onStageSelect("repair")}
                  variant="outline"
                  className="h-8 px-4 text-[13px] font-medium border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] hover:bg-[var(--ds-surface-2)]"
                >
                  Redo
                </Button>
                <div className="flex-1" />
                <Button
                  onClick={handleAccept}
                  className="h-8 px-4 text-[13px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] border-0 gap-1.5"
                >
                  Accept changes <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          )}

          {(status === "approving" || status === "approved") && (
            <motion.div
              key="execution"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex flex-col bg-[var(--ds-canvas)]"
            >
              <div className="p-5 md:p-6 border-b border-[var(--ds-hairline)]">
                <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-1 block">
                  Creating Pull Request
                </span>
                <span className="text-[13px] text-[var(--ds-ink)]">
                  AEGIS is applying the approved repair.
                </span>

                <div className="mt-8 flex flex-col pl-1">
                  {steps.map((step, index) => {
                    const isCompleted = index < approvingStep;
                    const isActive = index === approvingStep;
                    const isPending = index > approvingStep;

                    return (
                      <div key={index} className="flex gap-5 relative">
                        {index < steps.length - 1 && (
                          <div
                            className={cn(
                              "absolute left-[7px] top-5 bottom-[0px] w-[2px] transition-colors duration-500",
                              isCompleted
                                ? "bg-emerald-500/50"
                                : "bg-[var(--ds-hairline)]",
                            )}
                          />
                        )}

                        <div className="flex flex-col items-center mt-0.5 z-10 shrink-0">
                          {isCompleted ? (
                            <div className="h-4 w-4 rounded-full bg-[var(--ds-canvas)] flex items-center justify-center text-emerald-500">
                              <Check className="h-3.5 w-3.5" />
                            </div>
                          ) : isActive ? (
                            <div className="h-4 w-4 rounded-full bg-[var(--ds-canvas)] flex items-center justify-center text-[var(--ds-ink)]">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            </div>
                          ) : (
                            <div className="h-4 w-4 rounded-full bg-[var(--ds-canvas)] flex items-center justify-center text-[var(--ds-ink-tertiary)]">
                              <div className="h-1.5 w-1.5 rounded-full border border-[var(--ds-ink-tertiary)]" />
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-1 pb-6 w-full">
                          <span
                            className={cn(
                              "text-[13px] font-mono transition-colors duration-300",
                              isCompleted
                                ? "text-[var(--ds-ink-subtle)]"
                                : isActive
                                  ? "text-[var(--ds-ink)] font-medium"
                                  : "text-[var(--ds-ink-tertiary)]",
                            )}
                          >
                            {step.name}
                          </span>
                          <span
                            className={cn(
                              "text-[12px] transition-colors duration-300 font-sans",
                              isCompleted || isActive
                                ? "text-[var(--ds-ink-subtle)]"
                                : "text-[var(--ds-ink-tertiary)]",
                            )}
                          >
                            {isPending ? "Pending" : step.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <AnimatePresence>
                {status === "approved" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col"
                  >
                    <div className="flex flex-col p-5 md:p-6 border-b border-[var(--ds-hairline)]">
                      <div className="flex items-center gap-2 mb-4">
                        <Check className="h-4 w-4 text-emerald-500" />
                        <span className="text-[13px] font-medium text-[var(--ds-ink)]">
                          Pull request created
                        </span>
                      </div>

                      <AnimatePresence mode="wait">
                        {isEditing ? (
                          <motion.div
                            key="edit"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col gap-4"
                          >
                            <div className="flex flex-col gap-1.5">
                              <span className="text-[11px] font-medium text-[var(--ds-ink-subtle)]">
                                Title
                              </span>
                              <input
                                type="text"
                                value={tempTitle}
                                onChange={(e) => setTempTitle(e.target.value)}
                                disabled={isSaving}
                                className="h-9 w-full px-3 text-[14px] font-medium text-[var(--ds-ink)] bg-[var(--ds-surface-1)] border border-[var(--ds-hairline)] rounded-[6px] focus:outline-none focus:border-[var(--ds-ink-tertiary)] focus:ring-1 focus:ring-[var(--ds-ink-tertiary)] disabled:opacity-50"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <span className="text-[11px] font-medium text-[var(--ds-ink-subtle)]">
                                Description
                              </span>
                              <textarea
                                value={tempDescription}
                                onChange={(e) =>
                                  setTempDescription(e.target.value)
                                }
                                disabled={isSaving}
                                rows={3}
                                className="w-full p-3 text-[13px] text-[var(--ds-ink)] bg-[var(--ds-surface-1)] border border-[var(--ds-hairline)] rounded-[6px] focus:outline-none focus:border-[var(--ds-ink-tertiary)] focus:ring-1 focus:ring-[var(--ds-ink-tertiary)] resize-none disabled:opacity-50"
                              />
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                onClick={() => {
                                  setTempTitle(prTitle);
                                  setTempDescription(prDescription);
                                  setIsEditing(false);
                                }}
                                disabled={isSaving}
                                variant="ghost"
                                className="h-8 px-3 text-[12px] font-medium"
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="h-8 px-4 text-[12px] font-medium bg-[var(--ds-ink)] text-[var(--ds-canvas)] w-[120px] justify-center transition-all"
                              >
                                {isSaving ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  "Save changes"
                                )}
                              </Button>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="view"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col gap-1.5 pl-6 border-l-2 border-[var(--ds-hairline)] ml-1.5"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="text-[13px] font-medium text-[var(--ds-ink)]">
                                {prTitle}
                              </span>
                              <span className="text-[12px] font-mono text-[var(--ds-ink-tertiary)]">
                                #42
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 text-[12px] font-mono text-[var(--ds-ink-subtle)]">
                                <span className="text-[var(--ds-ink)]">
                                  aegis/fix-a91f
                                </span>
                                <ArrowRight className="h-3 w-3 text-[var(--ds-ink-tertiary)]" />
                                <span className="text-[var(--ds-ink)]">
                                  main
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex items-center justify-end gap-3 p-5 md:p-6 bg-[var(--ds-canvas)]">
                      <Button
                        onClick={() => onStageSelect("pull_request")}
                        className="h-8 px-4 text-[13px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] border-0 gap-1.5"
                      >
                        Raise PR <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function PullRequestStage({
  pullRequest,
  onStageSelect,
  prTitle,
  setPrTitle,
  prDescription,
  setPrDescription,
}: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [tempTitle, setTempTitle] = useState(prTitle);
  const [tempDescription, setTempDescription] = useState(prDescription);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setPrTitle(tempTitle);
      setPrDescription(tempDescription);
      setIsSaving(false);
      setIsEditing(false);
    }, 600);
  };

  const handleCancel = () => {
    setTempTitle(prTitle);
    setTempDescription(prDescription);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-[900px]">
      {/* Top Header */}
      <div className="flex flex-col gap-1.5 mb-8 md:mb-10">
        <span className="text-[11px] font-bold tracking-[0.08em] text-emerald-500 uppercase font-heading">
          Completed
        </span>
        <h1 className="text-[28px] md:text-[32px] font-semibold text-[var(--ds-ink)] tracking-tight leading-tight font-heading">
          Pull Request
        </h1>
        <p className="text-[14px] text-[var(--ds-ink-subtle)] leading-relaxed mt-1 max-w-[680px]">
          Branch and commit created successfully.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!isEditing ? (
          <motion.div
            key="view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] rounded-[8px] overflow-hidden mb-8 md:mb-10"
          >
            {/* PR HEADER */}
            <div className="flex flex-col p-5 md:p-6 border-b border-[var(--ds-hairline)]">
              <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-4 block">
                Pull Request
              </span>
              <div className="flex items-start gap-3">
                <GitPullRequest className="h-5 w-5 text-[var(--ds-ink)] shrink-0 mt-0.5" />
                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[18px] md:text-[20px] font-semibold text-[var(--ds-ink)] font-heading leading-tight">
                      {prTitle}
                    </span>
                    <span className="text-[16px] text-[var(--ds-ink-tertiary)] font-mono font-medium">
                      #42
                    </span>
                  </div>
                  <p className="text-[13px] text-[var(--ds-ink-subtle)] leading-relaxed max-w-[680px] whitespace-pre-wrap">
                    {prDescription}
                  </p>
                </div>
              </div>
            </div>

            {/* BRANCH INFORMATION */}
            <div className="flex flex-col p-5 md:p-6 border-b border-[var(--ds-hairline)]">
              <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-4 block">
                Branch Information
              </span>

              <div className="flex items-center gap-3 mb-6 font-mono text-[12px]">
                <span className="bg-[var(--ds-surface-2)] text-[var(--ds-ink)] px-2 py-1 rounded border border-[var(--ds-hairline)]">
                  aegis/fix-a91f
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-[var(--ds-ink-tertiary)]" />
                <span className="bg-[var(--ds-surface-2)] text-[var(--ds-ink)] px-2 py-1 rounded border border-[var(--ds-hairline)]">
                  main
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[12px]">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[var(--ds-ink-tertiary)]">Branch</span>
                  <span className="font-mono text-[var(--ds-ink)]">
                    aegis/fix-a91f
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[var(--ds-ink-tertiary)]">Commit</span>
                  <span className="font-mono text-[var(--ds-ink)]">
                    8d3c1f2
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[var(--ds-ink-tertiary)]">Base</span>
                  <span className="font-mono text-[var(--ds-ink)]">main</span>
                </div>
              </div>
            </div>

            {/* CHANGE SUMMARY */}
            <div className="flex flex-col p-5 md:p-6 border-b border-[var(--ds-hairline)]">
              <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-4 block">
                Change Summary
              </span>

              <div className="flex items-center gap-6 text-[13px] mb-6">
                <span className="font-medium text-[var(--ds-ink)]">
                  2 files changed
                </span>
                <div className="flex items-center gap-1.5 font-mono text-[12px]">
                  <span className="text-emerald-500">+10</span>
                  <span className="text-[var(--ds-ink-tertiary)]">/</span>
                  <span className="text-red-500">-2</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span className="font-bold tracking-widest uppercase font-heading text-emerald-500 text-[10px]">
                    Verified
                  </span>
                </div>
                <div className="flex flex-col text-[var(--ds-ink)] font-mono text-[12px] pl-6 mt-0.5">
                  <span>100 / 100 functional tests</span>
                  <span className="text-[var(--ds-ink-subtle)]">
                    Deterministic verification passed
                  </span>
                </div>
              </div>
            </div>

            {/* VERIFICATION CONTEXT */}
            <div className="flex flex-col p-5 md:p-6 border-b border-[var(--ds-hairline)]">
              <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-4 block">
                Verified Change
              </span>
              <span className="text-[13px] text-[var(--ds-ink)] mb-6 block">
                Offload CPU-bound risk scoring from the Node.js main thread.
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex flex-col gap-1.5 text-[12px]">
                  <span className="text-[var(--ds-ink-tertiary)]">
                    Event Loop P99
                  </span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-[var(--ds-ink-subtle)] line-through">
                      4,217 ms
                    </span>
                    <span className="text-[var(--ds-ink-tertiary)]">→</span>
                    <span className="text-emerald-500">3.2 ms</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 text-[12px]">
                  <span className="text-[var(--ds-ink-tertiary)]">
                    Health Availability
                  </span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-[var(--ds-ink-subtle)] line-through">
                      16%
                    </span>
                    <span className="text-[var(--ds-ink-tertiary)]">→</span>
                    <span className="text-emerald-500">100%</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 text-[12px]">
                  <span className="text-[var(--ds-ink-tertiary)]">
                    Endpoint P99
                  </span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-[var(--ds-ink-subtle)] line-through">
                      5,102 ms
                    </span>
                    <span className="text-[var(--ds-ink-tertiary)]">→</span>
                    <span className="text-emerald-500">52 ms</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 text-[12px]">
                  <span className="text-[var(--ds-ink-tertiary)]">
                    Functional Tests
                  </span>
                  <span className="font-mono text-[var(--ds-ink)]">
                    100 / 100
                  </span>
                </div>
              </div>
            </div>

            {/* EDITABILITY INDICATOR */}
            <div className="flex items-center gap-2 p-5 border-b border-[var(--ds-hairline)] bg-[var(--ds-surface-2)]">
              <Info className="h-3.5 w-3.5 text-[var(--ds-ink-tertiary)] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[12px] text-[var(--ds-ink)]">
                  You can edit the title and description.
                </span>
                <span className="text-[12px] text-[var(--ds-ink-subtle)]">
                  Branch, commit, verification results, and changed files are
                  generated by AEGIS and cannot be modified.
                </span>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-3 p-5 md:p-6 bg-[var(--ds-canvas)]">
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="h-8 px-4 text-[13px] font-medium"
              >
                Edit pull request
              </Button>
              <div className="flex-1" />
              <Button
                onClick={() => onStageSelect("qodo_review")}
                className="h-8 px-4 text-[13px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] border-0 gap-1.5"
              >
                View Qodo Review <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="edit"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] rounded-[8px] overflow-hidden mb-8 md:mb-10 shadow-lg"
          >
            {/* EDITOR HEADER */}
            <div className="flex flex-col p-5 md:p-6 border-b border-[var(--ds-hairline)]">
              <span className="text-[15px] font-semibold text-[var(--ds-ink)] font-heading mb-1 block">
                Edit pull request
              </span>
              <span className="text-[13px] text-[var(--ds-ink-subtle)]">
                Update the title and description before continuing.
              </span>
            </div>

            {/* EDITABLE FIELDS */}
            <div className="flex flex-col gap-5 p-5 md:p-6 border-b border-[var(--ds-hairline)]">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                  Title
                </label>
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  disabled={isSaving}
                  className="h-9 w-full px-3 text-[14px] font-medium text-[var(--ds-ink)] bg-[var(--ds-surface-2)] border border-[var(--ds-hairline)] rounded-[6px] focus:outline-none focus:border-[var(--ds-ink-tertiary)] focus:ring-1 focus:ring-[var(--ds-ink-tertiary)] disabled:opacity-50 transition-shadow"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                  Description
                </label>
                <textarea
                  value={tempDescription}
                  onChange={(e) => setTempDescription(e.target.value)}
                  disabled={isSaving}
                  rows={6}
                  className="w-full p-3 text-[14px] text-[var(--ds-ink)] bg-[var(--ds-surface-2)] border border-[var(--ds-hairline)] rounded-[6px] focus:outline-none focus:border-[var(--ds-ink-tertiary)] focus:ring-1 focus:ring-[var(--ds-ink-tertiary)] resize-y min-h-[120px] disabled:opacity-50 transition-shadow"
                />
              </div>
            </div>

            {/* READ-ONLY INFO */}
            <div className="flex flex-col p-5 md:p-6 border-b border-[var(--ds-hairline)] bg-[var(--ds-surface-2)]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                  Pull Request Information
                </span>
                <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-subtle)] uppercase font-heading bg-[var(--ds-surface-1)] border border-[var(--ds-hairline)] px-1.5 py-0.5 rounded">
                  Read Only
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 text-[12px]">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[var(--ds-ink-tertiary)]">
                    Source branch
                  </span>
                  <span className="font-mono text-[var(--ds-ink)]">
                    aegis/fix-a91f
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[var(--ds-ink-tertiary)]">
                    Target branch
                  </span>
                  <span className="font-mono text-[var(--ds-ink)]">main</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[var(--ds-ink-tertiary)]">Commit</span>
                  <span className="font-mono text-[var(--ds-ink)]">
                    8d3c1f2
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[var(--ds-ink-tertiary)]">
                    Changed files
                  </span>
                  <span className="font-mono text-[var(--ds-ink)]">2</span>
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <span className="text-[var(--ds-ink-tertiary)]">
                    Verification
                  </span>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="font-mono text-[var(--ds-ink)]">
                      100 / 100 tests passing
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* EDITOR ACTIONS */}
            <div className="flex items-center justify-end gap-3 p-4 md:p-5 bg-[var(--ds-canvas)]">
              <Button
                onClick={handleCancel}
                disabled={isSaving}
                variant="ghost"
                className="h-8 px-4 text-[13px] font-medium hover:bg-[var(--ds-surface-1)]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 px-4 text-[13px] font-medium bg-[var(--ds-ink)] text-[var(--ds-canvas)] w-[120px] justify-center transition-all"
              >
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const REVIEW_CHECKS = [
  "Repository context",
  "Changed files analyzed",
  "Dependency impact",
  "Regression analysis",
  "Behavioral correctness",
  "Security review",
  "Final verdict",
];

const ACTIVITY_LOGS = [
  "Inspecting src/orders/process.ts",
  "Tracing risk scoring execution path",
  "Comparing changed behavior against baseline",
  "Checking worker isolation",
  "No regression detected",
];

function QodoReviewStage({ prTitle }: any) {
  const [activeCheck, setActiveCheck] = React.useState(0);
  const [activeLog, setActiveLog] = React.useState(0);
  const [isCompleted, setIsCompleted] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);

  React.useEffect(() => {
    let checkInterval: NodeJS.Timeout;
    let logInterval: NodeJS.Timeout;

    if (!isCompleted) {
      checkInterval = setInterval(() => {
        setActiveCheck((prev) => {
          if (prev >= REVIEW_CHECKS.length - 1) {
            setIsCompleted(true);
            return prev;
          }
          return prev + 1;
        });
      }, 800);

      logInterval = setInterval(() => {
        setActiveLog((prev) => {
          if (prev >= ACTIVITY_LOGS.length - 1) return prev;
          return prev + 1;
        });
      }, 1000);
    }

    return () => {
      clearInterval(checkInterval);
      clearInterval(logInterval);
    };
  }, [isCompleted]);

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-[900px]">
      {/* Top Header */}
      <div className="flex flex-col gap-1.5 mb-8 md:mb-10">
        <div className="flex items-center gap-2">
          {!isCompleted && (
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
          )}
          <span
            className={cn(
              "text-[11px] font-bold tracking-[0.08em] uppercase font-heading transition-colors duration-300",
              isCompleted ? "text-emerald-500" : "text-blue-500",
            )}
          >
            {isCompleted ? "Completed" : "Active"}
          </span>
        </div>
        <h1 className="text-[28px] md:text-[32px] font-semibold text-[var(--ds-ink)] tracking-tight leading-tight font-heading">
          Qodo Review
        </h1>
        <p className="text-[14px] text-[var(--ds-ink-subtle)] leading-relaxed mt-1 max-w-[680px]">
          {isCompleted
            ? "No blocking issues found. The pull request is ready for human merge."
            : "Reviewing the pull request for correctness, regressions, and risk."}
        </p>
      </div>

      <motion.div
        layout
        className="flex flex-col border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] rounded-[8px] overflow-hidden mb-8 shadow-sm"
      >
        {/* QODO REVIEW HEADER */}
        <div className="flex flex-col p-5 md:p-6 border-b border-[var(--ds-hairline)] bg-[var(--ds-surface-1)]">
          <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-4 block">
            Qodo Review
          </span>
          <span className="text-[15px] font-semibold text-[var(--ds-ink)] mb-1 block">
            Analyzing #42 · {prTitle || "Fix Node.js event-loop starvation"}
          </span>
        </div>

        {!isCompleted ? (
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[var(--ds-hairline)]">
            {/* REVIEW CHECKS */}
            <div className="flex flex-col p-5 md:p-6 flex-1 bg-[var(--ds-canvas)]">
              <div className="flex flex-col gap-3">
                {REVIEW_CHECKS.map((check, index) => {
                  const isPast = index < activeCheck;
                  const isCurrent = index === activeCheck;

                  return (
                    <div key={check} className="flex items-center gap-3">
                      {isPast ? (
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="h-4 w-4 text-blue-500 shrink-0 animate-spin" />
                      ) : (
                        <Circle className="h-4 w-4 text-[var(--ds-ink-tertiary)] shrink-0" />
                      )}
                      <span
                        className={cn(
                          "text-[13px] font-mono",
                          isPast
                            ? "text-[var(--ds-ink)]"
                            : isCurrent
                              ? "text-blue-500 font-medium"
                              : "text-[var(--ds-ink-subtle)]",
                        )}
                      >
                        {check}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* LIVE ACTIVITY */}
            <div className="flex flex-col p-5 md:p-6 flex-1 bg-[#111110]">
              <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-4 block">
                Review Activity
              </span>
              <div className="flex flex-col gap-4 font-mono text-[11px]">
                {ACTIVITY_LOGS.slice(0, activeLog + 1).map((log, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i}
                    className="flex flex-col gap-1 text-[var(--ds-ink-subtle)]"
                  >
                    <span className="text-[var(--ds-ink-tertiary)]">
                      19:38:{40 + i * 2}
                    </span>
                    <span>{log}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col"
          >
            {/* FILES REVIEWED */}
            <div className="flex flex-col p-5 md:p-6 border-b border-[var(--ds-hairline)] bg-[var(--ds-canvas)]">
              <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-4 block">
                Files Reviewed
              </span>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-mono text-[var(--ds-ink)]">
                    src/orders/process.ts
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-mono text-emerald-500">
                      +2 / -2
                    </span>
                    <Check className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-mono text-[var(--ds-ink)]">
                    src/workers/risk-worker.ts
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-mono text-emerald-500">
                      +8 / -0
                    </span>
                    <Check className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* REVIEW RESULT */}
            <div className="flex flex-col p-5 md:p-6 border-b border-[var(--ds-hairline)] bg-[var(--ds-canvas)]">
              <div className="flex items-center gap-2 mb-6">
                <Check className="h-4 w-4 text-emerald-500" />
                <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink)] uppercase font-heading">
                  Review Passed
                </span>
                <span className="text-[12px] text-[var(--ds-ink-subtle)] ml-2 border-l border-[var(--ds-hairline)] pl-4">
                  No blocking issues found.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-[12px]">
                <div className="flex items-center justify-between py-2 border-b border-[var(--ds-hairline)]">
                  <span className="text-[var(--ds-ink-subtle)]">
                    Correctness
                  </span>
                  <div className="flex items-center gap-1.5 text-emerald-500">
                    <Check className="h-3.5 w-3.5" />
                    <span>No issues</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[var(--ds-hairline)]">
                  <span className="text-[var(--ds-ink-subtle)]">
                    Regression risk
                  </span>
                  <div className="flex items-center gap-1.5 text-emerald-500">
                    <Check className="h-3.5 w-3.5" />
                    <span>Low</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[var(--ds-hairline)]">
                  <span className="text-[var(--ds-ink-subtle)]">Security</span>
                  <div className="flex items-center gap-1.5 text-emerald-500">
                    <Check className="h-3.5 w-3.5" />
                    <span>No blocking findings</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[var(--ds-hairline)]">
                  <span className="text-[var(--ds-ink-subtle)]">Tests</span>
                  <div className="flex items-center gap-1.5 font-mono text-[var(--ds-ink)]">
                    <span>100 / 100 passing</span>
                  </div>
                </div>
              </div>
            </div>

            {/* INLINE DETAILS EXPANSION (CONDITIONAL) */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex flex-col p-5 md:p-6 border-b border-[var(--ds-hairline)] bg-[var(--ds-surface-2)] overflow-hidden"
                >
                  <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-4 block">
                    Detailed Metrics
                  </span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-[12px]">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[var(--ds-ink-tertiary)]">
                        Reviewed
                      </span>
                      <div className="flex flex-col font-mono text-[var(--ds-ink)] gap-0.5">
                        <span>2 files</span>
                        <span className="text-emerald-500">10 additions</span>
                        <span className="text-red-500">2 deletions</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[var(--ds-ink-tertiary)]">
                        Verification
                      </span>
                      <span className="font-mono text-[var(--ds-ink)]">
                        100 / 100 tests
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[var(--ds-ink-tertiary)]">
                        Risk
                      </span>
                      <span className="font-mono text-emerald-500">Low</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[var(--ds-ink-tertiary)]">
                        Findings
                      </span>
                      <div className="flex flex-col font-mono gap-0.5">
                        <span className="text-emerald-500">0 blocking</span>
                        <span className="text-[var(--ds-ink)]">0 warnings</span>
                        <span className="text-blue-500">1 suggestion</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ACTION ROW */}
            <div className="flex items-center justify-end p-4 md:p-5 bg-[var(--ds-canvas)]">
              <Button
                onClick={() => setShowDetails(!showDetails)}
                variant="outline"
                className="h-8 px-4 text-[13px] font-medium"
              >
                {showDetails ? "Hide full review" : "View full review →"}
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function RepairStage({ repair, onStageSelect }: any) {
  const [activeFile, setActiveFile] = React.useState("src/orders/process.ts");
  const [copied, setCopied] = React.useState(false);

  const diffs: any = {
    "src/orders/process.ts": [
      {
        type: "context",
        lineNum: 18,
        text: "export async function processOrder(order) {",
      },
      { type: "context", lineNum: 19, text: "" },
      {
        type: "removed",
        lineNum: 20,
        text: "  const result = calculateRiskScore(order);",
      },
      {
        type: "removed",
        lineNum: 21,
        text: "  return persistOrder({ ...order, result });",
      },
      {
        type: "added",
        lineNum: 20,
        text: "  const result = await riskWorker.calculate(order);",
      },
      {
        type: "added",
        lineNum: 21,
        text: "  return persistOrder({ ...order, result });",
      },
      { type: "context", lineNum: 22, text: "}" },
    ],
    "src/workers/risk-worker.ts": [
      { type: "context", lineNum: 4, text: "export const riskWorker = {" },
      {
        type: "context",
        lineNum: 5,
        text: "  async calculate(order: Order) {",
      },
      {
        type: "added",
        lineNum: 6,
        text: "    // Perform heavy CPU-bound risk scoring",
      },
      { type: "added", lineNum: 7, text: "    let score = 0;" },
      {
        type: "added",
        lineNum: 8,
        text: "    for (let i = 0; i < 1000000; i++) {",
      },
      { type: "added", lineNum: 9, text: "      score += Math.random();" },
      { type: "added", lineNum: 10, text: "    }" },
      { type: "added", lineNum: 11, text: "    return score;" },
      { type: "context", lineNum: 12, text: "  }" },
      { type: "context", lineNum: 13, text: "};" },
    ],
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentDiff = diffs[activeFile] || diffs["src/orders/process.ts"];
  const currentFileStats = repair.files?.find(
    (f: any) => f.path === activeFile,
  ) || { changes: { added: 0, removed: 0 } };

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-[950px]">
      {/* HEADER */}
      <div className="flex flex-col gap-1.5 mb-8 md:mb-10">
        <span className="text-[11px] font-bold tracking-[0.08em] text-emerald-500 uppercase font-heading">
          Completed
        </span>
        <h1 className="text-[28px] md:text-[32px] font-semibold text-[var(--ds-ink)] tracking-tight leading-tight font-heading">
          Repair
        </h1>
        <p className="text-[14px] text-[var(--ds-ink-subtle)] leading-relaxed mt-1 max-w-[680px]">
          {repair.title ||
            "Move the CPU-bound risk scoring off the Node.js main thread without changing the public API contract."}
        </p>
      </div>

      {/* REPAIR SUMMARY */}
      <div className="flex flex-col mb-8">
        <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-4 block">
          Repair Summary
        </span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8 text-[12px] border-y border-[var(--ds-hairline)] py-4 bg-[var(--ds-surface-1)]">
          <div className="flex flex-col gap-1.5">
            <span className="text-[var(--ds-ink-subtle)]">Strategy</span>
            <span className="font-mono text-[var(--ds-ink)]">
              {repair.strategy || "Worker offload"}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[var(--ds-ink-subtle)]">Files changed</span>
            <span className="font-mono text-[var(--ds-ink)]">
              {repair.filesChanged || 2}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[var(--ds-ink-subtle)]">Risk surface</span>
            <span className="font-mono text-[var(--ds-ink)]">
              {repair.riskSurface || "Minimal"}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[var(--ds-ink-subtle)]">API contract</span>
            <span className="font-mono text-[var(--ds-ink)]">Unchanged</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] rounded-[8px] overflow-hidden mb-8 shadow-sm">
        {/* FILES NAVIGATOR */}
        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[var(--ds-hairline)] border-b border-[var(--ds-hairline)] bg-[var(--ds-canvas)]">
          {(
            repair.files || [
              { path: "src/orders/process.ts" },
              { path: "src/workers/risk-worker.ts" },
            ]
          ).map((file: any) => {
            const isSelected = activeFile === file.path;
            return (
              <button
                key={file.path}
                onClick={() => setActiveFile(file.path)}
                className={cn(
                  "flex items-center justify-between p-4 flex-1 text-left transition-colors duration-200 outline-none",
                  isSelected
                    ? "bg-[var(--ds-surface-2)]"
                    : "hover:bg-[var(--ds-surface-1)] opacity-70 hover:opacity-100",
                )}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className={cn(
                      "h-3.5 w-3.5",
                      isSelected
                        ? "text-emerald-500"
                        : "text-[var(--ds-ink-tertiary)]",
                    )}
                  />
                  <span
                    className={cn(
                      "text-[13px] font-mono",
                      isSelected
                        ? "text-[var(--ds-ink)] font-medium"
                        : "text-[var(--ds-ink-subtle)]",
                    )}
                  >
                    {file.path}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* DIFF VIEWER */}
        <div className="flex flex-col bg-[#111110]">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--ds-hairline)]">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-mono text-[var(--ds-ink-subtle)]">
                ◇ {activeFile}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--ds-ink-tertiary)] bg-[var(--ds-surface-1)] px-1.5 py-0.5 rounded">
                modified
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-[12px] font-mono">
                <span className="text-emerald-500">
                  +
                  {currentFileStats.changes?.added ||
                    (activeFile.includes("process") ? 2 : 8)}
                </span>
                <span className="text-red-500">
                  -
                  {currentFileStats.changes?.removed ||
                    (activeFile.includes("process") ? 2 : 0)}
                </span>
              </div>
              <button
                onClick={handleCopy}
                className="text-[var(--ds-ink-tertiary)] hover:text-[var(--ds-ink)] transition-colors p-1"
                title="Copy diff"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeFile}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col py-3 overflow-x-auto text-[13px] leading-relaxed font-mono"
            >
              {currentDiff.map((line: any, i: number) => {
                const isAdded = line.type === "added";
                const isRemoved = line.type === "removed";

                return (
                  <div
                    key={i}
                    className={cn(
                      "flex px-4 hover:bg-[var(--ds-surface-1)] transition-colors min-w-max",
                      isAdded &&
                      "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
                      isRemoved &&
                      "bg-red-500/10 text-red-400 hover:bg-red-500/20",
                      !isAdded && !isRemoved && "text-[var(--ds-ink-subtle)]",
                    )}
                  >
                    <div className="w-8 text-right shrink-0 text-[11px] text-[var(--ds-ink-tertiary)] select-none pt-[1px] mr-4">
                      {line.lineNum}
                    </div>
                    <div className="w-4 shrink-0 select-none pt-[1px] opacity-70">
                      {isAdded ? "+" : isRemoved ? "-" : " "}
                    </div>
                    <div className="whitespace-pre">{line.text || " "}</div>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* EXPLANATION */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-1 block">
            Why this changed
          </span>
          <p className="text-[13px] text-[var(--ds-ink)] leading-relaxed">
            CPU-bound risk scoring was blocking the request path. The repair
            delegates the calculation to the existing worker boundary while
            preserving the persistence contract.
          </p>
        </div>

        {/* REPAIR IMPACT */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-1 block">
            Repair Impact
          </span>
          <div className="flex flex-col gap-1.5 text-[12px] text-[var(--ds-ink-subtle)]">
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-500" /> API unchanged
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-500" /> Worker boundary
              reused
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-500" /> Minimal patch
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-500" /> No unrelated
              changes
            </div>
          </div>
        </div>
      </div>

      {/* NEXT ACTION */}
      <div className="flex items-center justify-end p-5 md:p-6 border-t border-[var(--ds-hairline)] mt-4">
        <div className="flex flex-col items-end gap-3">
          <span className="text-[12px] text-[var(--ds-ink-subtle)]">
            The patch will be checked in the sandbox before runtime
            verification.
          </span>
          <Button
            onClick={() => onStageSelect("validation")}
            className="h-9 px-5 text-[13px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] border-0 gap-2 shadow-sm"
          >
            Run local validation <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function StageContent({
  data,
  activeStage,
  onStageSelect,
}: StageContentProps) {
  const {
    discovery,
    reproduction,
    baseline,
    diagnosis,
    repair,
    validation,
    verification,
    pullRequest,
    qodoReview,
    approval,
  } = data;

  const [prTitle, setPrTitle] = useState("Fix Node.js event-loop starvation");
  const [prDescription, setPrDescription] = useState(
    "Move CPU-bound risk scoring off the Node.js main thread after deterministic runtime verification.",
  );

  const renderDiscover = () => (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-[900px]">
      {" "}
      {/* Header */}{" "}
      <div className="flex flex-col gap-2 mb-8 md:mb-10">
        {" "}
        <span className="text-[11px] font-bold tracking-[0.08em] text-emerald-500 uppercase font-heading">
          {" "}
          Completed{" "}
        </span>{" "}
        <h1 className="text-[28px] font-heading md:text-[32px] font-semibold text-[var(--ds-ink)] tracking-tight leading-tight">
          {" "}
          Repository Discovery{" "}
        </h1>{" "}
        <p className="text-[14.5px] text-[var(--ds-ink-subtle)] leading-relaxed mt-1">
          {" "}
          AEGIS mapped the repository to find the runtime surface, entrypoint,
          and suspicious execution path.{" "}
        </p>{" "}
      </div>{" "}
      {/* Runtime Surface Panel */}{" "}
      <div className="flex flex-col rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] mb-5 md:mb-6 overflow-hidden">
        {" "}
        <div className="px-4 py-2.5 border-b border-[var(--ds-hairline)] bg-[var(--ds-surface-1)]">
          {" "}
          <span className="text-[12px] font-medium text-[var(--ds-ink)]">
            Runtime surface
          </span>{" "}
        </div>{" "}
        <div className="flex flex-col">
          {" "}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--ds-hairline)]">
            {" "}
            <span className="text-[13px] text-[var(--ds-ink-subtle)]">
              Runtime
            </span>{" "}
            <span className="text-[13px] text-[var(--ds-ink)]">
              {discovery.runtime}
            </span>{" "}
          </div>{" "}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--ds-hairline)]">
            {" "}
            <span className="text-[13px] text-[var(--ds-ink-subtle)]">
              Entrypoint
            </span>{" "}
            <span className="text-[13px] text-[var(--ds-ink)]">
              {discovery.entrypoint}
            </span>{" "}
          </div>{" "}
          <div className="flex items-center justify-between px-4 py-3">
            {" "}
            <span className="text-[13px] text-[var(--ds-ink-subtle)]">
              Endpoint
            </span>{" "}
            <span className="text-[13px] text-[var(--ds-ink)]">
              {discovery.endpoint}
            </span>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Suspicious Path Panel */}{" "}
      <div className="flex flex-col rounded-[8px] border border-red-500/20 bg-red-500/[0.02] mb-6 md:mb-8 p-4">
        {" "}
        <div className="flex items-center gap-2 mb-3">
          {" "}
          <div className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />{" "}
          <span className="text-[11px] font-bold tracking-[0.08em] text-red-500 uppercase font-heading">
            {" "}
            Suspicious Path{" "}
          </span>{" "}
        </div>{" "}
        <div className="flex flex-col pl-3.5">
          {" "}
          <span className="text-[14px] text-[var(--ds-ink)] font-medium mb-1.5">
            {" "}
            {discovery.suspiciousPaths[0].file}{" "}
          </span>{" "}
          <p className="text-[14px] text-[var(--ds-ink-subtle)] leading-relaxed">
            {" "}
            {discovery.suspiciousPaths[0].reason}{" "}
          </p>{" "}
        </div>{" "}
      </div>{" "}
      {/* Evidence */}{" "}
      <div className="flex flex-col mb-7 md:mb-9">
        {" "}
        <span className="text-[11px] font-semibold tracking-[0.06em] text-[var(--ds-ink-tertiary)] uppercase mb-3">
          {" "}
          Evidence{" "}
        </span>{" "}
        <span className="text-[13px] text-[var(--ds-ink)] mb-2 font-medium">
          {" "}
          3 signals identified{" "}
        </span>{" "}
        <ul className="flex flex-col gap-2 text-[13px] text-[var(--ds-ink-subtle)]">
          {" "}
          <li className="flex items-center gap-2">
            {" "}
            <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />{" "}
            <span>Node.js runtime detected</span>{" "}
          </li>{" "}
          <li className="flex items-center gap-2">
            {" "}
            <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />{" "}
            <span>Endpoint identified as testable surface</span>{" "}
          </li>{" "}
          <li className="flex items-center gap-2">
            {" "}
            <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />{" "}
            <span>
              Synchronous CPU-bound operation ranked as suspicious
            </span>{" "}
          </li>{" "}
        </ul>{" "}
      </div>{" "}
      {/* Primary Action */}{" "}
      <div className="pt-2">
        {" "}
        <Button
          onClick={() => onStageSelect("reproduce")}
          className="h-8 px-4 text-[13px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] gap-1.5 border-0"
        >
          {" "}
          Continue to reproduction <ArrowRight className="h-3.5 w-3.5" />{" "}
        </Button>{" "}
      </div>{" "}
    </div>
  );
  const renderReproduce = () => (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-[900px]">
      {" "}
      {/* Top Status */}{" "}
      <div className="flex items-center gap-3 mb-6">
        {" "}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)]">
          {" "}
          <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse duration-1000" />{" "}
          <span className="text-[10px] font-bold tracking-[0.06em] text-[var(--ds-ink-subtle)] uppercase">
            {" "}
            Active Run{" "}
          </span>{" "}
        </div>{" "}
        <span className="text-[10px] font-medium tracking-[0.06em] text-[var(--ds-ink-tertiary)] uppercase">
          {" "}
          Mocked Execution{" "}
        </span>{" "}
      </div>{" "}
      {/* Header */}{" "}
      <div className="flex flex-col mb-8 md:mb-9">
        {" "}
        <span className="text-[11px] font-bold tracking-[0.08em] text-[var(--ds-ink-tertiary)] uppercase font-heading mb-2">
          {" "}
          Isolated Reproduction{" "}
        </span>{" "}
        <h1 className="text-[28px] font-heading md:text-[34px] font-semibold text-[var(--ds-ink)] tracking-tight leading-tight mb-2.5">
          {" "}
          Reproducing the failure{" "}
        </h1>{" "}
        <p className="text-[14.5px] text-[var(--ds-ink-subtle)] leading-relaxed">
          {" "}
          A clean Daytona sandbox is running the production-shaped workload
          against the same endpoint.{" "}
        </p>{" "}
      </div>{" "}
      {/* Main Execution Panel */}{" "}
      <div className="flex flex-col rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] mb-5 md:mb-6 overflow-hidden">
        {" "}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--ds-hairline)] bg-[var(--ds-surface-1)]">
          {" "}
          <div className="flex items-center gap-2">
            {" "}
            <Activity className="h-3.5 w-3.5 text-[var(--ds-ink-subtle)]" />{" "}
            <span className="text-[12px] font-medium text-[var(--ds-ink)]">
              daytona-7f2a
            </span>{" "}
          </div>{" "}
          <span className="text-[10px] font-bold tracking-[0.08em] text-amber-500 uppercase font-heading">
            {" "}
            Running{" "}
          </span>{" "}
        </div>{" "}
        {/* 4 Column execution metadata */}{" "}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[var(--ds-hairline)]">
          {" "}
          <div className="flex flex-col p-4">
            {" "}
            <span className="text-[10px] font-semibold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-2">
              Runtime
            </span>{" "}
            <span className="text-[14px] text-[var(--ds-ink)]">
              node 20.11
            </span>{" "}
          </div>{" "}
          <div className="flex flex-col p-4">
            {" "}
            <span className="text-[10px] font-semibold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-2">
              Workload
            </span>{" "}
            <span className="text-[14px] text-[var(--ds-ink)]">
              100 req/s
            </span>{" "}
          </div>{" "}
          <div className="flex flex-col p-4">
            {" "}
            <span className="text-[10px] font-semibold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-2">
              Health Probe
            </span>{" "}
            <span className="text-[14px] text-red-500">16%</span>{" "}
          </div>{" "}
          <div className="flex flex-col p-4">
            {" "}
            <span className="text-[10px] font-semibold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-2">
              Telemetry
            </span>{" "}
            <span className="text-[14px] text-[var(--ds-ink)]">
              streaming
            </span>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Reproduction Result */}{" "}
      <div className="flex flex-col rounded-[8px] border border-red-500/20 bg-red-500/[0.02] mb-3 md:mb-4 p-4">
        {" "}
        <div className="flex items-center gap-2 mb-2">
          {" "}
          <div className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />{" "}
          <span className="text-[11px] font-bold tracking-[0.08em] text-red-500 uppercase font-heading">
            {" "}
            Reproduction Confirmed{" "}
          </span>{" "}
        </div>{" "}
        <div className="flex flex-col pl-3.5">
          {" "}
          <p className="text-[14px] text-[var(--ds-ink)] leading-relaxed font-medium">
            {" "}
            Event-loop starvation under concurrent traffic{" "}
          </p>{" "}
        </div>{" "}
      </div>{" "}
      {/* Supporting Evidence */}{" "}
      <div className="flex flex-col gap-1 text-[13px] text-[var(--ds-ink-subtle)] mb-7 md:mb-8 pl-1">
        {" "}
        <div className="flex items-center gap-2">
          {" "}
          <span className="">100 req/s</span> <span>workload</span>{" "}
        </div>{" "}
        <div className="flex items-center gap-2">
          {" "}
          <span>Health availability dropped to</span>{" "}
          <span className="text-red-500">16%</span>{" "}
        </div>{" "}
      </div>{" "}
      {/* Action Area */}{" "}
      <div className="pt-2">
        {" "}
        <Button
          onClick={() => onStageSelect("measure")}
          className="h-8 px-4 text-[13px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] border-0 gap-1.5"
        >
          {" "}
          View baseline metrics <ArrowRight className="h-3.5 w-3.5" />{" "}
        </Button>{" "}
      </div>{" "}
    </div>
  );
  const renderMeasure = () => (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-[900px]">
      {/* Header */}
      <div className="flex flex-col gap-1.5 mb-6 md:mb-7">
        <span className="text-[11px] font-bold tracking-[0.08em] text-emerald-500 uppercase font-heading">
          Completed
        </span>
        <h1 className="text-[28px] md:text-[32px] font-semibold text-[var(--ds-ink)] tracking-tight leading-tight font-heading">
          Baseline Measurement
        </h1>
        <p className="text-[14px] text-[var(--ds-ink-subtle)] leading-relaxed mt-1 max-w-[680px]">
          The endpoint completes functionally, but CPU-bound work monopolizes
          the Node.js main thread and causes severe event-loop starvation.
        </p>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6 md:mb-7">
        <div className="flex flex-col p-4 rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] justify-center h-[100px]">
          <span className="text-[10px] font-semibold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-1.5">
            Event P99
          </span>
          <span className="text-[20px] font-mono text-red-500">4,217 ms</span>
          <span className="text-[11px] text-[var(--ds-ink-tertiary)] mt-1 font-mono">
            &lt; 52 ms
          </span>
        </div>
        <div className="flex flex-col p-4 rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] justify-center h-[100px]">
          <span className="text-[10px] font-semibold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-1.5">
            Availability
          </span>
          <span className="text-[20px] font-mono text-red-500">16%</span>
          <span className="text-[11px] text-[var(--ds-ink-tertiary)] mt-1 font-mono">
            target 100%
          </span>
        </div>
        <div className="flex flex-col p-4 rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] justify-center h-[100px]">
          <span className="text-[10px] font-semibold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-1.5">
            Endpoint
          </span>
          <span className="text-[20px] font-mono text-red-500">5,102 ms</span>
          <span className="text-[11px] text-[var(--ds-ink-tertiary)] mt-1 font-mono">
            &lt; 100 ms
          </span>
        </div>
        <div className="flex flex-col p-4 rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] justify-center h-[100px]">
          <span className="text-[10px] font-semibold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-1.5">
            Tests
          </span>
          <span className="text-[20px] font-mono text-[var(--ds-ink)]">
            100 / 100
          </span>
          <span className="text-[11px] text-[var(--ds-ink-tertiary)] mt-1 font-mono">
            preserved
          </span>
        </div>
      </div>

      {/* Animated Baseline Chart (Logarithmic-style visual scaling) */}
      <div className="flex flex-col rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] overflow-hidden mb-6 md:mb-7">
        <div className="flex flex-col px-4 py-3 border-b border-[var(--ds-hairline)] bg-[var(--ds-surface-1)]/30">
          <h3 className="text-[12px] font-medium text-[var(--ds-ink)] mb-0.5">
            Event-loop latency
          </h3>
          <p className="text-[11px] text-[var(--ds-ink-subtle)]">
            Latency under concurrent workload
          </p>
        </div>
        <div className="relative p-4 md:p-5 h-[180px] flex items-end overflow-hidden">
          {/* Subtle Grid */}
          <div className="absolute inset-0 z-0 flex flex-col justify-between px-4 py-6 md:px-5 opacity-[0.15] pointer-events-none">
            <div className="w-full border-t border-[var(--ds-hairline)]" />
            <div className="w-full border-t border-[var(--ds-hairline)]" />
            <div className="w-full border-t border-[var(--ds-hairline)]" />
          </div>

          {/* Target Line (log-scaled roughly at ~76% from top) */}
          <div
            className="absolute left-0 right-0 z-10 flex items-center gap-2"
            style={{ top: "76%" }}
          >
            <div className="w-full border-t border-dashed border-[var(--ds-ink-tertiary)] opacity-40" />
            <span className="absolute left-4 md:left-5 -top-4 text-[10px] font-mono text-[var(--ds-ink-tertiary)] uppercase font-heading tracking-widest">
              target &lt; 52 ms
            </span>
          </div>

          {/* SVG Chart */}
          <div className="absolute inset-0 z-20 px-4 py-6 md:px-5">
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="w-full h-full overflow-visible"
            >
              {/* Logarithmic scaled points:
                  10 req: 18ms -> Y=92
                  25 req: 24ms -> Y=87
                  50 req: 41ms -> Y=80
                  75 req: 310ms -> Y=50
                  100 req: 4217ms -> Y=13
              */}
              <path
                d="M 0 92 L 25 87 L 50 80 L 75 50 L 97 13"
                fill="none"
                stroke="var(--ds-ink)"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
                className="animate-[draw-path_0.8s_ease-out_forwards]"
                strokeDasharray="1000"
                strokeDashoffset="1000"
              />
              {/* Final point marker */}
              <circle
                cx="97"
                cy="13"
                r="3"
                fill="var(--ds-canvas)"
                stroke="var(--ds-ink)"
                strokeWidth="1.5"
                className="animate-[fade-in_0.4s_ease-out_0.7s_both]"
              />
            </svg>
            <div className="absolute right-2 md:right-3 top-5 animate-[fade-in_0.4s_ease-out_0.7s_both]">
              <span className="text-[11px] font-mono text-[var(--ds-ink)] bg-[var(--ds-canvas)]">
                4,217 ms
              </span>
            </div>
          </div>

          {/* Axis Labels */}
          <div className="absolute bottom-1.5 left-4 md:left-5 right-4 md:right-5 flex justify-between text-[10px] font-mono text-[var(--ds-ink-tertiary)] z-30">
            <span>10</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>100 req/s</span>
          </div>
        </div>
      </div>

      {/* Compact Evidence Row */}
      <div className="flex flex-col gap-3 mb-8 md:mb-10 px-1 mt-2">
        <div className="flex items-center gap-6">
          <span className="text-[13px] text-[var(--ds-ink-subtle)] w-[140px]">
            Health availability
          </span>
          <div className="flex items-center gap-2 text-[13px] font-mono">
            <span className="text-[var(--ds-ink)]">100% target</span>
            <span className="text-[var(--ds-ink-tertiary)]">→</span>
            <span className="text-red-500">16% observed</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-[13px] text-[var(--ds-ink-subtle)] w-[140px]">
            Functional tests
          </span>
          <div className="flex items-center gap-2 text-[13px] font-mono text-[var(--ds-ink)]">
            <Check className="h-3.5 w-3.5 text-emerald-500" />
            <span>100 / 100 passed</span>
          </div>
        </div>
      </div>

      {/* Baseline Conclusion (Inline Notice) */}
      <div className="flex items-start gap-3 mb-6 md:mb-7">
        <Info className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
        <div className="flex flex-col">
          <span className="text-[13px] font-medium text-[var(--ds-ink)] mb-0.5">
            Baseline captured
          </span>
          <p className="text-[13px] text-[var(--ds-ink-subtle)] leading-relaxed">
            Endpoint remains functionally correct, but CPU-bound work causes
            severe event-loop starvation under concurrent traffic.
          </p>
        </div>
      </div>

      {/* Action */}
      <div className="pt-0">
        <Button
          onClick={() => onStageSelect("diagnose")}
          className="h-8 px-4 text-[13px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] border-0 gap-1.5"
        >
          Review diagnosis <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  const renderDiagnose = () => (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-[900px]">
      {/* Header */}
      <div className="flex flex-col gap-1.5 mb-8 md:mb-10">
        <span className="text-[11px] font-bold tracking-[0.08em] text-emerald-500 uppercase font-heading">
          Completed
        </span>
        <h1 className="text-[28px] md:text-[32px] font-semibold text-[var(--ds-ink)] tracking-tight leading-tight font-heading">
          Diagnosis
        </h1>
        <p className="text-[14px] text-[var(--ds-ink-subtle)] leading-relaxed mt-1 max-w-[700px]">
          Risk scoring executes synchronously inside the request handler,
          blocking the Node.js event loop.
        </p>
      </div>

      {/* Root Cause Block */}
      <div className="flex flex-col mb-8 md:mb-10 animate-in fade-in duration-700">
        <h3 className="text-[11px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-4">
          Root Cause
        </h3>
        <div className="flex flex-col rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)]">
          <div className="p-4 md:p-5 border-b border-[var(--ds-hairline)]">
            <span className="text-[16px] font-medium text-[var(--ds-ink)] font-heading">
              Event-loop starvation
            </span>
            <p className="text-[13px] text-[var(--ds-ink-subtle)] mt-1.5">
              Caused by synchronous CPU-bound risk scoring inside POST
              /orders/process.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:divide-x divide-y sm:divide-y-0 divide-[var(--ds-hairline)] bg-[var(--ds-canvas)]">
            <div className="flex flex-col p-4 flex-1">
              <span className="text-[10px] font-semibold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-1">
                Affected endpoint
              </span>
              <span className="text-[12px] font-mono text-[var(--ds-ink)]">
                POST /orders/process
              </span>
            </div>
            <div className="flex flex-col p-4 flex-1">
              <span className="text-[10px] font-semibold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-1">
                Runtime
              </span>
              <span className="text-[12px] font-mono text-[var(--ds-ink)]">
                Node.js 20.11
              </span>
            </div>
            <div className="flex flex-col p-4 flex-1">
              <span className="text-[10px] font-semibold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-1">
                Confidence
              </span>
              <span className="text-[12px] font-mono text-[var(--ds-ink)]">
                97%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Causal Flow (Vertical) */}
      <div className="flex flex-col mb-8 md:mb-10">
        <h3 className="text-[11px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-4">
          Why it happens
        </h3>
        <div className="flex flex-col ml-2 overflow-hidden">
          <div className="flex items-start gap-5 group animate-[fade-in_0.4s_ease-out_0.2s_both]">
            <div className="flex flex-col items-center mt-1">
              <div className="h-2 w-2 rounded-full border-2 border-[var(--ds-ink-tertiary)] bg-[var(--ds-canvas)] group-hover:border-[var(--ds-ink)] transition-colors" />
              <div className="h-10 w-px bg-[var(--ds-hairline-strong)]" />
            </div>
            <div className="flex flex-col pb-6 -mt-0.5">
              <span className="text-[13px] font-medium text-[var(--ds-ink)]">
                Incoming request
              </span>
              <span className="text-[12px] text-[var(--ds-ink-subtle)] mt-0.5 font-mono">
                POST /orders/process
              </span>
            </div>
          </div>

          <div className="flex items-start gap-5 group animate-[fade-in_0.4s_ease-out_0.4s_both]">
            <div className="flex flex-col items-center mt-1">
              <div className="h-2 w-2 rounded-full border-2 border-[var(--ds-ink-tertiary)] bg-[var(--ds-canvas)] group-hover:border-[var(--ds-ink)] transition-colors" />
              <div className="h-10 w-px bg-[var(--ds-hairline-strong)]" />
            </div>
            <div className="flex flex-col pb-6 -mt-0.5">
              <span className="text-[13px] font-medium text-[var(--ds-ink)]">
                Risk scoring executes
              </span>
              <span className="text-[12px] text-[var(--ds-ink-subtle)] mt-0.5 font-mono">
                src/orders/process.ts
              </span>
            </div>
          </div>

          <div className="flex items-start gap-5 group animate-[fade-in_0.4s_ease-out_0.6s_both]">
            <div className="flex flex-col items-center mt-1">
              <div className="h-2 w-2 rounded-full border-2 border-amber-500 bg-[var(--ds-canvas)]" />
              <div className="h-10 w-px bg-[var(--ds-hairline-strong)]" />
            </div>
            <div className="flex flex-col pb-6 -mt-0.5">
              <span className="text-[13px] font-medium text-[var(--ds-ink)]">
                CPU monopolizes main thread
              </span>
              <span className="text-[12px] text-[var(--ds-ink-subtle)] mt-0.5 font-mono">
                Synchronous execution
              </span>
            </div>
          </div>

          <div className="flex items-start gap-5 group animate-[fade-in_0.4s_ease-out_0.8s_both]">
            <div className="flex flex-col items-center mt-1">
              <div className="h-2 w-2 rounded-full border-2 border-red-500 bg-[var(--ds-canvas)]" />
              <div className="h-10 w-px bg-[var(--ds-hairline-strong)]" />
            </div>
            <div className="flex flex-col pb-6 -mt-0.5">
              <span className="text-[13px] font-medium text-red-500">
                Event loop blocked
              </span>
              <span className="text-[12px] text-[var(--ds-ink-subtle)] mt-0.5 font-mono">
                Event-loop P99: 4,217 ms
              </span>
            </div>
          </div>

          <div className="flex items-start gap-5 group animate-[fade-in_0.4s_ease-out_1.0s_both]">
            <div className="flex flex-col items-center mt-1">
              <div className="h-2 w-2 rounded-full border-2 border-red-500 bg-[var(--ds-canvas)]" />
              <div className="h-10 w-px bg-[var(--ds-hairline-strong)]" />
            </div>
            <div className="flex flex-col pb-6 -mt-0.5">
              <span className="text-[13px] font-medium text-red-500">
                Health checks timeout
              </span>
              <span className="text-[12px] text-[var(--ds-ink-subtle)] mt-0.5 font-mono">
                /healthz
              </span>
            </div>
          </div>

          <div className="flex items-start gap-5 group animate-[fade-in_0.4s_ease-out_1.2s_both]">
            <div className="flex flex-col items-center mt-1">
              <div className="h-2 w-2 rounded-full border-2 border-red-500 bg-[var(--ds-canvas)]" />
            </div>
            <div className="flex flex-col -mt-0.5">
              <span className="text-[13px] font-medium text-red-500">
                Availability drops to 16%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Evidence */}
      <div className="flex flex-col mb-8 md:mb-10 animate-[fade-in_0.6s_ease-out_0.6s_both]">
        <h3 className="text-[11px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-4">
          Supporting evidence
        </h3>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col border-b border-[var(--ds-hairline)] pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Check className="h-3.5 w-3.5 text-[var(--ds-ink-tertiary)] shrink-0" />
              <span className="text-[13px] font-medium text-[var(--ds-ink)]">
                CPU profile shows synchronous execution
              </span>
            </div>
            <div className="flex items-center justify-between pl-[22px]">
              <span className="text-[12px] text-[var(--ds-ink-subtle)]">
                Main thread consumed by risk scoring
              </span>
              <span className="text-[10px] font-mono text-[var(--ds-ink-tertiary)]">
                PROFILE
              </span>
            </div>
          </div>

          <div className="flex flex-col border-b border-[var(--ds-hairline)] pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Check className="h-3.5 w-3.5 text-[var(--ds-ink-tertiary)] shrink-0" />
              <span className="text-[13px] font-medium text-[var(--ds-ink)]">
                Event-loop latency reached 4217 ms
              </span>
            </div>
            <div className="flex items-center justify-between pl-[22px]">
              <span className="text-[12px] text-[var(--ds-ink-subtle)]">
                Exceeded target by 81x
              </span>
              <span className="text-[10px] font-mono text-[var(--ds-ink-tertiary)]">
                RUNTIME
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <Check className="h-3.5 w-3.5 text-[var(--ds-ink-tertiary)] shrink-0" />
              <span className="text-[13px] font-medium text-[var(--ds-ink)]">
                Health availability dropped to 16%
              </span>
            </div>
            <div className="flex items-center justify-between pl-[22px]">
              <span className="text-[12px] text-[var(--ds-ink-subtle)]">
                Health probes missed during workload
              </span>
              <span className="text-[10px] font-mono text-[var(--ds-ink-tertiary)]">
                AVAILABILITY
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Correlation */}
      <div className="flex flex-col mb-8 md:mb-10 animate-[fade-in_0.6s_ease-out_1s_both]">
        <h3 className="text-[11px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-4">
          Failure correlation
        </h3>
        <div className="flex flex-col text-[12px] font-mono">
          <div className="flex items-center gap-4 py-1.5">
            <span className="text-[var(--ds-ink-subtle)] w-[72px] shrink-0">
              19:33:18
            </span>
            <span className="text-[var(--ds-ink)]">workload started</span>
          </div>
          <div className="h-3.5 w-px bg-[var(--ds-hairline)] ml-[36px]" />
          <div className="flex items-center gap-4 py-1.5">
            <span className="text-[var(--ds-ink-subtle)] w-[72px] shrink-0">
              19:33:22
            </span>
            <span className="text-[var(--ds-ink)]">health degraded</span>
          </div>
          <div className="h-3.5 w-px bg-[var(--ds-hairline)] ml-[36px]" />
          <div className="flex items-center gap-4 py-1.5">
            <span className="text-[var(--ds-ink-subtle)] w-[72px] shrink-0">
              19:34:28
            </span>
            <span className="text-[var(--ds-ink)]">latency spike detected</span>
          </div>
          <div className="h-3.5 w-px bg-[var(--ds-hairline)] ml-[36px]" />
          <div className="flex items-center gap-4 py-1.5">
            <span className="text-[var(--ds-ink-subtle)] w-[72px] shrink-0">
              19:35:17
            </span>
            <span className="text-[var(--ds-ink)] font-medium text-[var(--ds-primary)]">
              root cause isolated
            </span>
          </div>
        </div>
      </div>

      {/* Confidence */}
      <div className="flex flex-col mb-8 md:mb-10 p-4 rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] animate-[fade-in_0.6s_ease-out_1.4s_both]">
        <div className="flex items-end justify-between mb-3">
          <span className="text-[12px] font-medium text-[var(--ds-ink)]">
            Diagnosis confidence
          </span>
          <span className="text-[14px] font-mono font-medium text-emerald-500">
            97%
          </span>
        </div>
        <div className="h-1 w-full bg-[var(--ds-canvas)] rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-emerald-500 rounded-full animate-[draw-path_0.8s_ease-out_1.5s_both]"
            style={{ width: "97%" }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
            Based on
          </span>
          <span className="text-[12px] text-[var(--ds-ink-subtle)]">
            CPU profile, Latency measurements, Health telemetry, Workload
            reproduction
          </span>
        </div>
      </div>

      {/* Action */}
      <div className="pt-0">
        <Button
          onClick={() => onStageSelect("repair")}
          className="h-8 px-4 text-[13px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] border-0 gap-1.5"
        >
          Prepare minimal repair <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
  const renderRepair = () => (
    <RepairStage repair={repair} onStageSelect={onStageSelect} />
  );
  const renderValidation = () => (
    <LocalValidationStage
      validation={validation}
      repair={repair}
      onStageSelect={onStageSelect}
    />
  );
  const renderVerify = () => (
    <VerificationStage
      verification={verification}
      onStageSelect={onStageSelect}
    />
  );
  const renderApproval = () => (
    <ApprovalStage
      approval={approval}
      verification={verification}
      repair={repair}
      onStageSelect={onStageSelect}
      prTitle={prTitle}
      setPrTitle={setPrTitle}
      prDescription={prDescription}
      setPrDescription={setPrDescription}
    />
  );
  const renderPullRequest = () => (
    <PullRequestStage
      pullRequest={pullRequest}
      onStageSelect={onStageSelect}
      prTitle={prTitle}
      setPrTitle={setPrTitle}
      prDescription={prDescription}
      setPrDescription={setPrDescription}
    />
  );
  const renderQodoReview = () => <QodoReviewStage prTitle={prTitle} />;
  return (
    <div className="p-8 lg:p-12 max-w-5xl mx-auto min-h-full">
      {" "}
      {activeStage === "discover" && renderDiscover()}{" "}
      {activeStage === "reproduce" && renderReproduce()}{" "}
      {activeStage === "measure" && renderMeasure()}{" "}
      {activeStage === "diagnose" && renderDiagnose()}{" "}
      {activeStage === "repair" && renderRepair()}{" "}
      {activeStage === "validation" && renderValidation()}{" "}
      {activeStage === "verify" && renderVerify()}{" "}
      {activeStage === "approval" && renderApproval()}{" "}
      {activeStage === "pull_request" && renderPullRequest()}{" "}
      {activeStage === "qodo_review" && renderQodoReview()}{" "}
    </div>
  );
}
function MetricCard({
  label,
  value,
  target,
  isBad = false,
}: {
  label: string;
  value: string;
  target: string;
  isBad?: boolean;
}) {
  return (
    <div className="flex flex-col p-4 rounded-[var(--ds-rounded-md)] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)]">
      {" "}
      <span className="text-[12px] text-[var(--ds-ink-subtle)] font-medium mb-2">
        {label}
      </span>{" "}
      <span
        className={cn(
          "text-[20px] font-medium tracking-tight",
          isBad ? "text-red-500" : "text-[var(--ds-ink)]",
        )}
      >
        {" "}
        {value}{" "}
      </span>{" "}
      <span className="text-[11px] text-[var(--ds-ink-tertiary)] mt-1 tracking-wider uppercase font-heading">
        {" "}
        Target: {target}{" "}
      </span>{" "}
    </div>
  );
}
function VerificationCard({
  label,
  metric,
  inverted = false,
}: {
  label: string;
  metric: any;
  inverted?: boolean;
}) {
  /* If inverted, a lower number is better */ return (
    <div className="flex flex-col p-4 rounded-[var(--ds-rounded-md)] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)]">
      {" "}
      <span className="text-[12px] text-[var(--ds-ink-subtle)] font-medium mb-3">
        {label}
      </span>{" "}
      <div className="flex items-center gap-3">
        {" "}
        <span className="text-[18px] text-[var(--ds-ink-tertiary)] line-through">
          {metric.before}
          {metric.unit}
        </span>{" "}
        <ArrowRight className="h-4 w-4 text-[var(--ds-ink-subtle)]" />{" "}
        <span className="text-[20px] font-heading font-medium text-emerald-500">
          {metric.after}
          {metric.unit}
        </span>{" "}
      </div>{" "}
    </div>
  );
}
