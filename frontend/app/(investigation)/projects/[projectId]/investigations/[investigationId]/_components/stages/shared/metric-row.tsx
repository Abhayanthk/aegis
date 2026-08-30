import React from "react";
import { cn } from "@/lib/utils";

export function MetricRow({
  label,
  value,
  mono = true,
  className: extraClass,
}: {
  label: string;
  value: string | React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between py-3 border-b border-[var(--ds-hairline)] last:border-0", extraClass)}>
      <span className="text-[13px] text-[var(--ds-ink-subtle)]">{label}</span>
      <span className={cn("text-[13px] text-[var(--ds-ink)]", mono && "font-mono")}>
        {value}
      </span>
    </div>
  );
}
