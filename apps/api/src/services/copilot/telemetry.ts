interface CopilotTelemetryEvent {
  requestId: string;
  protocol: string;
  chain: string;
  contextAgeMs?: number;
  modelLatencyMs?: number;
  fallbackUsed?: boolean;
  status: "ok" | "fallback" | "error";
}

export function logCopilotTelemetry(event: CopilotTelemetryEvent): void {
  console.info("[copilot-telemetry]", JSON.stringify(event));
}

