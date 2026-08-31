"use client";

import { useState, useEffect } from "react";
import { ProjectGrid } from "../_components/projects/project-grid";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then(res => res.json())
      .then(data => {
        const mappedProjects = (data.projects || []).map((p: any) => ({
          ...p,
          repository: p.repo_url,
          latestInvestigation: p.latestInvestigation ? {
            ...p.latestInvestigation,
            time: new Date(p.latestInvestigation.time).toLocaleString(),
            finding: p.latestInvestigation.finding || "Analysis complete"
          } : null
        }));
        setProjects(mappedProjects);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load projects", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col flex-1 pb-12">
      {/* Header Area */}
      <div className="flex items-center justify-between px-6 pt-10 pb-6 gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ds-ink-tertiary)]" />
          <Input
            placeholder="Search repositories..."
            className="pl-8 h-8 text-[13px] border-0 bg-[var(--ds-surface-1)]/50 hover:bg-[var(--ds-surface-1)] focus-visible:ring-0 focus-visible:bg-[var(--ds-surface-1)] transition-colors placeholder:text-[var(--ds-ink-tertiary)]"
          />
        </div>

        <div className="flex items-center gap-3">
          <select className="h-8 rounded-lg border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)]/50 dark:bg-input/32 hover:bg-[var(--ds-surface-1)] px-2.5 text-[13px] font-medium text-[var(--ds-ink-subtle)] outline-none hover:text-[var(--ds-ink)] cursor-pointer appearance-none transition-colors">
             <option value="all">All Projects</option>
             <option value="active">Active Investigations</option>
             <option value="verified">Verified Fixes</option>
             <option value="failed">Failed Verification</option>
          </select>

          <Link href="/projects/new">
            <Button
              size="sm"
              className="h-8 px-3 text-[12px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] border-0 gap-1.5 shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Add project
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-6 mx-auto w-full max-w-screen-2xl">
        {loading ? (
           <div className="text-[13px] text-[var(--ds-ink-subtle)] px-4">Loading projects...</div>
        ) : (
          <ProjectGrid projects={projects} />
        )}
      </div>
    </div>
  );
}
