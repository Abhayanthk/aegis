"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  GitPullRequest,
  GitMerge,
  GitPullRequestClosed,
  GitPullRequestDraft,
  ExternalLink,
  Check,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import projectData from "@/data/Project.json";
import type { Project } from "../_components/projects/project-card";

interface PullRequestItem {
  id: string;
  prNumber: number;
  title: string;
  projectId: string;
  projectName: string;
  repository: string;
  branch: string;
  baseBranch: string;
  status: "open" | "merged" | "closed" | "draft";
  checks: "passed" | "failed" | "running";
  tests: string;
  metric?: {
    label: string;
    before: string;
    after: string;
  };
  time: string;
  githubUrl: string;
  investigationId: string;
}

const statusConfig: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; badge: string }
> = {
  open: {
    label: "Open",
    icon: GitPullRequest,
    color: "text-emerald-500",
    badge: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
  merged: {
    label: "Merged",
    icon: GitMerge,
    color: "text-purple-400",
    badge: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
  closed: {
    label: "Closed",
    icon: GitPullRequestClosed,
    color: "text-red-400",
    badge: "text-red-400 bg-red-500/10 border-red-500/20",
  },
  draft: {
    label: "Draft",
    icon: GitPullRequestDraft,
    color: "text-[var(--ds-ink-tertiary)]",
    badge: "text-[var(--ds-ink-tertiary)] bg-[var(--ds-surface-2)] border-[var(--ds-hairline)]",
  },
};

const ITEMS_PER_PAGE = 5;

export default function PullRequestsPage() {
  const projects = useMemo(() => (projectData?.projects || []) as Project[], []);

  // Derive pull requests from projects that have created PRs
  const pullRequests: PullRequestItem[] = useMemo(() => {
    const prs: PullRequestItem[] = [];

    projects.forEach((p) => {
      if (p.name === "orders-api") {
        prs.push({
          id: "pr_orders_42",
          prNumber: 42,
          title: "Fix Node.js event-loop starvation",
          projectId: p.id,
          projectName: p.name,
          repository: p.repository,
          branch: "aegis/fix-a91f",
          baseBranch: "main",
          status: "open",
          checks: "passed",
          tests: "100 / 100",
          metric: {
            label: "Event-loop p99",
            before: "4,217 ms",
            after: "3.2 ms",
          },
          time: "12 min ago",
          githubUrl: `https://github.com/${p.repository}/pull/42`,
          investigationId: "A91F",
        });
      } else if (p.name === "search-api") {
        prs.push({
          id: "pr_search_31",
          prNumber: 31,
          title: "Reduce CPU-bound blocking serialization",
          projectId: p.id,
          projectName: p.name,
          repository: p.repository,
          branch: "aegis/fix-b72c",
          baseBranch: "main",
          status: "merged",
          checks: "passed",
          tests: "86 / 86",
          metric: {
            label: "Target p99",
            before: "1,842 ms",
            after: "74 ms",
          },
          time: "2 days ago",
          githubUrl: `https://github.com/${p.repository}/pull/31`,
          investigationId: "E29B",
        });
      } else if (p.name === "catalog-service") {
        prs.push({
          id: "pr_catalog_28",
          prNumber: 28,
          title: "Offload risk calculation from main thread",
          projectId: p.id,
          projectName: p.name,
          repository: p.repository,
          branch: "aegis/fix-f83e",
          baseBranch: "develop",
          status: "merged",
          checks: "passed",
          tests: "142 / 142",
          metric: {
            label: "Health availability",
            before: "41%",
            after: "100%",
          },
          time: "3 days ago",
          githubUrl: `https://github.com/${p.repository}/pull/28`,
          investigationId: "F83E",
        });
      }
    });

    return prs;
  }, [projects]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [repoFilter, setRepoFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const repositoryList = useMemo(() => {
    return Array.from(new Set(pullRequests.map((pr) => pr.projectName)));
  }, [pullRequests]);

  const filteredPullRequests = useMemo(() => {
    return pullRequests.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.repository.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.branch.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.prNumber.toString().includes(searchQuery);

      if (!matchesSearch) return false;

      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      if (repoFilter !== "all" && item.projectName !== repoFilter) {
        return false;
      }

      return true;
    });
  }, [pullRequests, searchQuery, statusFilter, repoFilter]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredPullRequests.length / ITEMS_PER_PAGE));
  const paginatedPullRequests = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPullRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPullRequests, currentPage]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleStatusChange = (val: string | null) => {
    if (val != null) {
      setStatusFilter(val);
      setCurrentPage(1);
    }
  };

  const handleRepoChange = (val: string | null) => {
    if (val != null) {
      setRepoFilter(val);
      setCurrentPage(1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col flex-1 p-6 md:p-8 lg:p-10 max-w-screen-2xl mx-auto w-full gap-6 pb-16"
    >
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-64 md:w-80">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ds-ink-tertiary)]" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search pull requests…"
            className="pl-8 h-8 text-[12px] border-[var(--ds-hairline)] bg-[var(--ds-canvas)] hover:bg-[var(--ds-surface-1)] focus:border-[var(--ds-primary)] transition-colors rounded-[var(--ds-rounded-md)]"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status filter using Coss UI Select */}
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger size="sm" className="w-[140px] text-[12px] bg-[var(--ds-canvas)] border-[var(--ds-hairline)] font-medium text-[var(--ds-ink-subtle)] hover:text-[var(--ds-ink)] rounded-[var(--ds-rounded-md)] transition-colors">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectPopup className="min-w-[140px]">
              <SelectItem value="all" className="rounded-[var(--ds-rounded-xs)] text-[12px] cursor-pointer">All statuses</SelectItem>
              <SelectItem value="open" className="rounded-[var(--ds-rounded-xs)] text-[12px] cursor-pointer">Open</SelectItem>
              <SelectItem value="merged" className="rounded-[var(--ds-rounded-xs)] text-[12px] cursor-pointer">Merged</SelectItem>
              <SelectItem value="closed" className="rounded-[var(--ds-rounded-xs)] text-[12px] cursor-pointer">Closed</SelectItem>
              <SelectItem value="draft" className="rounded-[var(--ds-rounded-xs)] text-[12px] cursor-pointer">Draft</SelectItem>
            </SelectPopup>
          </Select>

          {/* Repository filter using Coss UI Select */}
          <Select value={repoFilter} onValueChange={handleRepoChange}>
            <SelectTrigger size="sm" className="w-[155px] text-[12px] bg-[var(--ds-canvas)] border-[var(--ds-hairline)] font-medium text-[var(--ds-ink-subtle)] hover:text-[var(--ds-ink)] rounded-[var(--ds-rounded-md)] transition-colors">
              <SelectValue placeholder="All repositories" />
            </SelectTrigger>
            <SelectPopup className="min-w-[155px]">
              <SelectItem value="all" className="rounded-[var(--ds-rounded-xs)] text-[12px] cursor-pointer">All repositories</SelectItem>
              {repositoryList.map((repo) => (
                <SelectItem key={repo} value={repo} className="rounded-[var(--ds-rounded-xs)] text-[12px] cursor-pointer">
                  {repo}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>
      </div>

      {/* Pull Request List */}
      {filteredPullRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-[var(--ds-rounded-xl)] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] p-8">
          <div className="flex items-center justify-center h-10 w-10 rounded-full border border-[var(--ds-hairline)] bg-[var(--ds-surface-2)] mb-3">
            <GitPullRequest className="h-5 w-5 text-[var(--ds-ink-subtle)]" />
          </div>
          <h3 className="text-[15px] font-semibold text-[var(--ds-ink)] font-heading mb-1">
            No pull requests yet
          </h3>
          <p className="text-[13px] text-[var(--ds-ink-subtle)] max-w-[380px] leading-relaxed mb-5">
            Approved AEGIS repairs will appear here after a pull request is created.
          </p>
          <Link href="/projects">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3.5 text-[12px] font-medium border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] hover:bg-[var(--ds-surface-2)] rounded-[var(--ds-rounded-md)]"
            >
              View projects
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col rounded-[var(--ds-rounded-xl)] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 px-4 py-2.5 border-b border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
              <span className="col-span-6 md:col-span-5">Pull Request & Branch</span>
              <span className="col-span-3 md:col-span-2">Status</span>
              <span className="hidden md:block col-span-3">Verification</span>
              <span className="col-span-3 md:col-span-2 text-right">Updated</span>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-[var(--ds-hairline)]">
              <AnimatePresence mode="popLayout">
                {paginatedPullRequests.map((pr) => {
                  const cfg = statusConfig[pr.status] || statusConfig.open;
                  const Icon = cfg.icon;
                  const targetUrl = `/projects/${pr.projectId}/investigations/${pr.investigationId}`;

                  return (
                    <motion.div
                      key={pr.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="grid grid-cols-12 px-4 py-3.5 text-[12px] items-center hover:bg-[var(--ds-surface-1)] transition-colors group">
                        {/* Column 1: Title, PR Number, Repository, Branch */}
                        <div className="col-span-6 md:col-span-5 flex flex-col gap-1 min-w-0 pr-3">
                          <div className="flex items-center gap-2">
                            <Link
                              href={targetUrl}
                              className="font-medium text-[13px] text-[var(--ds-ink)] hover:text-[var(--ds-primary)] transition-colors font-heading truncate"
                            >
                              {pr.title}
                            </Link>
                            <span className="text-[12px] font-mono text-[var(--ds-ink-tertiary)] shrink-0">
                              #{pr.prNumber}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--ds-ink-tertiary)] truncate">
                            <span className="text-[var(--ds-ink-subtle)] font-medium">
                              {pr.projectName}
                            </span>
                            <span>·</span>
                            <span className="truncate">
                              {pr.baseBranch} ← {pr.branch}
                            </span>
                          </div>
                        </div>

                        {/* Column 2: Status */}
                        <div className="col-span-3 md:col-span-2 flex items-center gap-1.5 min-w-0">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--ds-rounded-xs)] text-[11px] font-medium border font-mono capitalize",
                              cfg.badge
                            )}
                          >
                            <Icon className={cn("h-3 w-3 shrink-0", cfg.color)} />
                            {cfg.label}
                          </span>
                        </div>

                        {/* Column 3: Verification Delta & Tests */}
                        <div className="hidden md:flex col-span-3 flex-col gap-0.5 min-w-0 pr-2">
                          <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
                            <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                            <span>{pr.tests} tests passed</span>
                          </div>
                          {pr.metric && (
                            <div className="flex items-center gap-1 font-mono text-[10px] text-[var(--ds-ink-tertiary)]">
                              <span className="line-through">{pr.metric.before}</span>
                              <span>→</span>
                              <span className="text-emerald-500 font-semibold">{pr.metric.after}</span>
                              <span>({pr.metric.label})</span>
                            </div>
                          )}
                        </div>

                        {/* Column 4: Time & Actions */}
                        <div className="col-span-3 md:col-span-2 flex items-center justify-end gap-3 text-right">
                          <span className="text-[11px] font-mono text-[var(--ds-ink-tertiary)] truncate">
                            {pr.time}
                          </span>

                          <div className="flex items-center gap-1 shrink-0">
                            {pr.githubUrl && (
                              <a
                                href={pr.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="View on GitHub"
                                className="p-1 rounded-[var(--ds-rounded-xs)] text-[var(--ds-ink-tertiary)] hover:text-[var(--ds-ink)] hover:bg-[var(--ds-surface-2)] transition-colors"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                            <Link
                              href={targetUrl}
                              aria-label="View investigation"
                              className="p-1 rounded-[var(--ds-rounded-xs)] text-[var(--ds-ink-tertiary)] hover:text-[var(--ds-ink)] hover:bg-[var(--ds-surface-2)] transition-colors"
                            >
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Pagination bar using Coss UI Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 text-[12px] text-[var(--ds-ink-subtle)]">
            <span className="font-mono text-[11px] text-[var(--ds-ink-tertiary)]">
              Showing{" "}
              {filteredPullRequests.length === 0
                ? 0
                : (currentPage - 1) * ITEMS_PER_PAGE + 1}
              –
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredPullRequests.length)} of{" "}
              {filteredPullRequests.length} pull requests
            </span>

            <Pagination className="w-auto mx-0">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
                    className={cn(
                      "h-8 text-[12px] border-[var(--ds-hairline)] bg-[var(--ds-canvas)] hover:bg-[var(--ds-surface-1)] rounded-[var(--ds-rounded-md)]",
                      currentPage <= 1 && "pointer-events-none opacity-40"
                    )}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === page}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(page);
                      }}
                      className={cn(
                        "h-8 w-8 text-[12px] font-mono rounded-[var(--ds-rounded-md)]",
                        currentPage === page
                          ? "bg-[var(--ds-surface-2)] border-[var(--ds-hairline)] text-[var(--ds-ink)] font-semibold"
                          : "border-transparent text-[var(--ds-ink-subtle)] hover:bg-[var(--ds-surface-1)]"
                      )}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                    }}
                    className={cn(
                      "h-8 text-[12px] border-[var(--ds-hairline)] bg-[var(--ds-canvas)] hover:bg-[var(--ds-surface-1)] rounded-[var(--ds-rounded-md)]",
                      currentPage >= totalPages && "pointer-events-none opacity-40"
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
    </motion.div>
  );
}
