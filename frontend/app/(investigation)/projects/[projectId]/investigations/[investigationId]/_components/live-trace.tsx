import { Activity, Box, Terminal, Bot } from "lucide-react";
import { Sidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
interface LiveTraceProps {
  data: any;
  activeStage: string;
}
export function LiveTrace({ data, activeStage }: LiveTraceProps) {
  const { evidence, sandbox, activeAgent } = data;
  /* Filter evidence... */ return (
    <Sidebar
      side="right"
      collapsible="offcanvas"
      className="!border-l-0 bg-transparent p-3 md:p-4 [&>[data-slot=sidebar-inner]]:bg-transparent !top-[calc(var(--ds-navbar-h))] !h-[calc(100svh-var(--ds-navbar-h))]"
      style={{ "--sidebar-width": "20rem" } as React.CSSProperties}
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-[var(--ds-rounded-xxl)] border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)]">
        {" "}
        <div className="p-4 border-b border-[var(--ds-hairline)] flex items-center justify-between">
          {" "}
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-[var(--ds-ink)] uppercase font-heading">
            {" "}
            <Activity className="h-3.5 w-3.5 text-amber-500" /> Live Trace{" "}
          </div>{" "}
          <span
            suppressHydrationWarning
            className="text-[10px] text-[var(--ds-ink-tertiary)] uppercase font-heading tracking-wider"
          >
            {" "}
            {new Date().toLocaleTimeString()}{" "}
          </span>{" "}
        </div>{" "}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
          {" "}
          {/* Agent Info */}{" "}
          <div className="flex flex-col gap-3">
            {" "}
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider text-[var(--ds-ink-tertiary)] uppercase font-heading">
              {" "}
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />{" "}
              Current Specialist{" "}
            </div>{" "}
            <div className="flex items-center gap-3 p-3 rounded-[var(--ds-rounded-md)] border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)]/50">
              {" "}
              <div className="flex items-center justify-center h-8 w-8 rounded bg-[var(--ds-surface-2)]">
                {" "}
                <Bot className="h-4 w-4 text-[var(--ds-ink-subtle)]" />{" "}
              </div>{" "}
              <div className="flex flex-col">
                {" "}
                <span className="text-[13px] font-medium text-[var(--ds-ink)]">
                  {activeAgent.name}
                </span>{" "}
                <span className="text-[12px] text-[var(--ds-ink-subtle)]">
                  {activeAgent.role}
                </span>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          {/* Sandbox */}{" "}
          <div className="flex flex-col gap-3">
            {" "}
            <div className="text-[10px] font-bold tracking-wider text-[var(--ds-ink-tertiary)] uppercase font-heading">
              {" "}
              Sandbox Environment{" "}
            </div>{" "}
            <div className="flex items-center justify-between p-3 rounded-[var(--ds-rounded-md)] border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)]/50">
              {" "}
              <div className="flex items-center gap-2">
                {" "}
                <Box className="h-4 w-4 text-[var(--ds-ink-subtle)]" />{" "}
                <span className="text-[12px] text-[var(--ds-ink)]">
                  {sandbox.id}
                </span>{" "}
              </div>{" "}
              <div className="text-[12px] text-[var(--ds-ink-subtle)]">
                {" "}
                {Math.floor(sandbox.durationMs / 60000)}m{" "}
                {Math.floor((sandbox.durationMs % 60000) / 1000)}s{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          {/* Decision Evidence */}{" "}
          <div className="flex flex-col gap-3">
            {" "}
            <div className="text-[10px] font-bold tracking-wider text-[var(--ds-ink-tertiary)] uppercase font-heading">
              {" "}
              Decision Evidence{" "}
            </div>{" "}
            <div className="flex flex-col gap-0.5">
              {" "}
              {evidence.map((ev: any, index: number) => (
                <div
                  key={ev.id}
                  className="flex flex-col gap-1.5 p-3 rounded-[var(--ds-rounded-md)] hover:bg-[var(--ds-surface-1)]/50 transition-colors"
                >
                  {" "}
                  <div className="flex items-center justify-between text-[11px] text-[var(--ds-ink-subtle)]">
                    {" "}
                    <span suppressHydrationWarning>
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </span>{" "}
                    <span className="text-[var(--ds-ink-tertiary)]">
                      {ev.agent}
                    </span>{" "}
                  </div>{" "}
                  <div className="flex items-start gap-2">
                    {" "}
                    <Terminal className="h-3.5 w-3.5 text-[var(--ds-ink-tertiary)] mt-0.5 shrink-0" />{" "}
                    <div className="flex flex-col">
                      {" "}
                      <span className="text-[12px] font-medium text-[var(--ds-ink)]">
                        {" "}
                        {ev.event}{" "}
                      </span>{" "}
                      <span className="text-[12px] text-[var(--ds-ink-subtle)]">
                        {" "}
                        {ev.description}{" "}
                      </span>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>
              ))}{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="p-4 border-t border-[var(--ds-hairline)] bg-[var(--ds-surface-1)]/30 text-center">
          {" "}
          <span className="text-[10px] text-[var(--ds-ink-tertiary)]">
            {" "}
            AEGIS exposes decision evidence, not internal reasoning.{" "}
          </span>{" "}
        </div>{" "}
      </div>
    </Sidebar>
  );
}
