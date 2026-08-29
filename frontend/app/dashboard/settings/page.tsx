import { Topbar } from "../_components/topbar";

export default function SettingsPage() {
  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Settings" />
      <div className="p-6">
        <p className="text-sm text-muted-foreground">
          Settings will be configured here.
        </p>
      </div>
    </div>
  );
}
