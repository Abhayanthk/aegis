/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GitPullRequest, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InvestigationStatus } from "@/app/(investigation)/_components/investigation-context";

export function RaisingPRStage({
  data,
  onStageSelect,
  investigationStatus = "completed",
  canAdvance,
}: {
  data: any;
  onStageSelect?: (id: string) => void;
  investigationStatus?: InvestigationStatus;
  canAdvance?: boolean;
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
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="h-8 px-3 text-[12px] font-medium border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] hover:bg-[var(--ds-surface-2)] text-[var(--ds-ink)]"
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
