"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Bell,
  ChevronRight,
  Download,
  LayoutGrid,
  Pause,
  Pencil,
  Play,
  Plus,
  Search,
  Share2,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInvestigationControls } from "@/app/(investigation)/_components/investigation-context";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";

const toolbarActions = [
  { icon: Pencil, label: "Edit" },
  { icon: Download, label: "Export" },
  { icon: Zap, label: "Actions" },
] as const;

// Map route segments to readable titles
const routeTitles: Record<string, string> = {
  dashboard: "Dashboard",
  projects: "Projects",
  investigations: "Investigations",
  "pull-requests": "Pull Requests",
  github: "GitHub",
  settings: "Settings",
};

export function Navbar() {
  const pathname = usePathname();
  const controls = useInvestigationControls();

  // Build breadcrumb from pathname
  const segments = pathname.split("/").filter(Boolean);
  
  let breadcrumbContent = null;
  
  const isInvestigation = segments[0] === "projects" && segments.length >= 4 && segments[2] === "investigations";

  if (segments[0] === "projects" && segments.length >= 2 && segments[1] !== "new") {
    const projectName = segments[1];
    
    // Check if we're in an investigation route
    if (isInvestigation) {
      breadcrumbContent = (
        <>
          <ChevronRight className="h-3 w-3 text-[var(--ds-ink-tertiary)]" />
          <Link href="/projects" className="font-medium text-[var(--ds-ink-subtle)] hover:text-[var(--ds-ink)] transition-colors">
            Projects
          </Link>
          <ChevronRight className="h-3 w-3 text-[var(--ds-ink-tertiary)]" />
          <span className="font-medium text-[var(--ds-ink)]">
            Investigations
          </span>
        </>
      );
    } else {
      // Just project overview
      breadcrumbContent = (
        <>
          <ChevronRight className="h-3 w-3 text-[var(--ds-ink-tertiary)]" />
          <span className="font-medium text-[var(--ds-ink)]">
            {projectName}
          </span>
        </>
      );
    }
  } else {
    const currentPage = segments.length > 1 ? segments[segments.length - 1] : segments.length === 1 ? segments[0] : "Dashboard";
    const pageTitle = routeTitles[currentPage] ?? currentPage;
    
    if (segments.length > 0) {
      breadcrumbContent = (
        <>
          <ChevronRight className="h-3 w-3 text-[var(--ds-ink-tertiary)]" />
          <span className="font-medium text-[var(--ds-ink)] capitalize">{pageTitle}</span>
        </>
      );
    }
  }

  // Determine if investigation controls should be visible
  const showInvestigationControls = isInvestigation && controls && (
    controls.status === "running" || controls.status === "pausing" || controls.status === "paused"
  );

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-3 pt-3 md:px-4 md:pt-4">
      <header className="flex h-11 items-center rounded-[var(--ds-rounded-lg)] border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] px-4">
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px]">
        <Link href="/projects" className="font-medium text-[var(--ds-ink-subtle)] hover:text-[var(--ds-ink)] transition-colors">
          AEGIS
        </Link>
        {breadcrumbContent}
      </div>

      {/* Center: toolbar actions (hidden during investigation for minimal focus) */}
      {!isInvestigation && (
        <div className="ml-8 flex items-center gap-0.5">
          {toolbarActions.map(({ icon: Icon, label }) => (
            <Tooltip key={label}>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    aria-label={label}
                    className="flex h-7 w-7 items-center justify-center rounded-[var(--ds-rounded-md)] text-[var(--ds-ink-subtle)] transition-colors duration-150 hover:bg-[var(--ds-surface-3)] hover:text-[var(--ds-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)]/40"
                  />
                }
              >
                <Icon className="h-3.5 w-3.5" />
              </TooltipTrigger>
              <TooltipPopup>{label}</TooltipPopup>
            </Tooltip>
          ))}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Investigation controls: Pause / Cancel */}
      {showInvestigationControls && (
        <div className="flex items-center gap-1.5 mr-2">
          {controls.isPaused ? (
            <Button
              onClick={controls.onResume}
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 px-2.5 text-[12px] font-medium border border-[var(--ds-hairline)] bg-[var(--ds-surface-2)] text-[var(--ds-ink-subtle)] hover:!bg-white hover:!text-black hover:!border-white dark:hover:!bg-white dark:hover:!text-black dark:hover:!border-white [&:hover_*]:!text-black transition-colors shadow-xs"
            >
              <Play className="h-3 w-3 text-emerald-500" />
              Resume
            </Button>
          ) : (
            <Button
              onClick={controls.onPause}
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 px-2.5 text-[12px] font-medium border border-[var(--ds-hairline)] bg-[var(--ds-surface-2)] text-[var(--ds-ink-subtle)] hover:!bg-white hover:!text-black hover:!border-white dark:hover:!bg-white dark:hover:!text-black dark:hover:!border-white [&:hover_*]:!text-black transition-colors shadow-xs"
            >
              <Pause className="h-3 w-3" />
              Pause
            </Button>
          )}
          <Button
            onClick={controls.onRequestCancel}
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 px-2.5 text-[12px] font-medium border border-red-500/40 bg-red-500/10 text-red-400 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/40 hover:!bg-red-600 hover:!text-white hover:!border-red-600 dark:hover:!bg-red-600 dark:hover:!text-white dark:hover:!border-red-600 [&:hover_*]:!text-white transition-colors shadow-xs"
          >
            <X className="h-3 w-3" />
            Cancel
          </Button>
        </div>
      )}

      {/* Right: utility actions */}
      <div className="flex items-center gap-1">
        {!isInvestigation && (
          <>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    aria-label="Search"
                    className="flex h-7 w-7 items-center justify-center rounded-[var(--ds-rounded-md)] text-[var(--ds-ink-subtle)] transition-colors duration-150 hover:bg-[var(--ds-surface-3)] hover:text-[var(--ds-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)]/40"
                  />
                }
              >
                <Search className="h-3.5 w-3.5" />
              </TooltipTrigger>
              <TooltipPopup>Search</TooltipPopup>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    aria-label="Notifications"
                    className="flex h-7 w-7 items-center justify-center rounded-[var(--ds-rounded-md)] text-[var(--ds-ink-subtle)] transition-colors duration-150 hover:bg-[var(--ds-surface-3)] hover:text-[var(--ds-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)]/40"
                  />
                }
              >
                <Bell className="h-3.5 w-3.5" />
              </TooltipTrigger>
              <TooltipPopup>Notifications</TooltipPopup>
            </Tooltip>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2.5 text-[12px] font-medium text-[var(--ds-ink-subtle)] hover:bg-[var(--ds-surface-3)] hover:text-[var(--ds-ink)]"
            >
              <Share2 className="h-3 w-3" />
              Share
            </Button>
          </>
        )}

        <Button
          size="sm"
          className="h-7 px-3 text-[12px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)]"
        >
          <Plus className="h-3 w-3 mr-1" />
          New
        </Button>

        <div className="mx-1 h-4 w-px bg-[var(--ds-hairline)]" />

        <Show when="signed-out">
          <SignInButton mode="modal">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-[12px] font-medium text-[var(--ds-ink-subtle)] hover:bg-[var(--ds-surface-3)] hover:text-[var(--ds-ink)]"
            >
              Sign In
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button
              size="sm"
              className="h-7 px-3 text-[12px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)]"
            >
              Sign Up
            </Button>
          </SignUpButton>
        </Show>

        <Show when="signed-in">
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "h-7 w-7",
              },
            }}
          />
        </Show>
      </div>
    </header>
    </div>
  );
}
