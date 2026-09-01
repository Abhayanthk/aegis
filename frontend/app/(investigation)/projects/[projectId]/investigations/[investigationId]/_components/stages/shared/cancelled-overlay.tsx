import React from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";

export function CancelledOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="flex items-center justify-center h-12 w-12 rounded-full border border-[var(--ds-hairline)] bg-[var(--ds-surface-2)] mb-6">
        <X className="h-5 w-5 text-[var(--ds-ink-subtle)]" />
      </div>
      <h2 className="text-[20px] font-semibold text-[var(--ds-ink)] font-heading mb-2">
        Investigation cancelled
      </h2>
      <p className="text-[14px] text-[var(--ds-ink-subtle)] max-w-[400px]">
        No changes were written to GitHub.
      </p>
    </motion.div>
  );
}
