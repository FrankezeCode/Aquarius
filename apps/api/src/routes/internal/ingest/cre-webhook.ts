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
 */

import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { Protocol, type Chain, VALID_CHAINS } from "../../../protocols/shared/types/risk-api.types.js";
import { getMonitor } from "../../../protocols/shared/application/monitors/monitor-registry.js";
import { queryService } from "../../v1/aave-risk/index.js";

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

        return reply.status(200).send({
          status: "processed",
          workflowId: payload.workflowId,
          chainId: snapshot.chain,
          globalRiskIndex: snapshot.globalRiskIndex,
          liquidationPressure: snapshot.liquidationPressure,
          timestamp: snapshot.timestamp,
          ingestionMode: isConfidential ? "confidential-http" : "standard",
          correlationId,
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
