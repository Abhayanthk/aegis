import { Request, Response, Router } from "express";
import { TrueForgeApi } from "@truefoundry/trueforge-sdk";
import { AGENT_NAME, trueForgeClient } from "../services/trueforge";
import { dbService } from "../services/database";

const router = Router();

type StreamEvent = {
  data: TrueForgeApi.TurnStreamingEvent;
  id?: string;
};

type StreamWithMetadata = {
  withMetadata(): AsyncIterable<StreamEvent>;
};

type InvestigationStage =
  | "repo_context"
  | "repo_analyzer"
  | "endpoint_finder"
  | "baseline_test"
  | "repair"
  | "candidate_test"
  | "verification"
  | "human_gate"
  | "pull_request";

type ProgressStatus = "running" | "completed" | "failed" | "awaiting_input";

/**
 * Stable, UI-facing projection of a TrueForge event. The raw event remains in
 * the `trueforge` SSE event; consumers should use this event for progress UI.
 */
type AgentProgressEvent = {
  version: 1;
  type: "agent.progress";
  sessionId: string;
  sequenceNumber: string | null;
  occurredAt: string;
  thread: { id: string | null; parentId: string | null; name: string };
  progress: { stage: InvestigationStage; status: ProgressStatus; message: string };
};

type ApprovalInput = {
  threadId?: unknown;
  toolCallId?: unknown;
  decision?: unknown;
  reason?: unknown;
};

