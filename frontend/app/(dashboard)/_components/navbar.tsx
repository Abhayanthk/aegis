"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Bell,
  ChevronRight,
  Download,
  LayoutGrid,
  Pencil,
  Plus,
  Search,
  Share2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
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

  // Build breadcrumb from pathname
  const segments = pathname.split("/").filter(Boolean);
  const currentPage = segments.length > 1 ? segments[segments.length - 1] : "Dashboard";
  const pageTitle = routeTitles[currentPage] ?? currentPage;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-3 pt-3 md:px-4 md:pt-4">
      <header className="flex h-11 items-center rounded-[var(--ds-rounded-lg)] border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)] px-4">
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px]">
        <span className="font-medium text-[var(--ds-ink-subtle)]">AEGIS</span>
        {segments.length > 1 && (
          <>
            <ChevronRight className="h-3 w-3 text-[var(--ds-ink-tertiary)]" />
            <span className="font-medium text-[var(--ds-ink)]">{pageTitle}</span>
          </>
        )}
      </div>

      {/* Center: toolbar actions */}
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

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: utility actions */}
      <div className="flex items-center gap-1">
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
