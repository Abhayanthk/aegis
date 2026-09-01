import { Request, Response, Router } from "express";
import { TrueForgeApi } from "@truefoundry/trueforge-sdk";
import { AGENT_NAME, trueForgeClient } from "../services/trueforge";

const router = Router();

type StreamEvent = {
  data: TrueForgeApi.TurnStreamingEvent;
  id?: string;
};

type StreamWithMetadata = {
  withMetadata(): AsyncIterable<StreamEvent>;
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

  req.once("close", onClose);

  try {
    for await (const { data: event, id } of stream.withMetadata()) {
      if (disconnected) break;
      writeSse(res, "trueforge", { sessionId, sequenceNumber: id ?? null, event }, id);
    }
  } finally {
    req.off("close", onClose);
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

// Helper to construct the system prompt based on user's requirements
const constructPrompt = (repoUrl: string) => {
  return `Use the aegis-runtime-reliability-v3 skill on ${repoUrl}

Before you take any action or launch any subagents, you MUST read the newly updated skill instructions at \`/opt/tf/skills/aegis-runtime-reliability-v3/SKILL.md\`. I have updated the State Machine and the Startup Checklist, and you must follow them strictly:

1. **Parallel Execution:** You must launch the \`Repository Analyst\` and \`Runtime Profiler preparation\` subagents in parallel as your very first action.
2. **Data Handoff:** Wait for both to complete. DO NOT analyze the repository yourself. Extract the Analyst's structured JSON report verbatim and pass it directly into the \`Runtime Profiler baseline\` subagent prompt. 
3. **Target Dependencies:** Remember that target dependencies are now installed by the Baseline subagent, using the package manager identified in the Analyst Report.
4. **Batched Fixes:** When you reach the DIAGNOSE phase, you MUST instruct the Repairer to apply Batched Fixes for ALL suspect bottlenecks found by the Analyst simultaneously. Do not limit it to just one endpoint.
5. **Full Autonomy:** Do NOT ask me for permission to repair. Let the Repairer edit the code and let the Profiler run the Candidate test completely autonomously. You may ONLY use the ask_question tool at the very end of the pipeline when the candidate is verified (the final REVIEW gate).`;
};

router.post("/", async (req: Request, res: Response) => {
  const { message, sessionId, repoUrl } = req.body as { message?: unknown; sessionId?: unknown; repoUrl?: unknown };

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
