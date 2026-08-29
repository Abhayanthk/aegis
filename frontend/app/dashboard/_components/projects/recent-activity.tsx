import { Separator } from "@/components/ui/separator";

export interface ActivityItem {
  id: string;
  description: string;
  timestamp: string;
}

interface RecentActivityProps {
  items: ActivityItem[];
}

export function RecentActivity({ items }: RecentActivityProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">No recent activity.</p>
    );
  }

  return (
    <ul className="space-y-0">
      {items.map((item, index) => (
        <li key={item.id}>
          <div className="flex items-start justify-between gap-4 py-3">
            <p className="text-sm text-foreground">{item.description}</p>
            <span className="text-xs text-muted-foreground shrink-0">
              {item.timestamp}
            </span>
          </div>
          {index < items.length - 1 && <Separator />}
        </li>
      ))}
    </ul>
  );
}