type ToolResponseInput = {
  threadId?: unknown;
  toolCallId?: unknown;
  content?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function setSseHeaders(res: Response): void {
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
}

function writeSse(res: Response, event: string, data: unknown, id?: string): void {
  if (id) res.write(`id: ${id}\n`);
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function stageForAgent(name: string): InvestigationStage {
  const value = name.toLowerCase();
  if (value.includes("analyst") || value.includes("repository")) return "repo_analyzer";
  if (value.includes("endpoint") || value.includes("route")) return "endpoint_finder";
  if (value.includes("candidate")) return "candidate_test";
  if (value.includes("verif")) return "verification";
  if (value.includes("repair") || value.includes("diagnos")) return "repair";
  if (value.includes("pull request") || value.includes("pull-request") || value.startsWith("pr ")) return "pull_request";
  if (value.includes("review") || value.includes("human") || value.includes("question")) return "human_gate";
  if (value.includes("profiler") || value.includes("baseline")) return "baseline_test";
  return "repo_context";
}

function normalizeProgress(
  sessionId: string,
  event: TrueForgeApi.TurnStreamingEvent,
  sequenceNumber?: string,
): AgentProgressEvent | null {
  const occurredAt = "createdAt" in event && event.createdAt ? event.createdAt : new Date().toISOString();
  const threadId = "threadId" in event ? event.threadId ?? null : null;
  const parentId = "parent" in event && event.parent ? event.parent.threadId : null;
  let name = threadId === "main" || threadId === null ? "AEGIS Coordinator" : "Agent";
  let status: ProgressStatus | null = null;
  let message = "";

  if (event.type === "thread.created") {
    name = event.agentInfo.name || event.title;
    status = "running";
    message = `${name} started`;
  } else if (event.type === "thread.done") {
    name = event.title || name;
    status = event.state.status === "error" ? "failed" : "completed";
    message = status === "failed" && event.state.status === "error"
      ? `${name} failed: ${event.state.error}`
      : `${name} ${status}`;
  } else if (event.type === "sandbox.created") {
    status = "running";
    message = "Sandbox ready";
  } else if (event.type === "tool.approval_required" || event.type === "tool.response_required") {
    status = "awaiting_input";
    name = "Human review";
    message = "Agent is waiting for input";
  } else if (event.type === "turn.done") {
    status = event.state.status === "error" || event.state.status === "cancelled" ? "failed" : "completed";
    const detail = event.state.status === "error"
      ? event.state.message
      : event.state.status === "cancelled"
        ? event.state.reason
        : null;
    message = detail ? `Investigation ${status}: ${detail}` : `Investigation ${status}`;
  }

  if (!status) return null;
  return {
    version: 1,
    type: "agent.progress",
    sessionId,
    sequenceNumber: sequenceNumber ?? null,
    occurredAt,
    thread: { id: threadId, parentId, name },
    progress: { stage: status === "awaiting_input" ? "human_gate" : stageForAgent(name), status, message },
  };
}

async function forwardStream(
  req: Request,
  res: Response,
  sessionId: string,
  stream: StreamWithMetadata,
): Promise<void> {
  let disconnected = false;
  const onClose = () => {
    disconnected = true;
  };

  // `req.close` fires after Express has consumed the request body; it is not a
  // reliable signal that the SSE client went away. Listen to the response and
  // an actual request abort so a long-running TrueForge turn keeps forwarding.
  res.once("close", onClose);
  req.once("aborted", onClose);

  try {
    for await (const { data: event, id } of stream.withMetadata()) {
      if (disconnected) break;
      console.log(`[TrueForge] [Session ${sessionId}] Event: ${event.type}`);
      writeSse(res, "trueforge", { sessionId, sequenceNumber: id ?? null, event }, id);
      const progress = normalizeProgress(sessionId, event, id);
      if (progress) {
        console.log(`[TrueForge] [Session ${sessionId}] Progress: ${progress.progress.stage} ${progress.progress.status}`);
        writeSse(res, "progress", progress);
      }
    }
  } finally {
    res.off("close", onClose);
    req.off("aborted", onClose);
    if (!disconnected && !res.writableEnded) res.end();
  }
}

function streamError(res: Response, error: unknown): void {
  const detail = error instanceof Error ? error.message : "Unknown TrueForge error";

  if (!res.headersSent) {
    res.status(502).json({ error: "TrueForge request failed", detail });
    return;
  }

  writeSse(res, "error", { error: "TrueForge request failed", detail });
  res.end();
}

async function streamTurn(
  req: Request,
  res: Response,
  sessionId: string,
  input: TrueForgeApi.TurnInputItem[] | undefined,
): Promise<void> {
  setSseHeaders(res);
  writeSse(res, "session", { sessionId });

  try {
    const stream = await trueForgeClient.sessions.createTurnStream(sessionId, { input });
    await forwardStream(req, res, sessionId, stream);
  } catch (error) {
    streamError(res, error);
  }
}

const constructPrompt = (repoUrl: string) => {
  return `Use the aegis-runtime-reliability-v3 skill on ${repoUrl}.

Before taking any action or launching subagents, read \`/opt/tf/skills/aegis-runtime-reliability-v3/SKILL.md\` and follow its current state machine, parallel-execution rules, and approval gates exactly. The skill is the source of truth.`;
};

router.post("/", async (req: Request, res: Response) => {
  const { message, sessionId, repoUrl, investigationId } = req.body as { message?: unknown; sessionId?: unknown; repoUrl?: unknown; investigationId?: unknown };

  const prompt = isNonEmptyString(repoUrl) ? constructPrompt(repoUrl) : message;

  if (!isNonEmptyString(prompt)) {
    return res.status(400).json({ error: "Message or repoUrl is required" });
  }
  if (prompt.length > 100_000) {
    return res.status(400).json({ error: "Message exceeds the 100,000 character limit" });
  }
  if (sessionId !== undefined && !isNonEmptyString(sessionId)) {
    return res.status(400).json({ error: "sessionId must be a non-empty string" });
  }

  try {
    const activeSessionId = sessionId ?? (await trueForgeClient.sessions.create({
      agent: { name: AGENT_NAME },
    })).data.id;

    if (investigationId && isNonEmptyString(investigationId as string)) {
      dbService.updateInvestigation(investigationId as string, activeSessionId, 'running', null);
    }

    await streamTurn(req, res, activeSessionId, [
      { type: "user.message", content: prompt.trim() },
    ]);
  } catch (error) {
    streamError(res, error);
  }
});

router.post("/:sessionId/approvals", async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const approvals = req.body?.approvals;

  if (!isNonEmptyString(sessionId)) {
    return res.status(400).json({ error: "sessionId must be a non-empty string" });
  }
  if (!Array.isArray(approvals) || approvals.length === 0) {
    return res.status(400).json({ error: "approvals must be a non-empty array" });
  }

  const input: TrueForgeApi.UserToolApprovalEvent[] = [];
  for (const approval of approvals) {
    if (!isRecord(approval)) {
      return res.status(400).json({ error: "Each approval must be an object" });
    }
    const inputApproval = approval as ApprovalInput;
    if (!isNonEmptyString(inputApproval.threadId) || !isNonEmptyString(inputApproval.toolCallId)) {
      return res.status(400).json({ error: "Each approval requires threadId and toolCallId" });
    }
    if (inputApproval.decision === "allow") {
      input.push({ type: "user.tool_approval", threadId: inputApproval.threadId, toolCallId: inputApproval.toolCallId, approval: { status: "allow" } });
    } else if (inputApproval.decision === "deny") {
      input.push({
        type: "user.tool_approval",
        threadId: inputApproval.threadId,
        toolCallId: inputApproval.toolCallId,
        approval: { status: "deny", ...(isNonEmptyString(inputApproval.reason) ? { reason: inputApproval.reason } : {}) },
      });
    } else {
      return res.status(400).json({ error: "Each approval decision must be allow or deny" });
    }
  }

  await streamTurn(req, res, sessionId, input);
});

router.post("/:sessionId/tool-responses", async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const responses = req.body?.responses;

  if (!isNonEmptyString(sessionId)) {
    return res.status(400).json({ error: "sessionId must be a non-empty string" });
  }
  if (!Array.isArray(responses) || responses.length === 0) {
    return res.status(400).json({ error: "responses must be a non-empty array" });
  }

  const input: TrueForgeApi.UserToolResponseEvent[] = [];
  for (const response of responses) {
    if (!isRecord(response)) {
      return res.status(400).json({ error: "Each response must be an object" });
    }
    const inputResponse = response as ToolResponseInput;
    if (!isNonEmptyString(inputResponse.threadId) || !isNonEmptyString(inputResponse.toolCallId) || typeof inputResponse.content !== "string") {
      return res.status(400).json({ error: "Each response requires threadId, toolCallId, and string content" });
    }
    input.push({
      type: "user.tool_response",
      threadId: inputResponse.threadId,
      toolCallId: inputResponse.toolCallId,
      content: inputResponse.content,
    });
  }

  await streamTurn(req, res, sessionId, input);
});

