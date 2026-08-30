"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { TbCircleDotted } from "react-icons/tb";
import { Check } from "lucide-react";
import { GoDotFill } from "react-icons/go";
import { motion, Variants } from "motion/react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";

type Stage = {
  id: string;
  name: string;
  description: string;
};

const stages: Stage[] = [
  { id: "discover", name: "Discover", description: "Repository mapped" },
  { id: "reproduce", name: "Reproduce", description: "Failure reproduced" },
  { id: "measure", name: "Measure", description: "Baseline captured" },
  { id: "diagnose", name: "Diagnose", description: "Cause isolated" },
  { id: "repair", name: "Repair", description: "Minimal patch prepared" },
  { id: "validation", name: "Local validation", description: "Patch checked" },
  { id: "verify", name: "Verify", description: "Same workload rerun" },
  { id: "approval", name: "Approval", description: "Human gate approved" },
  { id: "pull_request", name: "Pull request", description: "Branch and commit pending" },
  { id: "qodo_review", name: "Qodo review", description: "Automated review pending" },
];

interface InvestigationSidebarProps {
  activeStage: string;
  onStageSelect: (stageId: string) => void;
  getStageStatus: (stageId: string) => "completed" | "active" | "pending";
}

export function InvestigationSidebar({ activeStage, onStageSelect, getStageStatus }: InvestigationSidebarProps) {
  const parentvariant: Variants = {
    open: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.15,
      },
    },
    close: {
      transition: {
        staggerChildren: 0.075,
        delayChildren: 0.15,
      },
    },
  };

  const stagevariant: Variants = {
    open: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: { duration: 0.3 },
    },
    close: {
      opacity: 0,
      filter: "blur(10px)",
      y: 5,
      transition: { duration: 0.3 },
    },
  };

  const iconvariant: Variants = {
    open: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3 },
    },
    close: {
      opacity: 0,
      scale: 0.85,
      transition: { duration: 0.3 },
    },
  };

  const descvariant: Variants = {
    open: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: { duration: 0.3 },
    },
    close: {
      opacity: 0,
      filter: "blur(5px)",
      y: 10,
      transition: { duration: 0.3 },
    },
  };

  const circlevariant: Variants = {
    open: {
      rotate: 360,
      transition: {
        ease: "linear",
        duration: 2.5,
        repeat: Number.POSITIVE_INFINITY,
      },
    },
    close: {
      rotate: 0,
      transition: {
        ease: "easeInOut",
        duration: 0.1,
        repeat: 0,
      },
    },
  };

  return (
    <Sidebar
      collapsible="offcanvas"
      className="!border-r-0 bg-transparent p-3 md:p-4 [&>[data-slot=sidebar-inner]]:bg-transparent !top-[calc(var(--ds-navbar-h))] !h-[calc(100svh-var(--ds-navbar-h))]"
      style={{ "--sidebar-width": "18.5rem" } as React.CSSProperties}
    >
      <div
        className={cn(
          "relative flex h-full flex-col overflow-hidden",
          "rounded-[var(--ds-rounded-xxl)] border border-[var(--ds-hairline)]",
          "bg-[var(--ds-surface-1)] text-white group",
          "clbeam-container",
        )}
      >
        {/* Header */}

        {/* Content */}
        <SidebarContent className="relative flex-1 overflow-hidden z-10">
          <div className="relative h-full w-full overflow-y-auto px-4 md:px-5">
            {/* Banner + Stage list wrapper — beam SVG spans both */}
            <div className="relative">
              {/* Alert Banner */}
              <div className="mt-4 py-3">
                <div className="relative z-[10] flex items-center justify-center gap-2 rounded-[6px] bg-neutral-50 p-0.5 shadow-md dark:bg-black">
                  <div className="flex h-full w-full items-center justify-between gap-3 rounded-[4px] bg-neutral-100 p-3 dark:bg-neutral-800">
                    <div className="flex items-center justify-center gap-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ ease: "linear", duration: 2.5, repeat: Infinity }}
                        className="h-4 w-4"
                      >
                        <TbCircleDotted className="h-full w-full text-primary" />
                      </motion.div>
                      <div className="flex flex-col">
                        <p className="font-mono text-[10px] text-neutral-600 transition-all duration-300 group-hover:text-neutral-900 dark:text-neutral-400 dark:group-hover:text-neutral-100">
                          Reliability run
                        </p>
                        <p className="font-mono text-[9px] text-neutral-500">
                          POST /orders/process
                        </p>
                      </div>
                    </div>
                    <p className="text-[10px] text-neutral-500">
                      {new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* SVG Beam — starts from banner bottom-left, angles right to icon column, then goes straight down */}
              <svg
                className="absolute inset-0 h-full w-full pointer-events-none z-[5] overflow-visible"
                fill="none"
              >
                <path
                  d="M 16 68 L 16 82 L 36 100 L 36 3000"
                  stroke="rgba(163,163,163,0.35)"
                  strokeWidth="1"
                  className="dark:[stroke:rgba(115,115,115,0.5)]"
                />
              </svg>

              {/* Investigation Stages List — staggered reveal on mount */}
              <motion.div
                className="relative z-10 mt-6 flex flex-col gap-9 pl-6"
                variants={parentvariant}
                initial="close"
                animate="open"
              >
                {stages.map(({ id, name, description }) => {
                  const status = getStageStatus(id);
                  const isClickable = status === "completed" || status === "active";
                  const isSelected = activeStage === id;

                  return (
                    <motion.button
                      key={id}
                      variants={stagevariant}
                      disabled={!isClickable}
                      onClick={() => isClickable && onStageSelect(id)}
                      className={cn(
                        "flex w-full justify-start text-left",
                        status === "pending" && "opacity-50 cursor-not-allowed",
                        isClickable && "cursor-pointer",
                        isSelected && "opacity-100",
                      )}
                    >
                      <div className="relative mr-2 mt-1.5 h-6 w-6 shrink-0 z-10">
                        {/* Base dot — visible for pending stages */}
                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/10 dark:bg-white/10">
                          <GoDotFill className="h-2.5 w-2.5 text-neutral-400 dark:text-neutral-500" />
                        </div>

                        {/* Completed — tick icon */}
                        {status === "completed" && (
                          <motion.div
                            variants={iconvariant}
                            className="absolute inset-0 flex items-center justify-center rounded-full bg-white p-1"
                          >
                            <Check className="h-3.5 w-3.5 text-neutral-100 dark:text-neutral-800" strokeWidth={3} />
                          </motion.div>
                        )}

                        {/* Active — spinning dotted circle */}
                        {status === "active" && (
                          <motion.div
                            className="absolute inset-0 flex items-center justify-center rounded-full bg-[var(--ds-surface-1)]"
                            variants={iconvariant}
                          >
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ ease: "linear", duration: 2.5, repeat: Infinity }}
                            >
                              <TbCircleDotted className="h-5 w-5 text-[var(--ds-warning)]" />
                            </motion.div>
                          </motion.div>
                        )}
                      </div>

                      <div className="flex flex-col items-start justify-center gap-1 p-1">
                        <motion.h2
                          variants={stagevariant}
                          className={cn(
                            "text-[10px] font-semibold sm:text-xs",
                            status === "completed"
                              ? "text-neutral-800 dark:text-neutral-200"
                              : status === "active"
                                ? "text-neutral-800 dark:text-neutral-200"
                                : "text-neutral-500 dark:text-neutral-500",
                          )}
                        >
                          {name}
                        </motion.h2>
                        <motion.p
                          variants={descvariant}
                          className={cn(
                            "font-mono text-[9px]",
                            "text-neutral-500",
                          )}
                        >
                          {description}
                        </motion.p>
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            </div>
          </div>
        </SidebarContent>
      </div>
    </Sidebar>
  );
}
