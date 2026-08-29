import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./_components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <main className="flex flex-1 flex-col min-w-0">{children}</main>
    </SidebarProvider>
  );
}
