"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type AgentCodeLanguage = "typescript" | "javascript" | "json" | "python" | "text";

export interface AgentCodeLineProps {
  code: string;
  tokens?: any[];
  className?: string;
}

export function AgentCodeLine({ code, className }: AgentCodeLineProps) {
  return <span className={cn("whitespace-pre", className)}>{code}</span>;
}

export function useAgentCodeTokens(code: string, language: AgentCodeLanguage = "typescript") {
  return null;
}
