import { useState, useRef, useCallback } from "react";

export type AgentState = "IDLE" | "RUNNING" | "PAUSED" | "ERROR" | "AWAITING_INPUT" | "COMPLETED";

export interface AgentQuestion {
  questionType: string;
  message: string;
  threadId?: string;
  toolCallId?: string;
  raw?: any;
}

export interface TraceEntry {
  id: string;
  timestamp: string;
  agent: string;
  event: string;
  description: string;
  raw?: any;
}

export type InvestigationStageId =
  | "repo_context"
  | "repo_analyzer"
  | "baseline_test"
  | "repair"
  | "candidate_test"
  | "verification"
  | "human_gate"
  | "pull_request";

export type StageProgress = Record<InvestigationStageId, "running" | "completed" | "failed" | "awaiting_input">;
export type StageReports = Partial<Record<InvestigationStageId, unknown[]>>;

type AgentProgressEvent = {
  version: 1;
  type: "agent.progress";
  sessionId: string;
  sequenceNumber: string | null;
  occurredAt: string;
  thread: { id: string | null; parentId: string | null; name: string };
  progress: { stage: InvestigationStageId; status: StageProgress[InvestigationStageId]; message: string };
};

type ThreadProgress = {
  stage: InvestigationStageId;
  status: StageProgress[InvestigationStageId];
};

function aggregateStageProgress(threads: Record<string, ThreadProgress>): Partial<StageProgress> {
  const result: Partial<StageProgress> = {};
  const priority = { completed: 0, running: 1, awaiting_input: 2, failed: 3 } as const;

  for (const thread of Object.values(threads)) {
    const previous = result[thread.stage];
    if (!previous || priority[thread.status] >= priority[previous]) {
      result[thread.stage] = thread.status;
    }
  }
  return result;
}

