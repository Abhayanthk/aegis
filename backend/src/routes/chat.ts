import { Router, Request, Response } from "express";
import { trueForgeClient, AGENT_NAME } from "../services/trueforge";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Set headers for Server-Sent Events (SSE)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Create a new session bound to the agent
    const session = await trueForgeClient.sessions.create({
      agent: { name: AGENT_NAME }
    });
    console.log("Session response:", JSON.stringify(session, null, 2));

    const sessionId = (session as any).data?.id || (session as any).id;

    // Create a streaming turn within that session
    const stream = await trueForgeClient.sessions.createTurnStream(sessionId, {
      input: [
        { type: "user.message", content: message }
      ]
    });

    // Iterate over the stream events and send them to the client
    for await (const event of stream) {
      // Stringify the event if it's an object, or send directly if it's a string
      const data = typeof event === "string" ? event : JSON.stringify(event);
      res.write(`data: ${data}\n\n`);
    }

    // Signal the end of the stream
    res.write("event: end\ndata: [DONE]\n\n");
    res.end();
  } catch (error: any) {
    console.error("Error executing agent:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "An error occurred while communicating with the agent." });
    } else {
      res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
});

export default router;
