"use client";

import { useState, useEffect, useMemo } from "react";
import { ProjectGrid } from "../_components/projects/project-grid";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from "@/components/ui/select";
import projectData from "@/data/Project.json";

import type { Project } from "../_components/projects/project-card";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = searchQuery.trim() === "" || 
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        project.repository.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || project.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  return (
    <div className="flex flex-col flex-1 pb-12">
      {/* Header Area */}
      <div className="flex items-center justify-between px-6 pt-10 pb-6 gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ds-ink-tertiary)]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search repositories…"
            className="pl-8 h-8 text-[12px] border-[var(--ds-hairline)] bg-[var(--ds-canvas)] hover:bg-[var(--ds-surface-1)] focus:border-[var(--ds-primary)] transition-colors rounded-[var(--ds-rounded-md)]"
          />
        </div>

        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger size="sm" className="w-[140px] text-[12px] bg-[var(--ds-canvas)] border-[var(--ds-hairline)] font-medium text-[var(--ds-ink-subtle)] hover:text-[var(--ds-ink)] rounded-[var(--ds-rounded-md)] transition-colors">
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectPopup className="min-w-[140px]">
              {projectData.filters.map(f => (
                <SelectItem key={f.value} value={f.value} className="rounded-[var(--ds-rounded-xs)] text-[12px] cursor-pointer">
                  {f.label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>

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
          <ProjectGrid projects={filteredProjects} />
        )}
      </div>
    </div>
  );
}
