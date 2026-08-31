import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function WhyThisRepairDisclosure({
  reason,
  strategy,
}: {
  reason?: string;
  strategy?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col mt-3">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--ds-ink-subtle)] hover:text-[var(--ds-ink)] transition-colors self-start py-1"
      >
        <span>Why this repair?</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform duration-200", isOpen && "rotate-180 text-[var(--ds-ink)]")}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-[8px] border border-[var(--ds-hairline)] bg-[var(--ds-surface-1)]/60 text-[12px] text-[var(--ds-ink-subtle)] leading-relaxed mt-2 flex flex-col gap-2">
              <p>
                {reason ||
                  "The synchronous risk calculation was identified as blocking the Node.js main thread during the baseline workload."}
              </p>
              {strategy && (
                <p className="text-[var(--ds-ink)] font-mono text-[11px]">
                  Strategy: {strategy} — delegates CPU-bound execution to a worker boundary without modifying the public endpoint contract.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
