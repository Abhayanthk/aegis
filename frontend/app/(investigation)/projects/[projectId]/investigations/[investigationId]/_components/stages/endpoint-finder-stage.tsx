/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EndpointFinderStage({ data, onStageSelect }: { data: any; onStageSelect: (id: string) => void }) {
  const target = data?.target;
  const discovery = data?.discovery;
  const diagnosis = data?.diagnosis;

  // Extract discovered routes from real investigation data
  const healthMethod = "GET";
  const healthPath = discovery?.healthEndpoint?.replace("GET ", "") || data?.configuration?.healthProbe?.endpoint || "/healthz";

  const targetMethod = target?.method || "POST";
  const targetPath = target?.endpoint || "/orders/process";

  // Build the list of real routes found in discovery/target/routes
  const rawRoutes: Array<{ method: string; path: string; description?: string; isProbe?: boolean }> = [
    ...(data?.routes || []),
    { method: healthMethod, path: healthPath, description: "Health probe endpoint", isProbe: true },
    { method: targetMethod, path: targetPath, description: target?.description || "Order processing endpoint" },
  ];

  // Deduplicate by method + path
  const uniqueRoutes = rawRoutes.filter(
    (route, idx, arr) => arr.findIndex((r) => r.method === route.method && r.path === route.path) === idx
  );

  // Selected route state (defaults to configured target)
  const [selectedRoute, setSelectedRoute] = useState<{ method: string; path: string; description?: string }>({
    method: targetMethod,
    path: targetPath,
    description: target?.description || "Order processing endpoint",
  });

  // Why this target explanation from real data
  const whyReason =
    discovery?.suspiciousPaths?.[0]?.reason ||
    diagnosis?.primaryFinding?.cause ||
    diagnosis?.primaryFinding?.title ||
    target?.description ||
    "Selected as the most relevant testable surface.";

  // Context metadata
  const entrypoint = discovery?.entrypoint;
  const relevantFile = discovery?.suspiciousPaths?.[0]?.file;
  const workload = data?.configuration?.workload;

  // Operation if available
  const operation =
    diagnosis?.primaryFinding?.cause?.includes("calculateRiskScore") ||
    discovery?.suspiciousPaths?.[0]?.reason?.includes("risk scoring")
      ? "calculateRiskScore()"
      : undefined;

  // Empty state handling
  if (uniqueRoutes.length === 0) {
    return (
      <div className="flex flex-col max-w-[820px] py-12">
        <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-2">
          Endpoints Not Found
        </span>
        <h1 className="text-[24px] font-semibold text-[var(--ds-ink)] font-heading mb-2">
          No API routes identified
        </h1>
        <p className="text-[13px] text-[var(--ds-ink-subtle)]">
          AEGIS could not identify a suitable API route in this repository.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col max-w-[840px]"
    >
      {/* Title & Description (No status badge) */}
      <div className="flex flex-col gap-1.5 mb-8">
        <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
          Endpoint Discovery
        </span>
        <h1 className="text-[26px] md:text-[30px] font-semibold text-[var(--ds-ink)] tracking-tight leading-tight font-heading">
          Endpoint Finder
        </h1>
        <p className="text-[13px] text-[var(--ds-ink-subtle)] leading-relaxed max-w-[680px]">
          AEGIS searched the repository for API routes and selected the most relevant test surface.
        </p>
      </div>

      {/* Discovered Routes */}
      <div className="flex flex-col mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
            Discovered Routes
          </span>
          <span className="text-[11px] font-mono text-[var(--ds-ink-subtle)]">
            {uniqueRoutes.length} {uniqueRoutes.length === 1 ? "route" : "routes"} found
          </span>
        </div>
        <div className="flex flex-col rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] overflow-hidden divide-y divide-[var(--ds-hairline)]">
          {uniqueRoutes.map((route, i) => {
            const isSelected = selectedRoute.path === route.path && selectedRoute.method === route.method;
            return (
              <motion.button
                key={i}
                type="button"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.04 }}
                onClick={() =>
                  setSelectedRoute({
                    method: route.method,
                    path: route.path,
                    description: route.description,
                  })
                }
                className={cn(
                  "flex items-center justify-between px-4 py-3 text-left transition-colors w-full",
                  isSelected
                    ? "bg-[var(--ds-surface-2)]/80 text-[var(--ds-ink)]"
                    : "hover:bg-[var(--ds-surface-1)] text-[var(--ds-ink-subtle)] hover:text-[var(--ds-ink)]"
                )}
              >
                <div className="flex items-center gap-3 font-mono text-[13px]">
                  <span
                    className={cn(
                      "text-[11px] font-bold uppercase w-12 shrink-0",
                      route.method === "POST" ? "text-amber-500" : "text-blue-400"
                    )}
                  >
                    {route.method}
                  </span>
                  <span
                    className={cn(
                      "font-medium",
                      isSelected ? "text-[var(--ds-ink)]" : "text-[var(--ds-ink-subtle)]"
                    )}
                  >
                    {route.path}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {route.description && (
                    <span className="text-[11px] text-[var(--ds-ink-tertiary)] hidden sm:inline">
                      {route.description}
                    </span>
                  )}
                  {isSelected ? (
                    <span className="text-[10px] font-bold text-[var(--ds-primary)] bg-[var(--ds-primary)]/10 px-2 py-0.5 rounded uppercase font-heading">
                      Selected
                    </span>
                  ) : (
                    <span className="text-[11px] text-[var(--ds-ink-tertiary)] hover:text-[var(--ds-ink-subtle)]">
                      Select
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Selected Target */}
      <div className="flex flex-col mb-6">
        <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-2.5">
          Selected Target
        </span>
        <motion.div
          layout
          className="flex flex-col p-4 rounded-[8px] border border-[var(--ds-hairline-strong)] bg-[var(--ds-surface-1)]"
        >
          <div className="flex items-center gap-3 font-mono text-[14px]">
            <span className="text-[11px] font-bold uppercase text-[var(--ds-primary)]">
              {selectedRoute.method}
            </span>
            <span className="text-[var(--ds-ink)] font-semibold">
              {selectedRoute.path}
            </span>
          </div>
          {selectedRoute.description && (
            <p className="text-[12px] text-[var(--ds-ink-subtle)] mt-1.5 leading-relaxed">
              {selectedRoute.description}
            </p>
          )}
        </motion.div>
      </div>

      {/* Why This Target */}
      <div className="flex flex-col mb-6">
        <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-2.5">
          Why This Target
        </span>
        <div className="p-4 rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)]">
          <p className="text-[13px] text-[var(--ds-ink)] leading-relaxed">
            {whyReason}
          </p>
        </div>
      </div>

      {/* Context Metadata */}
      {(entrypoint || relevantFile || operation || workload) && (
        <div className="flex flex-col rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-canvas)] p-4 md:p-5 mb-8">
          <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading mb-3">
            Context
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px]">
            {entrypoint && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                  Entrypoint
                </span>
                <span className="font-mono text-[var(--ds-ink)] truncate">{entrypoint}</span>
              </div>
            )}
            {relevantFile && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                  Relevant File
                </span>
                <span className="font-mono text-[var(--ds-ink)] truncate">{relevantFile}</span>
              </div>
            )}
            {operation && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                  Operation
                </span>
                <span className="font-mono text-[var(--ds-ink)] truncate">{operation}</span>
              </div>
            )}
            {workload && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold tracking-widest text-[var(--ds-ink-tertiary)] uppercase font-heading">
                  Configured Workload
                </span>
                <span className="font-mono text-[var(--ds-ink)]">
                  {workload.requestsPerSecond} req/s · {workload.type}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Primary Action Button */}
      <div className="pt-0">
        <Button
          onClick={() => onStageSelect("baseline_test")}
          className="h-9 px-5 text-[13px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] gap-2 border-0 shadow-sm"
        >
          Establish baseline <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}
