"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ChevronRight,
  Pause,
  Play,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useInvestigationControls } from "@/app/(investigation)/_components/investigation-context";
import {
  CommandDialog,
  CommandDialogPopup,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandGroupLabel,
  CommandItem,
} from "@/components/ui/command";

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
  const router = useRouter();
  const controls = useInvestigationControls();
  const [searchOpen, setSearchOpen] = useState(false);
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0);
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

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
                    onClick={() => setSearchOpen(true)}
                    aria-label="Search"
                    className="flex h-7 w-7 items-center justify-center rounded-[var(--ds-rounded-md)] text-[var(--ds-ink-subtle)] transition-colors duration-150 hover:bg-[var(--ds-surface-3)] hover:text-[var(--ds-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)]/40"
                  />
                }
              >
                <Search className="h-3.5 w-3.5" />
              </TooltipTrigger>
              <TooltipPopup>
                Search <kbd className="ml-1 inline-flex h-4 items-center gap-1 rounded-[var(--ds-rounded-xs)] border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] px-1 font-mono text-[10px] font-medium text-[var(--ds-ink-subtle)]">
                  <span className="text-[10px]">{isMac ? '⌘' : 'Ctrl+'}</span>K
                </kbd>
              </TooltipPopup>
            </Tooltip>

            <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
              <CommandDialogPopup>
                <Command>
                  <CommandInput placeholder="Type a command or search..." />
                  <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup>
                      <CommandGroupLabel>Navigation</CommandGroupLabel>
                      <CommandItem onSelect={() => { router.push('/projects'); setSearchOpen(false); }}>Projects</CommandItem>
                      <CommandItem onSelect={() => { router.push('/pull-requests'); setSearchOpen(false); }}>Pull Requests</CommandItem>
                      <CommandItem onSelect={() => { router.push('/settings'); setSearchOpen(false); }}>Settings</CommandItem>
                      <CommandItem onSelect={() => { router.push('/github'); setSearchOpen(false); }}>GitHub Connection</CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </CommandDialogPopup>
            </CommandDialog>
          </>
        )}

        <Link href="/projects/new">
          <Button
            size="sm"
            className="h-7 px-3 text-[12px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)]"
          >
            <Plus className="h-3 w-3 mr-1" />
            New
          </Button>
        </Link>
      </div>
    </header>
    </div>
  );
}
