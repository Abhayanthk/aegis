import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface Investigation {
  id: string;
  title: string;
  project: string;
  severity: "low" | "medium" | "high" | "critical";
  openedAt: string;
}

interface ActiveInvestigationProps {
  investigation: Investigation;
}

export function ActiveInvestigation({ investigation }: ActiveInvestigationProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium">
            {investigation.title}
          </CardTitle>
          <Badge variant="outline" className="capitalize shrink-0">
            {investigation.severity}
          </Badge>
        </div>
        <CardDescription>{investigation.project}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">
          Opened {investigation.openedAt}
        </p>
      </CardContent>
    </Card>
  );
}
