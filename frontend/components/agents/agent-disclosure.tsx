"use client";

import { motion, AnimatePresence, useReducedMotion, type HTMLMotionProps } from "motion/react";
import React from "react";
import { cn } from "@/lib/utils";

export interface AgentDisclosureProps extends Omit<HTMLMotionProps<"div">, "children"> {
  open?: boolean;
  children?: React.ReactNode;
}

export function AgentDisclosure({
  open = true,
  children,
  className,
  ...props
}: AgentDisclosureProps) {
  const reduce = useReducedMotion() ?? false;

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={
            reduce
              ? { duration: 0 }
              : { duration: 0.32, ease: [0.16, 1, 0.3, 1] }
          }
          className={cn("overflow-hidden", className)}
          {...props}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
