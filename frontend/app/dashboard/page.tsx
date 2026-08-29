import { Topbar } from "./_components/topbar";
import { Search } from "./_components/search";
import { ProjectGrid } from "./_components/projects/project-grid";
import { RecentActivity } from "./_components/projects/recent-activity";
import { ActiveInvestigation } from "./_components/projects/active-investigation";

// Placeholder data — replace with real data fetching
const PROJECTS = [
  {
    id: "1",
    name: "Aegis Core",
    description: "Security analysis engine and investigation runtime.",
    status: "active" as const,
    updatedAt: "2 hours ago",
  },
];

const INVESTIGATIONS = [
  {
    id: "1",
    title: "CVE-2024-1234 exposure in dependency chain",
    project: "Aegis Core",
    severity: "high" as const,
    openedAt: "yesterday",
  },
];

const ACTIVITY = [
  {
    id: "1",
    description: "Investigation #1 opened in Aegis Core",
    timestamp: "2h ago",
  },
  {
    id: "2",
    description: "Pull request #42 linked to investigation",
    timestamp: "5h ago",
  },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Dashboard" />

      <div className="flex flex-col gap-8 p-6">
        {/* Search */}
        <Search />

        {/* Projects overview */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Projects
          </h2>
          <ProjectGrid projects={PROJECTS} />
        </section>

        {/* Active investigations */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Active Investigations
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {INVESTIGATIONS.map((inv) => (
              <ActiveInvestigation key={inv.id} investigation={inv} />
            ))}
          </div>
        </section>

        {/* Recent activity */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-1">
            Recent Activity
          </h2>
          <RecentActivity items={ACTIVITY} />
        </section>
      </div>
    </div>
  );
}