export function useTrueForgeAgent(apiUrl: string = "/api/chat") {
  const [agentState, setAgentState] = useState<AgentState>("IDLE");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [thoughts, setThoughts] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState<AgentQuestion | null>(null);
  
  // New state for structured data and trace logs
  const [investigationData, setInvestigationData] = useState<any>({});
  const [traceLog, setTraceLog] = useState<TraceEntry[]>([]);
  const [currentAgent, setCurrentAgent] = useState<string>("AEGIS Coordinator");
  const [stageProgress, setStageProgress] = useState<Partial<StageProgress>>({});
  const [stageReports, setStageReports] = useState<StageReports>({});
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const threadNamesRef = useRef<Record<string, string>>({ main: "AEGIS Coordinator" });
  const threadProgressRef = useRef<Record<string, ThreadProgress>>({});

  const extractJson = (text: string) => {
    try {
      const match = text.match(/```json\n([\s\S]*?)\n```/);
      if (match && match[1]) {
        return JSON.parse(match[1]);
      }
    } catch (e) {
      // ignore parsing errors
    }
    return null;
  };

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
                } else if (currentEventName === "progress") {
                   const progress = JSON.parse(currentData) as AgentProgressEvent;
                   const { thread, progress: update } = progress;
                   if (thread.id) threadNamesRef.current[thread.id] = thread.name;
                   setCurrentAgent(thread.name);
                   setCurrentStep(update.message);
                   const progressKey = thread.id ?? `session:${update.stage}`;
                   threadProgressRef.current[progressKey] = { stage: update.stage, status: update.status };
                   setStageProgress(aggregateStageProgress(threadProgressRef.current));
                   setTraceLog((previous) => [...previous, {
                     id: `${progress.sequenceNumber ?? Date.now()}-${update.stage}`,
                     timestamp: progress.occurredAt,
                     agent: thread.name,
                     event: progress.type,
                     description: update.message,
                     raw: progress,
                   }]);
                   if (update.status === "awaiting_input") setAgentState("AWAITING_INPUT");
                } else if (currentEventName === "trueforge") {
                   const data = JSON.parse(currentData);
                   const tfEvent = data.event;
                   
                   if (tfEvent) {
                     let logEvent = tfEvent.type;
                     let logDescription = "";

                     const eventAgent = threadNamesRef.current[tfEvent.threadId] || tfEvent.threadId || "AEGIS Coordinator";
                     if (tfEvent.type === "thread.created") {
                       threadNamesRef.current[tfEvent.threadId] = tfEvent.agentInfo.name || tfEvent.title;
                     }

                     if (tfEvent.reasoningContent) {
                       setThoughts((prev) => prev + tfEvent.reasoningContent);
                       logDescription = "Agent reasoning update";
                     } else if (tfEvent.content && typeof tfEvent.content === "string" && !tfEvent.type.includes("question")) {
                       setThoughts((prev) => prev + tfEvent.content);
                       
                       // Try to extract structured data
                       const parsedJson = extractJson(tfEvent.content);
                       if (parsedJson && typeof parsedJson === 'object') {
                         setInvestigationData((prev: any) => ({
                           ...prev,
                           ...parsedJson
                         }));
                         const stage = threadProgressRef.current[tfEvent.threadId]?.stage;
                         if (tfEvent.type === "model.message" && stage) {
                           setStageReports((previous) => ({
                             ...previous,
                             [stage]: [...(previous[stage] ?? []), parsedJson],
                           }));
                         }
                         logDescription = `Generated structured report: ${Object.keys(parsedJson).join(", ")}`;
                       } else {
                         logDescription = "Generated response";
                       }
                     }

                     if (!logDescription && tfEvent.toolCalls?.length) {
                       const toolName = tfEvent.toolCalls[0]?.function?.name || tfEvent.toolCalls[0]?.toolInfo?.name || "tool";
                       logDescription = `Calling ${toolName}`;
                     }

                     // Add to trace log if it's a meaningful event
                     if (logDescription) {
                       setTraceLog(prev => [...prev, {
                         id: Math.random().toString(36).substring(7),
                         timestamp: new Date().toISOString(),
                         agent: eventAgent,
                         event: logEvent,
                         description: logDescription,
                         raw: tfEvent
                       }]);
                     }

                     // Handle tool requests (agent questions and approvals)
                     if (tfEvent.type === "tool.approval_required") {
                       setQuestion({
                         questionType: "approval",
                         message: "Tool approval required",
                         threadId: tfEvent.threadId,
                         toolCallId: tfEvent.toolCalls?.[0]?.id,
                         raw: tfEvent
                       });
                       setAgentState("AWAITING_INPUT");
                     } else if (tfEvent.type === "tool.response_required") {
                       setQuestion({
                         questionType: "response",
                         message: "Tool response required",
                         threadId: tfEvent.threadId,
                         toolCallId: tfEvent.toolCalls?.[0]?.id,
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
                       const status = tfEvent.state?.status || "completed";
                       
                       setTraceLog(prev => [...prev, {
                         id: Math.random().toString(36).substring(7),
                         timestamp: new Date().toISOString(),
                         agent: eventAgent,
                         event: "turn.done",
                         description: status === "completed" ? "Agent stopped (Completed)" : `Agent stopped (${status})`,
                         raw: tfEvent
                       }]);
                       
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

  const startAgent = useCallback(async (repoUrl: string, investigationId?: string) => {
    setAgentState("RUNNING");
    setThoughts("");
    setCurrentStep("");
    setError(null);
    setQuestion(null);
    setTraceLog([]);
    setInvestigationData({});
    setStageProgress({});
    setStageReports({});
    threadNamesRef.current = { main: "AEGIS Coordinator" };
    threadProgressRef.current = {};
    
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl, investigationId }),
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
    if (currentQuestion) {
      for (const [key, thread] of Object.entries(threadProgressRef.current)) {
        if (thread.stage === "human_gate") threadProgressRef.current[key] = { ...thread, status: "completed" };
      }
      setStageProgress(aggregateStageProgress(threadProgressRef.current));
    }
    
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
    sessionId,
    investigationData,
    traceLog,
    currentAgent,
    stageProgress
    ,stageReports
  };
}
