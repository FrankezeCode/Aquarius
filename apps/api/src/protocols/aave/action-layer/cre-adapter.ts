/**
 * Action Layer — CRE Adapter (Infrastructure)
 *
 * Bounded context: Aave / Action Layer
 *
 * Stub adapter for triggering Chainlink Runtime Environment (CRE)
 * workflows from the action layer. Non-blocking via queueMicrotask.
 *
 * DDD role: Infrastructure Adapter — translates action-layer commands
 * into CRE-specific calls.
 *
 * Design:
 *   - Returns void (fire-and-forget)
 *   - No await, no Promise return
 *   - Uses queueMicrotask to avoid blocking the caller
 *   - Console audit logging only
 *
 * TODO: Future integration with real CRE pipelines via Chainlink
 *       Functions or direct DON trigger.
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
 * Non-blocking — uses queueMicrotask so the caller (escalation service)
 * returns immediately. The CRE trigger runs outside the HTTP request
 * lifecycle.
 *
 * TODO: Replace console stub with real CRE pipeline invocation:
 *   - Encode payload for Chainlink Functions
 *   - Submit to DON via Functions router contract
 *   - Track execution via CRE job ID
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
