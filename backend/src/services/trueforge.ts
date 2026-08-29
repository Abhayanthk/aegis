import { TrueForge } from "@truefoundry/trueforge-sdk";
import dotenv from "dotenv";

dotenv.config();

const baseUrl = process.env.TRUEFORGE_URL || "http://localhost:8790";
// The TrueForge documentation and the user setup indicated auth is disabled locally.
const apiKey = process.env.TRUEFORGE_API_KEY || ""; 

export const trueForgeClient = new TrueForge({
  baseUrl,
  token: apiKey || undefined,
});

export const AGENT_NAME = process.env.AGENT_NAME || "aegis-orchestrator";
