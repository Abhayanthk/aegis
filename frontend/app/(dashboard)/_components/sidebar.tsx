"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  FolderOpen,
  GitBranch,
  GitPullRequest,
  Settings,
  ChevronsUpDown,
  LogOut,
  User,
} from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, MenuTrigger, MenuPopup, MenuItem, MenuSeparator } from "@/components/ui/menu";
import { cn } from "@/lib/utils";
import { Show, SignInButton, useUser, useClerk } from "@clerk/nextjs";

const navGroups = [
  {
    label: "WORKSPACE",
    items: [
      { label: "Projects", href: "/projects", icon: FolderOpen },
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
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();

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
                            ? "text-white"
                            : "text-[var(--ds-ink-subtle)] hover:text-[var(--ds-ink)]",
                        )}
                      >
                        {/* Animated active/hover background */}
                        {active && (
                          <motion.span
                            layoutId="sidebar-active"
                            className="absolute inset-0 rounded-[var(--ds-rounded-lg)] bg-[var(--ds-primary)]"
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
          <Show when="signed-in">
            {user && (
              <Menu>
                <MenuTrigger className="flex w-full items-center justify-between gap-3 rounded-[var(--ds-rounded-lg)] p-1.5 text-left outline-hidden transition-colors hover:bg-[var(--ds-surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)]/40 group data-state-open:bg-[var(--ds-surface-2)]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="h-8 w-8 shrink-0 rounded-[var(--ds-rounded-md)] border border-[var(--ds-hairline)] shadow-sm transition-transform">
                      <AvatarImage src={user.imageUrl} />
                      <AvatarFallback className="bg-[var(--ds-surface-2)] text-[var(--ds-ink-subtle)]">
                        {user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="truncate text-[13.5px] font-medium text-[var(--ds-ink)] group-hover:text-[var(--ds-ink)] transition-colors">
                        {user.fullName || "User"}
                      </span>
                      <span className="truncate text-[11px] text-[var(--ds-ink-subtle)] group-hover:text-[var(--ds-ink-subtle)] transition-colors">
                        {user.username ? `@${user.username}` : user.primaryEmailAddress?.emailAddress}
                      </span>
                    </div>
                  </div>
                  <ChevronsUpDown className="h-4 w-4 shrink-0 text-[var(--ds-ink-subtle)] opacity-50 group-hover:opacity-100 transition-opacity" />
                </MenuTrigger>
                <MenuPopup side="top" align="center" sideOffset={8} className="w-[var(--anchor-width)] min-w-[220px] p-1.5 bg-[var(--ds-canvas)] border border-[var(--ds-hairline)] rounded-[var(--ds-rounded-lg)] shadow-xl">
                  <MenuItem onClick={() => router.push("/settings")} className="flex items-center gap-2.5 rounded-[var(--ds-rounded-md)] px-2.5 py-2 text-[13px] hover:bg-[var(--ds-surface-2)] cursor-pointer outline-none">
                    <Settings className="h-4 w-4 text-[var(--ds-ink-subtle)]" />
                    <span className="font-medium text-[var(--ds-ink)]">Settings</span>
                  </MenuItem>
                  
                  {user.externalAccounts && user.externalAccounts.some(acc => acc.provider === 'oauth_github') && (
                    <>
                      <MenuSeparator className="my-1.5 h-px bg-[var(--ds-hairline)] -mx-1.5" />
                      <MenuItem onClick={() => router.push("/github")} className="flex items-center gap-2.5 rounded-[var(--ds-rounded-md)] px-2.5 py-2 text-[13px] hover:bg-[var(--ds-surface-2)] cursor-pointer outline-none">
                        <GitBranch className="h-4 w-4 text-[var(--ds-ink-subtle)]" />
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-[var(--ds-ink)] leading-none">GitHub</span>
                          <span className="text-[11px] text-[var(--ds-ink-subtle)] leading-none mt-1">Connected</span>
                        </div>
                      </MenuItem>
                    </>
                  )}
                  
                  <MenuItem onClick={() => signOut()} className="flex items-center gap-2.5 rounded-[var(--ds-rounded-md)] px-2.5 py-2 text-[13px] hover:bg-[var(--ds-surface-2)] cursor-pointer outline-none">
                    <LogOut className="h-4 w-4 text-[var(--ds-ink-subtle)]" />
                    <span className="font-medium text-[var(--ds-ink)]">Log out</span>
                  </MenuItem>
                </MenuPopup>
              </Menu>
            )}
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-[var(--ds-rounded-lg)] px-2.5 py-2 text-[13px] font-medium text-[var(--ds-ink-subtle)] hover:bg-[var(--ds-surface-2)] hover:text-[var(--ds-ink)] transition-colors duration-150"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ds-surface-3)] text-[var(--ds-ink)] text-xs font-semibold">
                  ?
                </span>
                <span>Sign In</span>
              </button>
            </SignInButton>
          </Show>
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}
