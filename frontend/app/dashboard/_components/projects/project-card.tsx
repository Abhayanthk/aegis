import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "closed";
  updatedAt: string;
}

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{project.name}</CardTitle>
          <Badge variant="outline" className="capitalize shrink-0">
            {project.status}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {project.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">
          Updated {project.updatedAt}
        </p>
      </CardContent>
    </Card>
  );
}