router.post("/:sessionId/cancel", async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  if (!isNonEmptyString(sessionId)) {
    return res.status(400).json({ error: "sessionId must be a non-empty string" });
  }

  try {
    await trueForgeClient.sessions.cancel(sessionId);
    res.status(200).json({ sessionId, cancelled: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown TrueForge error";
    res.status(502).json({ error: "Unable to cancel TrueForge session", detail });
  }
});

router.get("/:sessionId/turns/:turnId/stream", async (req: Request, res: Response) => {
  const { sessionId, turnId } = req.params;
  const afterSequenceNumber = req.query.afterSequenceNumber;
  let parsedSequenceNumber: number | undefined;

  if (!isNonEmptyString(sessionId) || !isNonEmptyString(turnId)) {
    return res.status(400).json({ error: "sessionId and turnId must be non-empty strings" });
  }
  if (typeof afterSequenceNumber === "string") {
    const value = Number(afterSequenceNumber);
    if (!Number.isInteger(value) || value < 0) {
      return res.status(400).json({ error: "afterSequenceNumber must be a non-negative integer" });
    }
    parsedSequenceNumber = value;
  } else if (afterSequenceNumber !== undefined) {
    return res.status(400).json({ error: "afterSequenceNumber must be a non-negative integer" });
  }

  setSseHeaders(res);
  writeSse(res, "session", { sessionId, resumedTurnId: turnId });

  try {
    const stream = await trueForgeClient.sessions.subscribeToTurn(
      sessionId,
      turnId,
      { afterSequenceNumber: parsedSequenceNumber },
    );
    await forwardStream(req, res, sessionId, stream);
  } catch (error) {
    streamError(res, error);
  }
});

export default router;
