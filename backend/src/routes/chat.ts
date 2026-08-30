import { Router, Request, Response } from "express";
import { trueForgeClient, AGENT_NAME } from "../services/trueforge";

const router = Router();

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

// Helper to format TrueForge raw events to UI-friendly JSON
const formatEvent = (event: any) => {
  if (typeof event === "string") {
    try {
      event = JSON.parse(event);
    } catch (e) {
      return { type: "unknown", raw: event };
    }
  }
  
  // Basic mapping of TrueForge SDK event types to UI-friendly ones
  const type = event.type || "unknown";
  
  if (type.includes("thought")) {
    return { type: "thought", content: event.content || event.thought || "" };
  } else if (type.includes("step") || type.includes("action")) {
    return { type: "step_start", step: event.stepName || event.action || "Processing step..." };
  } else if (type.includes("question") || type.includes("ask")) {
    return { type: "question", questionType: event.questionType || "text", message: event.message || event.content || "Agent needs input" };
  }
  
  return { type: "stream_event", data: event };
};

// Helper to stream a turn
const streamTurn = async (res: Response, stream: any) => {
  try {
    for await (const event of stream) {
      const formatted = formatEvent(event);
      res.write(`data: ${JSON.stringify(formatted)}\n\n`);
    }
    res.write("event: end\ndata: [DONE]\n\n");
    res.end();
  } catch (error: any) {
    console.error("Error in stream:", error);
    res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
};

router.post("/", async (req: Request, res: Response) => {
  try {
    const { repoUrl, message } = req.body;

    // Use provided repoUrl to construct the complex prompt, or fallback to direct message
    const prompt = repoUrl ? constructPrompt(repoUrl) : message;

    if (!prompt) {
      return res.status(400).json({ error: "repoUrl or message is required" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const session = await trueForgeClient.sessions.create({
      agent: { name: AGENT_NAME }
    });

    const sessionId = (session as any).data?.id || (session as any).id;
    
    // 1. Emit the session ID to the frontend first so it can pause/resume
    res.write(`data: ${JSON.stringify({ type: "session_created", sessionId })}\n\n`);

    const stream = await trueForgeClient.sessions.createTurnStream(sessionId, {
      input: [
        { type: "user.message", content: prompt }
      ]
    });

    await streamTurn(res, stream);
  } catch (error: any) {
    console.error("Error executing agent:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "An error occurred while communicating with the agent." });
    }
  }
});

// POST /pause - Pause the current turn for a session
router.post("/pause", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "sessionId is required" });

    // Using cancel to stop the current running turn
    await trueForgeClient.sessions.cancel(sessionId);
    res.json({ success: true, message: "Agent paused successfully" });
  } catch (error: any) {
    console.error("Error pausing agent:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /continue - Resume a session, optionally with an answer/message
router.post("/continue", async (req: Request, res: Response) => {
  try {
    const { sessionId, answer } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const stream = await trueForgeClient.sessions.createTurnStream(sessionId, {
      input: answer ? [{ type: "user.message", content: answer } as any] : []
    });

    await streamTurn(res, stream);
  } catch (error: any) {
    console.error("Error continuing agent:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "An error occurred while continuing the agent." });
    }
  }
});

export default router;
