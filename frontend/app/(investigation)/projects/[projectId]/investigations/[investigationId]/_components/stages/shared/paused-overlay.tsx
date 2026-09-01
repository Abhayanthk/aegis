import React from "react";
import { motion } from "motion/react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PausedOverlay({ onResume }: { onResume?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="flex items-center justify-center h-12 w-12 rounded-full border border-[var(--ds-hairline)] bg-[var(--ds-surface-2)] mb-6">
        <Pause className="h-5 w-5 text-[var(--ds-ink-subtle)]" />
      </div>
      <h2 className="text-[20px] font-semibold text-[var(--ds-ink)] font-heading mb-2">
        Investigation paused
      </h2>
      <p className="text-[14px] text-[var(--ds-ink-subtle)] mb-8 max-w-[400px]">
        AEGIS is waiting to resume. All progress, metrics, and trace history are preserved.
      </p>
      {onResume && (
        <Button
          onClick={onResume}
          className="h-9 px-5 text-[13px] font-medium bg-[var(--ds-primary)] text-[var(--ds-on-primary)] hover:bg-[var(--ds-primary-hover)] border-0 gap-2"
        >
          <Play className="h-3.5 w-3.5" />
          Resume investigation
        </Button>
      )}
    </motion.div>
  );
}
