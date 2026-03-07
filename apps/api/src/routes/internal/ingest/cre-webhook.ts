/**
 * CRE Webhook — Internal Ingestion Endpoint
 *
 * Bounded context: CRE (Chainlink Runtime Environment)
 * This endpoint receives webhook payloads from CRE workflow triggers.
 *
 * APPLICATION LAYER — pure orchestration:
 *   1. Validate payload
 *   2. Resolve monitor from registry
 *   3. Run monitor → normalized MonitorSnapshot
 *   4. Cache snapshot in RiskQueryService
 *   5. Return response derived from snapshot
 *
 * This layer NEVER imports domain services, NEVER transforms domain
 * objects, NEVER performs normalization.  All mapping is delegated
 * to the protocol monitor adapter (AaveMonitor).
 *
 * Integrated workflows:
 *   - aave-risk  → Aave Risk Intelligence pipeline (via AaveMonitor)
 *
 * local_don_ccc end-to-end mode (new):
 * ------------------------------------
 * When EXECUTION_MODE=local_don_ccc and a confidential callback arrives,
 * this endpoint does more than ingest monitoring data:
 *
 *   1) validates callback freshness (anti-stale guard)
 *   2) reserves correlationId in an idempotency ledger
 *   3) builds deterministic ExecutionContext from callback payload
 *   4) hands off to ExecutionRouter → CCC adapter path
 *   5) enforces execution timeout
 *   6) marks ledger state (completed / failed / timed_out)
 *   7) returns machine-readable localDonExecution status
 *
 * This gives an honest DON-like local pipeline:
 * callback -> deterministic routing -> execution adapter
 * with explicit replay and timeout protection.
 */

import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { Protocol, type Chain } from "../../../protocols/shared/types/risk-api.types.js";
import { getMonitor } from "../../../protocols/shared/application/monitors/monitor-registry.js";
import { queryService } from "../../v1/aave-risk/index.js";
import { createCccAdapter } from "../../../infrastructure/ccc/executionFactory.js";
import { ExecutionRouter } from "../../../infrastructure/execution/execution-router.js";
import type { ExecutionContext } from "../../../protocols/shared/types/execution-context.js";

export interface CREWebhookPayload {
  workflowId: string;
  timestamp: number;
  chainId: string;
  data: Record<string, unknown>;
}

/** Workflow IDs that trigger the Aave risk-intelligence pipeline. */
const AAVE_RISK_WORKFLOWS = new Set([
  "aave-risk",
  "aave-risk-monitor",
  "aave-risk-confidential-http",
]);

const LOCAL_DON_EXECUTION_MODE = "local_don_ccc";

type CorrelationState = "processing" | "completed" | "failed" | "timed_out";

interface CorrelationRecord {
  state: CorrelationState;
  updatedAt: number;
}

const correlationLedger = new Map<string, CorrelationRecord>();
let localDonRouter: ExecutionRouter | null = null;

/**
 * Parses positive integer environment values safely.
 * Any invalid value falls back to a deterministic default.
 */
function parsePositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function getCallbackMaxAgeMs(): number {
  return parsePositiveIntEnv("LOCAL_DON_CCC_CALLBACK_MAX_AGE_MS", 60_000);
}

function getReplayTtlMs(): number {
  return parsePositiveIntEnv("LOCAL_DON_CCC_REPLAY_TTL_MS", 10 * 60_000);
}

function getExecutionTimeoutMs(): number {
  return parsePositiveIntEnv("LOCAL_DON_CCC_EXECUTION_TIMEOUT_MS", 20_000);
}

/**
 * Best-effort in-memory GC for correlation ledger records.
 * Entries older than replay TTL are removed.
 */
function pruneCorrelationLedger(now: number): void {
  const replayTtlMs = getReplayTtlMs();
  for (const [correlationId, record] of correlationLedger.entries()) {
    if (now - record.updatedAt > replayTtlMs) {
      correlationLedger.delete(correlationId);
    }
  }
}

