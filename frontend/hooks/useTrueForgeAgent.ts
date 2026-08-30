import { useState, useRef, useCallback } from "react";

export type AgentState = "IDLE" | "RUNNING" | "PAUSED" | "ERROR" | "AWAITING_INPUT" | "COMPLETED";

export interface AgentQuestion {
  questionType: string;
  message: string;
  raw?: any;
}

export function useTrueForgeAgent(apiUrl: string = "http://localhost:3001/api/chat") {
  const [agentState, setAgentState] = useState<AgentState>("IDLE");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [thoughts, setThoughts] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState<AgentQuestion | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const processStream = async (response: Response) => {
    if (!response.body) return;
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep the last incomplete line in the buffer
        
        for (const line of lines) {
          if (line.startsWith("event: end")) {
            setAgentState("COMPLETED");
            continue;
          }
          if (line.startsWith("event: error")) {
             setAgentState("ERROR");
             const data = line.replace("data: ", "").trim();
             if(data) {
                try { setError(JSON.parse(data).error); } catch(e) { setError(data); }
             }
             continue;
          }
          
          if (line.startsWith("data: ") && !line.includes("[DONE]")) {
            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;
            
            try {
              const event = JSON.parse(dataStr);
              
              if (event.type === "session_created") {
                setSessionId(event.sessionId);
              } else if (event.type === "step_start") {
                setCurrentStep(event.step);
              } else if (event.type === "thought") {
                setThoughts((prev) => prev + event.content);
              } else if (event.type === "question") {
                setQuestion({ questionType: event.questionType, message: event.message, raw: event });
                setAgentState("AWAITING_INPUT");
              } else if (event.type === "stream_event") {
                // Handle raw TrueForge events that bypassed the format
                const raw = event.data;
                if (raw?.reasoningContent) {
                   setThoughts((prev) => prev + raw.reasoningContent);
                }
                if (raw?.content) {
                   setThoughts((prev) => prev + raw.content);
                }
                if (raw?.type === "step.run") {
                   setCurrentStep(raw.stepName || "Processing...");
                }
                if (raw?.type === "ask_question") {
                   setQuestion({ 
                     questionType: raw.questionType || "text", 
                     message: raw.message || raw.content || "Agent needs input", 
                     raw 
                   });
                   setAgentState("AWAITING_INPUT");
                }
              }
            } catch (err) {
              console.warn("Failed to parse SSE JSON:", dataStr, err);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
         setError(err.message || "Stream disconnected unexpectedly");
         setAgentState("ERROR");
      }
    } finally {
      reader.releaseLock();
    }
  };

  const startAgent = useCallback(async (repoUrl: string) => {
    setAgentState("RUNNING");
    setThoughts("");
    setCurrentStep("");
    setError(null);
    setQuestion(null);
    
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) throw new Error("Failed to start agent");
      
      await processStream(response);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message);
        setAgentState("ERROR");
      }
    }
  }, [apiUrl]);

  const pauseAgent = useCallback(async () => {
    if (!sessionId) return;
    
    // Cancel the frontend stream listening
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setAgentState("PAUSED");

    try {
      await fetch(`${apiUrl}/pause`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
    } catch (err: any) {
      console.error("Failed to pause on backend", err);
    }
  }, [apiUrl, sessionId]);

  const resumeAgent = useCallback(async (answer?: string) => {
    if (!sessionId) return;
    
    setAgentState("RUNNING");
    setQuestion(null);
    setError(null);
    
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${apiUrl}/continue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, answer }),
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) throw new Error("Failed to resume agent");
      
      await processStream(response);
    } catch (err: any) {
       if (err.name !== 'AbortError') {
        setError(err.message);
        setAgentState("ERROR");
      }
    }
  }, [apiUrl, sessionId]);

  const stopAgent = useCallback(async () => {
     pauseAgent();
     setAgentState("IDLE");
  }, [pauseAgent]);

  return {
    startAgent,
    pauseAgent,
    resumeAgent,
    stopAgent,
    agentState,
    currentStep,
    thoughts,
    question,
    error,
    sessionId
  };
}
