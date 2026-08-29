"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  Ellipsis,
  FolderOpen,
  GitBranch,
  GitPullRequest,
  Microscope,
  Settings,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sidebar, SidebarContent, SidebarFooter } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "WORKSPACE",
    items: [
      { label: "Projects", href: "/projects", icon: FolderOpen },
      { label: "Investigations", href: "/investigations", icon: Microscope },
      { label: "Pull Requests", href: "/pull-requests", icon: GitPullRequest },
    ],
  },
  {
    label: "CONNECT",
    items: [
      { label: "GitHub", href: "/github", icon: GitBranch },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
] as const;

export function DashboardSidebar() {
  const pathname = usePathname();

  const isActiveRoute = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <Sidebar
      collapsible="offcanvas"
      className="!border-r-0 bg-transparent p-3 md:p-4 [&>[data-slot=sidebar-inner]]:bg-transparent !top-[calc(var(--ds-navbar-h))] !h-[calc(100svh-var(--ds-navbar-h))]"
      style={
        {
          "--sidebar-width": "17.5rem",
        } as React.CSSProperties
      }
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-[var(--ds-rounded-xxl)] border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)]">

        <SidebarContent className="relative flex-1 px-3 py-5 md:px-3.5">
          <nav className="flex h-full flex-col gap-6" aria-label="Primary">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ds-ink-tertiary)]">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isActiveRoute(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-[var(--ds-rounded-lg)] px-3 py-2 text-[14px] outline-hidden transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)]/40",
                          active
                            ? "text-[var(--ds-ink)]"
                            : "text-[var(--ds-ink-subtle)] hover:text-[var(--ds-ink)]",
                        )}
                      >
                        {/* Animated active/hover background */}
                        {active && (
                          <motion.span
                            layoutId="sidebar-active"
                            className="absolute inset-0 rounded-[var(--ds-rounded-lg)] bg-[var(--ds-surface-3)]"
                            transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
                          />
                        )}

                        <span className="relative z-[1] flex h-5 w-5 shrink-0 items-center justify-center">
                          <Icon className="h-[16px] w-[16px]" />
                        </span>
                        <span className="relative z-[1] min-w-0 flex-1 truncate font-medium">
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Spacer pushes user area to bottom */}
            <div className="flex-1" />
          </nav>
        </SidebarContent>

        <SidebarFooter className="relative px-3.5 py-3">
          <motion.div
            className="group flex items-center gap-3 rounded-[var(--ds-rounded-lg)] px-1 py-1 transition-colors duration-150 cursor-pointer hover:bg-[var(--ds-surface-2)]"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            <Avatar className="h-8 w-8 border border-[var(--ds-hairline-strong)]">
              <AvatarImage
                src="https://github.com/shadcn.png"
                alt="Abhishek"
              />
              <AvatarFallback className="bg-[var(--ds-surface-3)] text-[var(--ds-ink)] text-[11px]">
                AB
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--ds-ink)]">
              Abhishek
            </span>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--ds-rounded-md)] text-[var(--ds-ink-tertiary)] opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:bg-[var(--ds-surface-3)] hover:text-[var(--ds-ink-subtle)]">
              <Ellipsis className="h-4 w-4" />
            </span>
          </motion.div>
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}
