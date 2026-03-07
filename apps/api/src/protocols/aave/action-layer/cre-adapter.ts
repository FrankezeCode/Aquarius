/**
 * Action Layer — CRE Adapter (Infrastructure)
 *
 * Bounded context: Aave / Action Layer
 *
 * This adapter forwards risk-action intents from Aquarius into a
 * Confidential HTTP workflow boundary. It is intentionally non-blocking:
 * the caller returns immediately while dispatch happens asynchronously.
 *
 * DDD role: Infrastructure Adapter — translates action-layer commands
 * into transport-specific calls for confidential workflow execution.
 *
 * What happens (step-by-step):
 *   1) Escalation service calls triggerCRE(payload).
 *   2) triggerCRE schedules a microtask and returns immediately.
 *   3) dispatchConfidentialHttp reads runtime config from env:
 *      CRE_CONFIDENTIAL_HTTP_URL, CRE_CONFIDENTIAL_HTTP_TOKEN,
 *      CRE_CONFIDENTIAL_WORKFLOW_ID, CRE_CONFIDENTIAL_CALLBACK_URL.
 *   4) Adapter generates a correlationId and marks the envelope as
 *      confidential=true.
 *   5) Adapter POSTs JSON to CRE_CONFIDENTIAL_HTTP_URL with:
 *      - X-CRE-Correlation-Id header
 *      - optional Bearer token
 *      - timeout guard via AbortController.
 *   6) Adapter logs one of:
 *      - CONFIDENTIAL_HTTP_OK
 *      - CONFIDENTIAL_HTTP_FAILED
 *      - CONFIDENTIAL_HTTP_ERROR
 *
 * What this adapter does NOT do:
 *   - It does not execute onchain mitigation itself.
 *   - It does not hold or request user private keys.
 *   - It does not block API/risk request lifecycles.
 *
 * Current validation scope:
 *   - End-to-end confidential dispatch/callback is validated in
 *     local CRE DON simulation.
 *   - Production DON deployment and gateway-trigger hardening are
 *     future steps.
 */

import type { ActionType } from "../agentic-risk/agent.guard.js";

// ── Types ────────────────────────────────────────────────────────────

export interface CREActionPayload {
  /** Which agent requested this action. */
  agentId: string;
  /** The authorized action type. */
  actionType: ActionType;
  /** Chain-specific context. */
  chainId: string;
  /** Risk composite score that triggered the action (0..1). */
  composite: number;
  /** Additional metadata for the CRE workflow. */
  metadata: Record<string, unknown>;
  /** Unix ms. */
  timestamp: number;
}

interface ConfidentialDispatchBody {
  workflowId: string;
  chainId: string;
  timestamp: number;
  data: {
    agentId: string;
    actionType: ActionType;
    composite: number;
    correlationId: string;
    confidential: true;
    metadata: Record<string, unknown>;
    callbackUrl?: string;
  };
}

function getEnv(name: string): string | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;
  const value = raw.trim();
  return value.length > 0 ? value : undefined;
}

function getTimeoutMs(): number {
  const raw = getEnv("CRE_CONFIDENTIAL_HTTP_TIMEOUT_MS");
  if (!raw) return 5000;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return 5000;
  return Math.floor(parsed);
}

function randomId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

async function dispatchConfidentialHttp(payload: CREActionPayload): Promise<void> {
  const endpoint = getEnv("CRE_CONFIDENTIAL_HTTP_URL");
  if (!endpoint) {
    console.info(
      `[cre-adapter] CONFIDENTIAL_HTTP_DISABLED | agent=${payload.agentId} action=${payload.actionType}`
    );
    return;
  }

  const token = getEnv("CRE_CONFIDENTIAL_HTTP_TOKEN");
  const workflowId = getEnv("CRE_CONFIDENTIAL_WORKFLOW_ID") ?? "aave-risk-confidential-http";
  const callbackUrl = getEnv("CRE_CONFIDENTIAL_CALLBACK_URL");
  const correlationId = randomId();
  const timeoutMs = getTimeoutMs();

  const body: ConfidentialDispatchBody = {
    workflowId,
    chainId: payload.chainId,
    timestamp: payload.timestamp,
    data: {
      agentId: payload.agentId,
      actionType: payload.actionType,
      composite: payload.composite,
      correlationId,
      confidential: true,
      metadata: payload.metadata,
      ...(callbackUrl ? { callbackUrl } : {}),
    },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-CRE-Correlation-Id": correlationId,
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn(
        `[cre-adapter] CONFIDENTIAL_HTTP_FAILED | status=${response.status} correlationId=${correlationId}`
      );
      return;
    }

    let requestId: string | undefined;
    try {
      const json = (await response.json()) as Record<string, unknown>;
      if (typeof json.requestId === "string") {
        requestId = json.requestId;
      }
    } catch {
      // Best-effort parsing; response body can be empty.
    }

    console.info(
      `[cre-adapter] CONFIDENTIAL_HTTP_OK | correlationId=${correlationId}${requestId ? ` requestId=${requestId}` : ""}`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `[cre-adapter] CONFIDENTIAL_HTTP_ERROR | correlationId=${correlationId} reason=${message}`
    );
  } finally {
    clearTimeout(timer);
  }
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Trigger a CRE workflow for the given action.
 *
 * Fire-and-forget entry point.
 *
 * Non-blocking behavior:
 *   - queueMicrotask schedules dispatch after current call stack.
 *   - caller returns immediately (no await, no Promise contract).
 *   - dispatch runs outside HTTP request lifecycle.
 *
 * Observability:
 *   - logs deterministic trigger metadata
 *   - downstream dispatch logs carry correlationId for traceability
 */
export function triggerCRE(payload: CREActionPayload): void {
  queueMicrotask(() => {
    // Structured audit log — sufficient for MVP observability
    console.info(
      `[cre-adapter] TRIGGER | agent=${payload.agentId} action=${payload.actionType} chain=${payload.chainId} composite=${payload.composite}`
    );

    void dispatchConfidentialHttp(payload);
  });
}
