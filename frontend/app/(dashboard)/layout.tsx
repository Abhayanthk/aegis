import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./_components/sidebar";
import { Navbar } from "./_components/navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-svh bg-[var(--ds-canvas)]"
      style={{ "--ds-navbar-h": "3.75rem" } as React.CSSProperties}
    >
      {/* Fixed floating navbar — independent, always on top */}
      <Navbar />

      {/* Content area below navbar */}
      <div className="pt-[var(--ds-navbar-h)]">
        <SidebarProvider
          style={
            {
              "--sidebar-width": "17.5rem",
            } as React.CSSProperties
          }
        >
          <DashboardSidebar />
          <SidebarInset className="min-w-0 overflow-y-auto bg-transparent">
            {children}
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  );
}
