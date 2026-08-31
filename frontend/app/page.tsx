import { CursorDotBackground } from "@/components/ui/cursor-dot-background";
import { Shield } from "lucide-react";
import { AuthWidget } from "./_components/auth-widget";

export default function AuthPage() {
  return (
    <div className="relative min-h-screen bg-[var(--ds-canvas)] flex flex-col items-center justify-center overflow-hidden">
      <CursorDotBackground />

      {/* Subtle gradient glow behind the card */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="h-[600px] w-[600px] rounded-full bg-[var(--ds-primary)]/5 blur-[120px]" />
      </div>

      {/* Brand mark */}
      <div className="relative z-10 mb-8 flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-[var(--ds-rounded-xl)] bg-[var(--ds-surface-2)] border border-[var(--ds-hairline)] shadow-lg">
          <Shield className="h-6 w-6 text-[var(--ds-primary)]" />
        </div>
        <div className="text-center">
          <h1 className="text-[22px] font-semibold tracking-tight text-[var(--ds-ink)]">
            Aegis
          </h1>
          <p className="mt-0.5 text-[13px] text-[var(--ds-ink-subtle)]">
            Runtime reliability, engineered.
          </p>
        </div>
      </div>

      {/* Clerk auth widget */}
      <div className="relative z-10">
        <AuthWidget />
      </div>
    </div>
  );
}