function reserveCorrelation(
  correlationId: string,
  callbackTimestamp: number
): { accepted: true } | { accepted: false; reason: "stale" | "duplicate"; state?: CorrelationState } {
  const now = Date.now();
  pruneCorrelationLedger(now);

  if (now - callbackTimestamp > getCallbackMaxAgeMs()) {
    return { accepted: false, reason: "stale" };
  }

  const existing = correlationLedger.get(correlationId);
  if (existing) {
    return { accepted: false, reason: "duplicate", state: existing.state };
  }

  correlationLedger.set(correlationId, { state: "processing", updatedAt: now });
  return { accepted: true };
}

/**
 * Updates correlation processing state.
 * Used to provide deterministic replay semantics:
 * - processing  -> duplicate-ignored
 * - completed/* -> replay-rejected
 */
function markCorrelation(correlationId: string, state: CorrelationState): void {
  correlationLedger.set(correlationId, { state, updatedAt: Date.now() });
}

/**
 * Promise timeout wrapper for router handoff.
 * We intentionally do not cancel downstream work; timeout is a boundary
 * guarantee for request lifecycle and replay-state bookkeeping.
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  return new Promise<T>((resolve, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`LOCAL_DON_CCC_TIMEOUT_${timeoutMs}MS`));
    }, timeoutMs);

    promise
      .then((value) => resolve(value))
      .catch((error) => reject(error))
      .finally(() => {
        if (timer) clearTimeout(timer);
      });
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function toStringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function toNumberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getLocalDonRouter(): ExecutionRouter {
  if (!localDonRouter) {
    // Lazily instantiated singleton so callback path does not rebuild adapters per request.
    localDonRouter = new ExecutionRouter(LOCAL_DON_EXECUTION_MODE, createCccAdapter());
  }
  return localDonRouter;
}

/**
 * Stable risk classification for callback->execution handoff.
 * Composite score mapping is deterministic to avoid mode-specific drift.
 */
function classifyRiskLevel(composite: number): ExecutionContext["riskLevel"] {
  if (composite >= 0.85) return "CRITICAL";
  if (composite >= 0.7) return "HIGH";
  if (composite >= 0.4) return "MEDIUM";
  return "LOW";
}

function buildExecutionContext(
  payload: CREWebhookPayload,
  data: Record<string, unknown>,
  correlationId: string
): ExecutionContext {
  const metadata = isRecord(data.metadata) ? data.metadata : {};
  const composite = toNumberValue(data.composite) ?? 0.5;
  const user =
    toStringValue(metadata.user) ??
    toStringValue(metadata.walletAddress) ??
    toStringValue(data.user) ??
    toStringValue(process.env.LOCAL_DON_CCC_DEFAULT_USER) ??
    "unknown";

  return {
    agentId: toStringValue(data.agentId) ?? "local-don-agent",
    action: toStringValue(data.actionType) ?? "ESCALATE",
    requiresConfidentiality: true,
    riskLevel: classifyRiskLevel(composite),
    payload: {
      // Payload fields intentionally normalized for ExecutionRouter's MitigationIntent mapping.
      user,
      chainId: payload.chainId,
      protocol: toStringValue(metadata.protocol) ?? "aave",
      asset: toStringValue(metadata.asset),
      composite,
      correlationId,
      source: "local-don-confidential-http",
    },
  };
}

