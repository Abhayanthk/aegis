/* eslint-disable @typescript-eslint/no-explicit-any */
import type { InvestigationStatus } from "@/app/(investigation)/_components/investigation-context";

export interface StageContentProps {
  data: any;
  activeStage: string;
  onStageSelect: (stageId: string) => void;
  investigationStatus: InvestigationStatus;
  repairAttempt: number;
  maxAttempts: number;
  onRetry: () => void;
  onReject: () => void;
  onResume?: () => void;
  onPause?: () => void;
  canAdvance?: boolean;
  getStageStatus?: (stageId: string) => "completed" | "active" | "pending" | "failed";
}
