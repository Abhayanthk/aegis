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
  registerCallbacks: (callbacks: { pauseAgent: () => void; resumeAgent: () => void; stopAgent: () => void }) => void;
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
  const callbacksRef = React.useRef<{ pauseAgent?: () => void; resumeAgent?: () => void; stopAgent?: () => void }>({});

  const registerCallbacks = useCallback((callbacks: { pauseAgent: () => void; resumeAgent: () => void; stopAgent: () => void }) => {
    callbacksRef.current = callbacks;
  }, []);

  const onPause = useCallback(() => {
    setStatus("pausing");
    if (callbacksRef.current.pauseAgent) {
      callbacksRef.current.pauseAgent();
    } else {
      setTimeout(() => setStatus("paused"), 800);
    }
  }, []);

  const onResume = useCallback(() => {
    setStatus("running");
    if (callbacksRef.current.resumeAgent) {
      callbacksRef.current.resumeAgent();
    }
  }, []);

  const onRequestCancel = useCallback(() => {
    setShowCancelDialog(true);
  }, []);

  const onConfirmCancel = useCallback(() => {
    setShowCancelDialog(false);
    setStatus("cancelling");
    if (callbacksRef.current.stopAgent) {
      callbacksRef.current.stopAgent();
    } else {
      setTimeout(() => setStatus("cancelled"), 800);
    }
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
    registerCallbacks,
  };

  return (
    <InvestigationControlsContext.Provider value={value}>
      {children}
    </InvestigationControlsContext.Provider>
  );
}
