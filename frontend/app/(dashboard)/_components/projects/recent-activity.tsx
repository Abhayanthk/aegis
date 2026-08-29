import { CheckCircle2, CircleDashed, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActivityItem {
  id: string;
  projectId: string;
  projectName: string;
  type: "verified" | "investigating" | "failed" | "pull_request" | string;
  title: string;
  time: string;
}

interface RecentActivityProps {
  items: ActivityItem[];
}

export function RecentActivity({ items }: RecentActivityProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-[var(--ds-ink-tertiary)] py-4">
        No recent activity.
      </p>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "verified":
      case "pull_request":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "investigating":
      default:
        return <CircleDashed className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="group relative flex gap-3">
          <div className="flex flex-col items-center gap-1.5 pt-0.5">
            <div className="relative z-10 flex h-4 w-4 items-center justify-center bg-[var(--ds-surface-1)]">
              {getIcon(item.type)}
            </div>
            {/* Connecting line (could use a pseudo-element, but div works) */}
            <div className="w-[1px] flex-1 bg-[var(--ds-hairline)] group-last:bg-transparent" />
          </div>
          
          <div className="flex flex-col pb-4 gap-0.5 min-w-0">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[13px] font-medium text-[var(--ds-ink)] truncate">
                {item.projectName}
              </span>
              <span className="text-[11px] text-[var(--ds-ink-tertiary)] shrink-0 whitespace-nowrap">
                {item.time}
              </span>
            </div>
            <p className="text-[12px] text-[var(--ds-ink-subtle)] line-clamp-2">
              {item.title}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
