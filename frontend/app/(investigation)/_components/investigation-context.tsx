"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type InvestigationStatus =
  | "running"
  | "pausing"
  | "paused"
  | "cancelling"
  | "cancelled"
  | "completed"
  | "failed";

interface InvestigationControlsState {
  status: InvestigationStatus;
  isRunning: boolean;
  isPaused: boolean;
  isCancelled: boolean;
  showCancelDialog: boolean;
  onPause: () => void;
  onResume: () => void;
  onRequestCancel: () => void;
  onConfirmCancel: () => void;
  onDismissCancel: () => void;
  setStatus: (status: InvestigationStatus) => void;
}

const InvestigationControlsContext =
  createContext<InvestigationControlsState | null>(null);

export function useInvestigationControls() {
  const ctx = useContext(InvestigationControlsContext);
  if (!ctx) {
    // Return a no-op default so the navbar doesn't break outside investigations
    return null;
  }
  return ctx;
}

export function InvestigationControlsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<InvestigationStatus>("running");
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const onPause = useCallback(() => {
    setStatus("pausing");
    // Simulate pausing transition
    setTimeout(() => setStatus("paused"), 800);
  }, []);

  const onResume = useCallback(() => {
    setStatus("running");
  }, []);

  const onRequestCancel = useCallback(() => {
    setShowCancelDialog(true);
  }, []);

  const onConfirmCancel = useCallback(() => {
    setShowCancelDialog(false);
    setStatus("cancelling");
    setTimeout(() => setStatus("cancelled"), 800);
  }, []);

  const onDismissCancel = useCallback(() => {
    setShowCancelDialog(false);
  }, []);

  const value: InvestigationControlsState = {
    status,
    isRunning: status === "running",
    isPaused: status === "paused" || status === "pausing",
    isCancelled: status === "cancelled" || status === "cancelling",
    showCancelDialog,
    onPause,
    onResume,
    onRequestCancel,
    onConfirmCancel,
    onDismissCancel,
    setStatus,
  };

  return (
    <InvestigationControlsContext.Provider value={value}>
      {children}
    </InvestigationControlsContext.Provider>
  );
}
