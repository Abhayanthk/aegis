import { useState, useRef, useCallback } from "react";

export type AgentState = "IDLE" | "RUNNING" | "PAUSED" | "ERROR" | "AWAITING_INPUT" | "COMPLETED";

export interface AgentQuestion {
  questionType: string;
  message: string;
  threadId?: string;
  toolCallId?: string;
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
    
    let currentEventName = "";
    let currentData = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          // Empty line indicates the end of an SSE event
          if (line.trim() === "") {
            if (currentEventName && currentData) {
              try {
                if (currentEventName === "error") {
                   setAgentState("ERROR");
                   try {
                     const errData = JSON.parse(currentData);
                     setError(errData.detail || errData.error || "Unknown Error");
                   } catch {
                     setError(currentData);
                   }
                } else if (currentEventName === "session") {
                   const data = JSON.parse(currentData);
                   setSessionId(data.sessionId);
                } else if (currentEventName === "trueforge") {
                   const data = JSON.parse(currentData);
                   const tfEvent = data.event;
                   
                   if (tfEvent) {
                     if (tfEvent.type === "step.run") {
                       setCurrentStep(tfEvent.stepName || "Processing...");
                     }
                     
                     if (tfEvent.reasoning_content) {
                       setThoughts((prev) => prev + tfEvent.reasoning_content);
                     } else if (tfEvent.content && typeof tfEvent.content === "string" && !tfEvent.type.includes("question")) {
                       setThoughts((prev) => prev + tfEvent.content);
                     }

                     // Handle tool requests (agent questions and approvals)
                     if (tfEvent.type === "user.tool_approval_required") {
                       setQuestion({
                         questionType: "approval",
                         message: tfEvent.message || "Tool approval required",
                         threadId: tfEvent.threadId,
                         toolCallId: tfEvent.toolCallId,
                         raw: tfEvent
                       });
                       setAgentState("AWAITING_INPUT");
                     } else if (tfEvent.type === "user.tool_response_required") {
                       setQuestion({
                         questionType: "response",
                         message: tfEvent.message || "Tool response required",
                         threadId: tfEvent.threadId,
                         toolCallId: tfEvent.toolCallId,
                         raw: tfEvent
                       });
                       setAgentState("AWAITING_INPUT");
                     } else if (tfEvent.type === "model.tool_call" || tfEvent.type === "ask_question") {
                       setQuestion({
                         questionType: tfEvent.questionType || "text",
                         message: tfEvent.message || tfEvent.content || "Agent needs input",
                         raw: tfEvent
                       });
                       setAgentState("AWAITING_INPUT");
                     }
                     
                     if (tfEvent.type === "turn.done") {
                       const status = tfEvent.turn?.state?.status || tfEvent.turn?.status || tfEvent.status || "completed";
                       if (status === "error" || status === "failed" || status === "cancelled") {
                         setAgentState("ERROR");
                       } else {
                         setAgentState("COMPLETED");
                       }
                     }
                   }
                }
              } catch (err) {
                console.warn("Failed to parse SSE JSON:", currentData, err);
              }
            }
            
            // Reset for the next event
            currentEventName = "";
            currentData = "";
            continue;
          }
          
          if (line.startsWith("event: ")) {
            currentEventName = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            currentData += (currentData ? "\n" : "") + line.slice(6).trim();
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

    try {
      const response = await fetch(`${apiUrl}/${sessionId}/cancel`, {
        method: "POST",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}`);
      }
      
      // Only transition to PAUSED and abort stream on success
      setAgentState("PAUSED");
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    } catch (err: any) {
      console.error("Failed to pause on backend", err);
      setError(`Cancellation failed: ${err.message}`);
    }
  }, [apiUrl, sessionId]);

  const resumeAgent = useCallback(async (answer?: string, decision?: "allow" | "deny", reason?: string) => {
    if (!sessionId) return;
    
    setAgentState("RUNNING");
    
    // Capture the current question state to determine endpoint, then clear it
    const currentQuestion = question;
    setQuestion(null);
    setError(null);
    
    abortControllerRef.current = new AbortController();

    try {
      let endpoint = apiUrl;
      let bodyPayload: any = { sessionId, message: answer || "continue" };

      if (currentQuestion?.threadId && currentQuestion?.toolCallId) {
        if (currentQuestion.questionType === "approval") {
          endpoint = `${apiUrl}/${sessionId}/approvals`;
          bodyPayload = {
            approvals: [{
              threadId: currentQuestion.threadId,
              toolCallId: currentQuestion.toolCallId,
              decision: decision || "allow",
              reason: reason || answer
            }]
          };
        } else if (currentQuestion.questionType === "response") {
          endpoint = `${apiUrl}/${sessionId}/tool-responses`;
          bodyPayload = {
            responses: [{
              threadId: currentQuestion.threadId,
              toolCallId: currentQuestion.toolCallId,
              content: answer || ""
            }]
          };
        }
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
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
  }, [apiUrl, sessionId, question]);

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
