/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { motion } from "motion/react";
import { FolderGit2, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RepoInfoStage({ data, onStageSelect, canAdvance }: { data: any; onStageSelect: (id: string) => void; canAdvance?: boolean; }) {
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
