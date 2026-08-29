import { Topbar } from "../_components/topbar";

export default function PullRequestsPage() {
  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Pull Requests" />
      <div className="p-6">
        <p className="text-sm text-muted-foreground">
          Pull requests will be listed here.
        </p>
      </div>
    </div>
  );
}
