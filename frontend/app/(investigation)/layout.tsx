import { Navbar } from "@/app/(dashboard)/_components/navbar";

export default function InvestigationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-svh bg-[var(--ds-canvas)]"
      style={{ "--ds-navbar-h": "3.75rem" } as React.CSSProperties}
    >
      <Navbar />
      <div className="pt-[var(--ds-navbar-h)] h-[100svh]">{children}</div>
    </div>
  );
}
