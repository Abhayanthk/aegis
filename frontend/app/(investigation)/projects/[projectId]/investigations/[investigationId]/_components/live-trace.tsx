import React, { useState, useEffect, useRef } from "react";
import { Activity, Box, Terminal, Bot } from "lucide-react";
import { Sidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Citations, type CitationItem } from "@/components/agents/citations";

interface TraceEntry {
  id: string;
  timestamp: string;
  agent: string;
  event: string;
  description: string;
  raw?: any;
}

interface LiveTraceProps {
  data: any;
  activeStage: string;
  traceLog?: TraceEntry[];
  currentAgent?: string;
  agentState?: string;
  thoughts?: string;
  currentStep?: string;
}

export function LiveTrace({ data, activeStage, traceLog = [], currentAgent = "AEGIS Coordinator", agentState, thoughts, currentStep }: LiveTraceProps) {
  const [timeString, setTimeString] = useState<string>("");
  const traceEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      setTimeString(new Date().toLocaleTimeString());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (traceEndRef.current) {
      traceEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [traceLog]);

  const citationItems: CitationItem[] = traceLog.map((ev, index) => {
    let formattedContent: React.ReactNode;
    if (ev.raw?.reasoningContent) {
      formattedContent = <span className="text-amber-600/90 dark:text-amber-400/90">{ev.raw.reasoningContent}</span>;
    } else if (ev.raw?.content && typeof ev.raw.content === "string") {
      try {
        const parsed = JSON.parse(ev.raw.content);
        if (parsed?.response?.result) {
          formattedContent = <span>{`Exit Code: ${parsed.response.exitCode}\n\n${parsed.response.result}`}</span>;
        } else {
          formattedContent = <span>{JSON.stringify(parsed, null, 2)}</span>;
        }
      } catch {
        formattedContent = <span>{ev.raw.content}</span>;
      }
    } else if (ev.raw) {
      formattedContent = <span>{JSON.stringify(ev.raw, null, 2)}</span>;
    }

    return {
      id: ev.id,
      title: ev.description || ev.event,
      domain: ev.agent,
      content: formattedContent,
    };
  });


  return (
    <Sidebar
      side="right"
      collapsible="offcanvas"
      className="!border-l-0 bg-transparent p-3 md:p-4 [&>[data-slot=sidebar-inner]]:bg-transparent !top-[calc(var(--ds-navbar-h))] !h-[calc(100svh-var(--ds-navbar-h))]"
      style={{ "--sidebar-width": "20rem" } as React.CSSProperties}
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-[var(--ds-rounded-xxl)] border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)]">
        <div className="p-4 border-b border-[var(--ds-hairline)] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-[var(--ds-ink)] uppercase font-heading">
            <Activity className={cn("h-3.5 w-3.5", agentState === "RUNNING" ? "text-amber-500" : "text-[var(--ds-ink-tertiary)]")} /> Live Trace
          </div>
          <span
            suppressHydrationWarning
            className="text-[10px] text-[var(--ds-ink-tertiary)] uppercase font-heading tracking-wider"
          >
            {timeString || "14:09:20"}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
          {/* Agent Info */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider text-[var(--ds-ink-tertiary)] uppercase font-heading">
              <span className={cn("h-2 w-2 rounded-full", agentState === "RUNNING" ? "bg-amber-500 animate-pulse" : "bg-[var(--ds-ink-tertiary)]")} />
              Current Specialist
            </div>
            <div className="flex items-center gap-3 p-3 rounded-[var(--ds-rounded-md)] border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)]/50">
              <div className="flex items-center justify-center h-8 w-8 rounded bg-[var(--ds-surface-2)]">
                <Bot className="h-4 w-4 text-[var(--ds-ink-subtle)]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-medium text-[var(--ds-ink)]">
                  {currentAgent}
                </span>
                <span className="text-[12px] text-[var(--ds-ink-subtle)]">
                  {agentState === "RUNNING" ? currentStep || "Processing..." : agentState || "Idle"}
                </span>
              </div>
            </div>
          </div>
          {/* Sandbox */}
          {data?.sandbox && (
            <div className="flex flex-col gap-3">
              <div className="text-[10px] font-bold tracking-wider text-[var(--ds-ink-tertiary)] uppercase font-heading">
                Sandbox Environment
              </div>
              <div className="flex items-center justify-between p-3 rounded-[var(--ds-rounded-md)] border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)]/50">
                <div className="flex items-center gap-2">
                  <Box className="h-4 w-4 text-[var(--ds-ink-subtle)]" />
                  <span className="text-[12px] text-[var(--ds-ink)]">
                    {data.sandbox.id || "aegis-sandbox-1"}
                  </span>
                </div>
                {data.sandbox.durationMs && (
                  <div className="text-[12px] text-[var(--ds-ink-subtle)]">
                    {Math.floor(data.sandbox.durationMs / 60000)}m{" "}
                    {Math.floor((data.sandbox.durationMs % 60000) / 1000)}s
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Decision Evidence */}
          <div className="flex flex-col gap-3">
            <Citations
              title="Decision Evidence"
              citations={citationItems}
              defaultOpen
              idPrefix="trace"
            />
            <div ref={traceEndRef} />
          </div>
        </div>
        <div className="p-4 border-t border-[var(--ds-hairline)] bg-[var(--ds-surface-1)]/30 text-center">
          <span className="text-[10px] text-[var(--ds-ink-tertiary)]">
            AEGIS exposes decision evidence, not internal reasoning.
          </span>
        </div>
      </div>
    </Sidebar>
  );
}
