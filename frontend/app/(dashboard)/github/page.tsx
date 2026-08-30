"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  GitBranch,
  Search,
  ExternalLink,
  RefreshCw,
  Unlink,
  Shield,
  GitPullRequest,
  CheckCircle2,
  FolderGit2,
  ArrowRight,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import projectData from "@/data/Project.json";
import type { Project } from "../_components/projects/project-card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/motion/tabs";

export default function GitHubPage() {
  const { user } = useUser();
  const [isConnected, setIsConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [disconnectConfirm, setDisconnectConfirm] = useState(false);

  const projects = useMemo(() => (projectData?.projects || []) as Project[], []);

  // GitHub user profile info from Clerk or repository owner
  const username = user?.username || user?.firstName || "Abhyanthk";
  const avatarUrl = user?.imageUrl || "https://github.com/identicons/app.png";
  const githubProfileUrl = `https://github.com/${username}`;

  // Filtered repositories based on search
  const filteredRepositories = useMemo(() => {
    return projects.filter((p) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(query) ||
        p.repository.toLowerCase().includes(query) ||
        p.branch.toLowerCase().includes(query)
      );
    });
  }, [projects, searchQuery]);

  // Derived recent activity items related to GitHub
  const githubActivities = useMemo(() => {
    const items: Array<{ id: string; title: string; repo: string; time: string; icon: React.ComponentType<{ className?: string }> }> = [];

    projects.forEach((p) => {
      if (p.lastActivity?.includes("Pull request") || p.lastActivity?.includes("PR")) {
        items.push({
          id: `act_${p.id}`,
          title: p.lastActivity,
          repo: p.name,
          time: p.latestInvestigation?.time || "Recently",
          icon: GitPullRequest,
        });
      }
    });

    // Add standard sync/connection activity
    items.push({
      id: "act_sync_01",
      title: "Workspace repositories synchronized",
      repo: "All repositories",
      time: "2 min ago",
      icon: CheckCircle2,
    });

    return items;
  }, [projects]);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 800);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setDisconnectConfirm(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col flex-1 p-6 md:p-8 lg:p-10 max-w-screen-2xl mx-auto w-full gap-8 pb-20"
    >

      {/* GITHUB ACCOUNT */}
      <div className="flex flex-col gap-3">
        <span className="text-[11px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
          GitHub Account
        </span>

        {isConnected ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 rounded-[var(--ds-rounded-xl)] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--ds-rounded-md)] border border-[var(--ds-hairline)] bg-[var(--ds-surface-2)] overflow-hidden">
                {user?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <GitBranch className="h-5 w-5 text-[var(--ds-ink)]" />
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-[var(--ds-ink)] font-heading">
                    {username}
                  </span>
                  <span className="text-[11px] font-mono text-[var(--ds-ink-tertiary)] hidden sm:inline">
                    github.com/{username}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[12px] text-[var(--ds-ink-subtle)] font-mono">
                  <span className="text-emerald-500 font-medium">Connected</span>
                  <span>·</span>
                  <span className="text-[var(--ds-ink-tertiary)]">Last synchronized 2 min ago</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 px-3 text-[12px] font-medium border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] hover:bg-[var(--ds-surface-2)] rounded-[var(--ds-rounded-md)]"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
                {isSyncing ? "Synchronizing…" : "Sync repositories"}
              </Button>
              <a
                href={githubProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 px-3 text-[12px] font-medium border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] hover:bg-[var(--ds-surface-2)] rounded-[var(--ds-rounded-md)]"
                >
                  <span>Open GitHub</span>
                  <ExternalLink className="h-3 w-3 text-[var(--ds-ink-tertiary)]" />
                </Button>
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-[var(--ds-rounded-xl)] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[14px] font-medium text-[var(--ds-ink)] font-heading">
                No GitHub account connected
              </span>
              <p className="text-[12px] text-[var(--ds-ink-subtle)]">
                Connect GitHub to allow AEGIS to inspect repositories and create approved pull requests.
              </p>
            </div>
            <Button
              onClick={() => setIsConnected(true)}
              size="sm"
              className="h-8 px-4 text-[12px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] border-0 rounded-[var(--ds-rounded-md)] gap-1.5 shrink-0 shadow-sm"
            >
              <GitBranch className="h-3.5 w-3.5" />
              Connect GitHub
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="overview" variant="segment">
        <TabsList className="mb-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="repositories">Repositories</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="access">Access</TabsTrigger>
        </TabsList>

        {/* TAB 1 — OVERVIEW */}
        <TabsContent value="overview">
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="flex flex-col gap-8 pt-4">
            {isConnected && (
              <div className="flex flex-col gap-6 lg:flex-row">
                <div className="flex flex-col gap-3 flex-1">
                  <span className="text-[11px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                    Connection Summary
                  </span>
                  <div className="flex flex-col rounded-[var(--ds-rounded-xl)] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] overflow-hidden divide-y divide-[var(--ds-hairline)] text-[12px]">
                    <div className="flex items-center justify-between p-3.5 px-4">
                      <span className="text-[var(--ds-ink)] font-medium">Repositories</span>
                      <span className="font-mono text-[11px] text-[var(--ds-ink-subtle)] bg-[var(--ds-surface-2)] px-2 py-0.5 rounded-[var(--ds-rounded-xs)]">{projects.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-3.5 px-4">
                      <span className="text-[var(--ds-ink)] font-medium">Accessible</span>
                      <span className="font-mono text-[11px] text-[var(--ds-ink-subtle)] bg-[var(--ds-surface-2)] px-2 py-0.5 rounded-[var(--ds-rounded-xs)]">{projects.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-3.5 px-4">
                      <span className="text-[var(--ds-ink)] font-medium">Pull requests</span>
                      <span className="font-mono text-[11px] text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-[var(--ds-rounded-xs)] font-medium">Enabled</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 flex-1">
                  <span className="text-[11px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                    Quick Info
                  </span>
                  <div className="flex flex-col rounded-[var(--ds-rounded-xl)] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] overflow-hidden divide-y divide-[var(--ds-hairline)] text-[12px]">
                    <div className="flex items-center justify-between p-3.5 px-4">
                      <span className="text-[var(--ds-ink)] font-medium">Repository access</span>
                      <span className="font-mono text-[11px] text-[var(--ds-ink-subtle)] bg-[var(--ds-surface-2)] px-2 py-0.5 rounded-[var(--ds-rounded-xs)]">{projects.length} available</span>
                    </div>
                    <div className="flex items-center justify-between p-3.5 px-4">
                      <span className="text-[var(--ds-ink)] font-medium">Pull requests</span>
                      <span className="font-mono text-[11px] text-[var(--ds-ink-subtle)] bg-[var(--ds-surface-2)] px-2 py-0.5 rounded-[var(--ds-rounded-xs)]">Read & write</span>
                    </div>
                    <div className="flex items-center justify-between p-3.5 px-4">
                      <span className="text-[var(--ds-ink)] font-medium">Last synchronization</span>
                      <span className="font-mono text-[11px] text-[var(--ds-ink-subtle)] bg-[var(--ds-surface-2)] px-2 py-0.5 rounded-[var(--ds-rounded-xs)]">2 min ago</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* TAB 2 — REPOSITORIES */}
        <TabsContent value="repositories">
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="flex flex-col gap-6 pt-4">
            {!isConnected ? (
               <div className="p-8 text-center text-[13px] text-[var(--ds-ink-subtle)] border border-[var(--ds-hairline)] rounded-[var(--ds-rounded-xl)] bg-[var(--ds-canvas)]">
                 Connect your GitHub account to view repositories.
               </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <FolderGit2 className="h-4 w-4 text-[var(--ds-ink-tertiary)]" />
                      <span className="text-[11px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                        Repository Access
                      </span>
                      <span className="text-[11px] font-mono text-[var(--ds-ink-subtle)] ml-1">
                        ({filteredRepositories.length})
                      </span>
                    </div>
                    <p className="text-[12px] text-[var(--ds-ink-subtle)]">
                      Repositories available through your GitHub connection.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-64 md:w-80">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ds-ink-tertiary)]" />
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search repositories…"
                      className="pl-8 h-8 text-[12px] border-[var(--ds-hairline)] bg-[var(--ds-canvas)] hover:bg-[var(--ds-surface-1)] focus:border-[var(--ds-primary)] transition-colors rounded-[var(--ds-rounded-md)]"
                    />
                  </div>
                </div>

                <div className="flex flex-col rounded-[var(--ds-rounded-xl)] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] overflow-hidden">
                  <div className="grid grid-cols-12 px-4 py-2.5 border-b border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                    <span className="col-span-6 md:col-span-5">Repository</span>
                    <span className="col-span-3 md:col-span-3">Default Branch</span>
                    <span className="col-span-3 md:col-span-4 text-right">Access Status</span>
                  </div>

                  {filteredRepositories.length === 0 ? (
                    <div className="p-8 text-center text-[12px] text-[var(--ds-ink-subtle)]">
                      No repositories found matching &ldquo;{searchQuery}&rdquo;.
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--ds-hairline)]">
                      <AnimatePresence mode="popLayout">
                        {filteredRepositories.map((p) => {
                          const targetUrl = p.latestInvestigation
                            ? `/projects/${p.id}/investigations/${p.latestInvestigation.id}`
                            : `/projects`;

                          return (
                            <motion.div
                              key={p.id}
                              layout
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.15 }}
                            >
                              <Link
                                href={targetUrl}
                                className="grid grid-cols-12 px-4 py-3.5 text-[12px] items-center hover:bg-[var(--ds-surface-1)] transition-colors group cursor-pointer"
                              >
                                <div className="col-span-6 md:col-span-5 flex flex-col gap-0.5 min-w-0 pr-2">
                                  <span className="font-medium text-[13px] text-[var(--ds-ink)] font-mono truncate">
                                    {p.name}
                                  </span>
                                  <span className="text-[11px] font-mono text-[var(--ds-ink-tertiary)] truncate">
                                    {p.repository}
                                  </span>
                                </div>
                                <div className="col-span-3 md:col-span-3 flex items-center gap-1.5 min-w-0">
                                  <GitBranch className="h-3.5 w-3.5 text-[var(--ds-ink-tertiary)] shrink-0" />
                                  <span className="font-mono text-[11px] text-[var(--ds-ink-subtle)] bg-[var(--ds-surface-2)] px-2 py-0.5 rounded-[var(--ds-rounded-xs)] truncate">
                                    {p.branch}
                                  </span>
                                </div>
                                <div className="col-span-3 md:col-span-4 flex items-center justify-end gap-3 text-right">
                                  <div className="flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                                    <span className="text-[11px] font-medium text-emerald-500 font-mono">
                                      Connected
                                    </span>
                                  </div>
                                  <ArrowRight className="h-3.5 w-3.5 text-[var(--ds-ink-tertiary)] group-hover:text-[var(--ds-ink)] transition-transform group-hover:translate-x-0.5 shrink-0" />
                                </div>
                              </Link>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* TAB 3 — ACTIVITY */}
        <TabsContent value="activity">
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="flex flex-col gap-6 pt-4">
            {!isConnected ? (
               <div className="p-8 text-center text-[13px] text-[var(--ds-ink-subtle)] border border-[var(--ds-hairline)] rounded-[var(--ds-rounded-xl)] bg-[var(--ds-canvas)]">
                 Connect your GitHub account to view activity.
               </div>
            ) : githubActivities.length > 0 ? (
              <div className="flex flex-col gap-3">
                <span className="text-[11px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                  Recent Activity
                </span>
                <div className="flex flex-col rounded-[var(--ds-rounded-xl)] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] overflow-hidden divide-y divide-[var(--ds-hairline)]">
                  {githubActivities.map((act) => {
                    const Icon = act.icon;
                    return (
                      <div
                        key={act.id}
                        className="flex items-center justify-between p-3.5 px-4 text-[12px]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon className="h-4 w-4 text-[var(--ds-ink-tertiary)] shrink-0" />
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-[var(--ds-ink)] font-medium truncate">
                              {act.title}
                            </span>
                            <span className="text-[11px] font-mono text-[var(--ds-ink-tertiary)] truncate">
                              {act.repo}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-[var(--ds-ink-tertiary)] shrink-0 ml-4">
                          {act.time}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
               <div className="p-8 text-center text-[13px] text-[var(--ds-ink-subtle)] border border-[var(--ds-hairline)] rounded-[var(--ds-rounded-xl)] bg-[var(--ds-canvas)]">
                 No recent GitHub activity
               </div>
            )}
          </motion.div>
        </TabsContent>

        {/* TAB 4 — ACCESS */}
        <TabsContent value="access">
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="flex flex-col gap-8 pt-4">
             {!isConnected ? (
               <div className="p-8 text-center text-[13px] text-[var(--ds-ink-subtle)] border border-[var(--ds-hairline)] rounded-[var(--ds-rounded-xl)] bg-[var(--ds-canvas)]">
                 Connect your GitHub account to manage permissions and connection settings.
               </div>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-[var(--ds-ink-tertiary)]" />
                    <span className="text-[11px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                      AEGIS Permissions
                    </span>
                  </div>

                  <div className="flex flex-col rounded-[var(--ds-rounded-xl)] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] overflow-hidden">
                    <div className="divide-y divide-[var(--ds-hairline)] text-[12px]">
                      <div className="flex items-center justify-between p-3.5 px-4">
                        <span className="text-[var(--ds-ink)] font-medium">Repository contents</span>
                        <span className="font-mono text-[11px] text-[var(--ds-ink-subtle)] bg-[var(--ds-surface-2)] px-2 py-0.5 rounded-[var(--ds-rounded-xs)]">
                          Read
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3.5 px-4">
                        <span className="text-[var(--ds-ink)] font-medium">Repository metadata</span>
                        <span className="font-mono text-[11px] text-[var(--ds-ink-subtle)] bg-[var(--ds-surface-2)] px-2 py-0.5 rounded-[var(--ds-rounded-xs)]">
                          Read
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3.5 px-4">
                        <span className="text-[var(--ds-ink)] font-medium">Branches</span>
                        <span className="font-mono text-[11px] text-[var(--ds-ink-subtle)] bg-[var(--ds-surface-2)] px-2 py-0.5 rounded-[var(--ds-rounded-xs)]">
                          Read
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3.5 px-4">
                        <span className="text-[var(--ds-ink)] font-medium">Pull requests</span>
                        <span className="font-mono text-[11px] text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-[var(--ds-rounded-xs)] font-medium">
                          Read &amp; write
                        </span>
                      </div>
                    </div>
                    <div className="p-3.5 px-4 bg-[var(--ds-surface-1)] border-t border-[var(--ds-hairline)] text-[11px] text-[var(--ds-ink-subtle)]">
                      These permissions allow AEGIS to inspect code, prepare repairs, and create approved pull requests.
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-[11px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                    GitHub Connection
                  </span>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-[var(--ds-rounded-xl)] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] gap-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[13px] font-medium text-[var(--ds-ink)]">
                        Your GitHub account is connected to AEGIS.
                      </span>
                      <span className="text-[12px] text-[var(--ds-ink-subtle)]">
                        Disconnecting will revoke repository scanning and pull request generation permissions.
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <Button
                        onClick={handleSync}
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-[12px] font-medium border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] hover:bg-[var(--ds-surface-2)] rounded-[var(--ds-rounded-md)]"
                      >
                        Reconnect
                      </Button>

                      {disconnectConfirm ? (
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={handleDisconnect}
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-[12px] font-medium border-red-500/40 bg-red-500/10 text-red-400 hover:!bg-red-600 hover:!text-white hover:!border-red-600 rounded-[var(--ds-rounded-md)] transition-colors"
                          >
                            Confirm disconnect
                          </Button>
                          <Button
                            onClick={() => setDisconnectConfirm(false)}
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2.5 text-[12px] text-[var(--ds-ink-subtle)]"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => setDisconnectConfirm(true)}
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 px-3 text-[12px] font-medium border border-red-500/40 bg-red-500/10 text-red-400 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/40 hover:!bg-red-600 hover:!text-white hover:!border-red-600 dark:hover:!bg-red-600 dark:hover:!text-white dark:hover:!border-red-600 [&:hover_*]:!text-white rounded-[var(--ds-rounded-md)] transition-colors shadow-xs"
                        >
                          <Unlink className="h-3 w-3" />
                          Disconnect
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
