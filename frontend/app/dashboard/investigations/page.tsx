import { Topbar } from "../_components/topbar";

export default function InvestigationsPage() {
  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Investigations" />
      <div className="p-6">
        <p className="text-sm text-muted-foreground">
          Investigations will be listed here.
        </p>
      </div>
    </div>
  );
}