export async function registerCREWebhookRoute(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.post<{ Body: CREWebhookPayload }>("/", async (request, reply) => {
    const payload = request.body;

    // Validate required fields
    if (!payload?.workflowId || !payload?.timestamp || !payload?.chainId) {
      return reply.status(400).send({
        error: "Invalid CRE webhook payload",
        required: ["workflowId", "timestamp", "chainId", "data"],
      });
    }

    // TODO: Add Zod schema validation per security rules

    // ── Route to Aave Risk Intelligence pipeline ───────────────────
    if (AAVE_RISK_WORKFLOWS.has(payload.workflowId)) {
      try {
        const monitor = getMonitor(Protocol.AAVE);
        if (!monitor) {
          return reply.status(503).send({
            error: "Aave monitor not registered",
            workflowId: payload.workflowId,
          });
        }

        // Delegate entirely to the monitor adapter.
        // AaveMonitor handles: domain call, normalization, CCIP dispatch.
        const snapshot = await monitor.run(payload.chainId as Chain);

        // Cache the normalized snapshot (O(1), synchronous).
        queryService.updateSnapshot(snapshot);

        const data = payload.data as Record<string, unknown> | undefined;
        const correlationId =
          data && typeof data.correlationId === "string" ? data.correlationId : undefined;
        const isConfidential = data?.confidential === true;
        const isLocalDonMode =
          (process.env.EXECUTION_MODE ?? "").trim() === LOCAL_DON_EXECUTION_MODE;

        let localDonExecution:
          | {
              status: "executed" | "duplicate-ignored" | "replay-rejected";
              mode: "local_don_ccc";
            }
          | undefined;

        if (isConfidential && isLocalDonMode) {
          // local_don_ccc enforces strict correlation semantics for confidential callbacks.
          if (!correlationId) {
            return reply.status(400).send({
              error: "Missing correlationId for local_don_ccc confidential callback",
              workflowId: payload.workflowId,
              ingestionMode: "confidential-http",
            });
          }

          const reservation = reserveCorrelation(correlationId, payload.timestamp);
          if (!reservation.accepted) {
            if (reservation.reason === "stale") {
              // Stale callbacks are treated as timed_out terminal records.
              markCorrelation(correlationId, "timed_out");
              return reply.status(409).send({
                error: "Stale confidential callback rejected",
                workflowId: payload.workflowId,
                correlationId,
                ingestionMode: "confidential-http",
                executionMode: LOCAL_DON_EXECUTION_MODE,
              });
            }

            localDonExecution = {
              status:
                reservation.state === "processing"
                  // A concurrent duplicate while first request is active.
                  ? "duplicate-ignored"
                  // Any non-processing duplicate is a replay attempt.
                  : "replay-rejected",
              mode: "local_don_ccc",
            };
          } else {
            try {
              const context = buildExecutionContext(payload, data ?? {}, correlationId);
              const router = getLocalDonRouter();
              // Hard timeout guarantees bounded latency for callback lifecycle.
              await withTimeout(router.execute(context), getExecutionTimeoutMs());
              markCorrelation(correlationId, "completed");
              localDonExecution = { status: "executed", mode: "local_don_ccc" };
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              const timedOut = message.startsWith("LOCAL_DON_CCC_TIMEOUT_");
              markCorrelation(correlationId, timedOut ? "timed_out" : "failed");
              return reply.status(timedOut ? 504 : 500).send({
                error: timedOut
                  ? "local_don_ccc execution timed out"
                  : "local_don_ccc execution failed",
                workflowId: payload.workflowId,
                correlationId,
                ingestionMode: "confidential-http",
                executionMode: LOCAL_DON_EXECUTION_MODE,
                details: message,
              });
            }
          }
        }

        return reply.status(200).send({
          status: "processed",
          workflowId: payload.workflowId,
          chainId: snapshot.chain,
          globalRiskIndex: snapshot.globalRiskIndex,
          liquidationPressure: snapshot.liquidationPressure,
          timestamp: snapshot.timestamp,
          ingestionMode: isConfidential ? "confidential-http" : "standard",
          correlationId,
          ...(localDonExecution ? { localDonExecution } : {}),
        });
      } catch (err) {
        request.log.error(err, "Aave risk monitor pipeline failed");
        return reply.status(500).send({
          error: "Risk monitor pipeline error",
          workflowId: payload.workflowId,
        });
      }
    }

    // ── Default: accept but don't process (other workflow IDs) ─────
    return reply.status(202).send({
      status: "accepted",
      workflowId: payload.workflowId,
      timestamp: payload.timestamp,
    });
  });
}
