import { TrueForge } from "@truefoundry/trueforge-sdk";
import dotenv from "dotenv";

dotenv.config();

const baseUrl = process.env.TRUEFORGE_URL || "http://localhost:8790";
const configuredTimeout = Number(process.env.TRUEFORGE_TIMEOUT_SECONDS ?? "600");

export const trueForgeClient = new TrueForge({
  baseUrl,
  timeoutInSeconds: Number.isFinite(configuredTimeout) && configuredTimeout > 0
    ? configuredTimeout
    : 600,
});

export const AGENT_NAME = process.env.AGENT_NAME || "aegis-orchestrator";
