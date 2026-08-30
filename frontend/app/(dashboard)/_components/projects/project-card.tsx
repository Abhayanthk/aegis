"use client";

import { cn } from "@/lib/utils";
import { Check, Ellipsis } from "lucide-react";
import Link from "next/link";
import { Menu, MenuTrigger, MenuPopup, MenuItem, MenuSeparator } from "@/components/ui/menu";

export interface ProjectMetric {
  label: string;
  before: string;
  after: string;
}

export interface LatestInvestigation {
  id: string;
  finding: string;
  status: string;
  time: string;
  attempts?: number;
  stage?: string;
  metric?: ProjectMetric;
  tests?: string;
}

export interface Project {
  id: string;
  name: string;
  repository: string;
  branch: string;
  status: string;
  latestInvestigation: LatestInvestigation | null;
  lastActivity: string;
}

interface ProjectCardProps {
  project: Project;
}

const statusDotColors: Record<string, string> = {
  verified: "bg-emerald-500",
  healthy: "bg-emerald-500",
  investigating: "bg-blue-500",
  new: "bg-[var(--ds-ink-tertiary)]",
  failed: "bg-red-500",
  stopped: "bg-amber-500",
};

export function ProjectCard({ project }: ProjectCardProps) {
  const dotColor = statusDotColors[project.status] || statusDotColors.new;
  const targetUrl = project.latestInvestigation 
    ? `/projects/${project.id}/investigations/${project.latestInvestigation.id}`
    : `/projects/${project.id}/investigations/new`;

  return (
    <Link href={targetUrl} className="group block h-[200px]">
      <div className="flex flex-col h-full rounded-[var(--ds-rounded-xl)] border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)]/40 p-5 transition-colors duration-200 hover:bg-[var(--ds-surface-1)]">
        {/* Top Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("h-[6px] w-[6px] rounded-full shrink-0", dotColor)} />
            <h3 className="text-[14px] font-medium text-[var(--ds-ink)] tracking-tight">
              {project.name}
            </h3>
          </div>
          <Menu>
            <MenuTrigger className="p-1 rounded-[var(--ds-rounded-xs)] text-[var(--ds-ink-tertiary)] hover:text-[var(--ds-ink)] hover:bg-[var(--ds-surface-2)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)]/40" onClick={(e) => e.preventDefault()}>
              <Ellipsis className="h-4 w-4" />
            </MenuTrigger>
            <MenuPopup align="end" sideOffset={4} className="min-w-[140px]" onClick={(e) => e.preventDefault()}>
              <MenuItem className="text-[12px] cursor-pointer">View settings</MenuItem>
              <MenuItem className="text-[12px] cursor-pointer">Pause scanning</MenuItem>
              <MenuSeparator />
              <MenuItem className="text-[12px] text-red-500 hover:text-red-600 focus:text-red-600 cursor-pointer">Delete project</MenuItem>
            </MenuPopup>
          </Menu>
        </div>

        {/* Repo & Branch */}
        <div className="mt-1 text-[12px] text-[var(--ds-ink-subtle)]">
          {project.repository} · {project.branch}
        </div>

        <div className="flex-1" />

        {/* Investigation State */}
        {project.latestInvestigation ? (
          <div className="flex flex-col gap-1">
            <h4 className="text-[13px] font-medium text-[var(--ds-ink)]">
              {project.latestInvestigation.finding}
            </h4>

            {project.status === "failed" && project.latestInvestigation.attempts ? (
              <div className="flex flex-col mt-0.5">
                <span className="text-[12px] text-[var(--ds-ink-subtle)]">Verification failed</span>
                <span className="text-[12px] text-red-400 mt-0.5">{project.latestInvestigation.attempts} repair attempts</span>
              </div>
            ) : project.status === "investigating" && project.latestInvestigation.stage ? (
              <div className="flex flex-col mt-0.5">
                <span className="text-[12px] text-blue-400">{project.latestInvestigation.stage}</span>
                <span className="text-[12px] text-[var(--ds-ink-subtle)] mt-0.5 truncate">{project.lastActivity}</span>
              </div>
            ) : project.latestInvestigation.metric ? (
              <div className="flex flex-col mt-0.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[13px]">
                    <span className="text-[var(--ds-ink-tertiary)] line-through">{project.latestInvestigation.metric.before}</span>
                    <span className="text-[var(--ds-ink-subtle)]">→</span>
                    <span className="font-medium text-[var(--ds-ink)]">{project.latestInvestigation.metric.after}</span>
                  </div>
                  {project.latestInvestigation.tests && (
                    <div className="flex items-center gap-1 text-[12px] text-[var(--ds-ink-subtle)]">
                      {project.latestInvestigation.tests} <Check className="h-3 w-3 text-[var(--ds-ink)]" />
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-[var(--ds-ink-tertiary)] mt-0.5">{project.latestInvestigation.metric.label}</span>
              </div>
            ) : project.status === "stopped" ? (
               <div className="mt-0.5">
                 <span className="text-[12px] text-[var(--ds-ink-subtle)]">Investigation stopped</span>
               </div>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-1 mt-auto">
             <span className="text-[13px] font-medium text-[var(--ds-ink)]">
              No investigations yet
            </span>
             <span className="text-[12px] text-[var(--ds-ink-subtle)] mt-0.5">Added just now</span>
          </div>
        )}

        <div className="flex-1" />

        {/* Footer */}
        {project.latestInvestigation && (
           <div className="text-[11.5px] text-[var(--ds-ink-tertiary)] mt-auto pt-2">
             <span className="capitalize">{project.status}</span>
             {" · "}
             {project.latestInvestigation.time}
           </div>
        )}
      </div>
    </Link>
  );
}
