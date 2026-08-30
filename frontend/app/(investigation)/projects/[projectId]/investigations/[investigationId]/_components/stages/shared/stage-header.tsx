import React from "react";
import { cn } from "@/lib/utils";

export function StageHeader({
  status,
  title,
  description,
}: {
  status?: "completed" | "active" | "waiting" | "failed" | "paused" | "cancelled";
  title: string;
  description: string;
}) {
  const statusConfig: Record<string, { label: string; color: string; pulse?: boolean }> = {
    completed: { label: "Completed", color: "text-emerald-500" },
    active: { label: "Active", color: "text-amber-500", pulse: true },
    waiting: { label: "Waiting for you", color: "text-amber-500", pulse: true },
    failed: { label: "Failed", color: "text-red-500" },
    paused: { label: "Paused", color: "text-[var(--ds-ink-subtle)]" },
    cancelled: { label: "Cancelled", color: "text-[var(--ds-ink-subtle)]" },
  };

  const cfg = status ? (statusConfig[status] ?? statusConfig.active) : null;

  return (
    <div className="flex flex-col gap-1.5 mb-8 md:mb-10">
      {cfg && (
        <div className="flex items-center gap-2">
          {cfg.pulse && (
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          )}
          <span
            className={cn(
              "text-[11px] font-bold tracking-[0.08em] uppercase font-heading",
              cfg.color,
            )}
          >
            {cfg.label}
          </span>
        </div>
      )}
      <h1 className="text-[28px] md:text-[32px] font-semibold text-[var(--ds-ink)] tracking-tight leading-tight font-heading">
        {title}
      </h1>
      <p className="text-[14px] text-[var(--ds-ink-subtle)] leading-relaxed mt-1 max-w-[680px]">
        {description}
      </p>
    </div>
  );
}
