/**
 * Kamino Risk API — namespaced under /api/v1/kamino-risk (not Aave routes).
 */

import type { FastifyInstance } from "fastify";
import type { AquariusDomainId } from "@aquarius/types";
import { loadConfig } from "../../../config/index.js";
import { createStubKaminoMarketReader } from "../../../infrastructure/kamino/stub-kamino-market-reader.js";
import {
  fetchKaminoRiskSnapshot,
  KaminoSnapshotError,
} from "../../../infrastructure/kamino/kamino-snapshot.service.js";
import {
  KAMINO_INTELLIGENCE_VERSION,
  scoreKaminoStub,
  scoreKaminoSnapshot,
} from "../../../protocols/kamino-solana/risk-intelligence/scorer.js";
import {
  buildKaminoCopilotContext,
  buildKaminoCopilotContextStub,
} from "../../../protocols/kamino-solana/risk-intelligence/copilot-context.js";
import { kaminoSnapshotQuerySchema } from "./snapshot-query.schema.js";
import { kaminoRepaySimulateBodySchema } from "./repay-simulate.schema.js";
import { assertRepayDryRunAllowed, KaminoWritePolicyError } from "../../../protocols/kamino-solana/policy/kamino-repay-policy.js";
import { simulateKaminoRepayDryRun } from "../../../infrastructure/kamino/kamino-repay-dry-run.js";
import {
  getIdempotentResult,
  setIdempotentResult,
} from "../../../infrastructure/kamino/kamino-write-idempotency.js";

const stubMarketReader = createStubKaminoMarketReader();

export async function registerKaminoRiskRoutes(app: FastifyInstance) {
  app.get("/health", async () => {
    const config = loadConfig();
    const stub = scoreKaminoStub();
    const domain: AquariusDomainId = stub.domain;
    const markets = await stubMarketReader.listMarketLabels();
    const copilot = buildKaminoCopilotContextStub();
    return {
      status: "ok" as const,
      service: "kamino-risk" as const,
      domain,
      marketsDiscovered: markets.length,
      copilotDomain: copilot.domain,
      readPath: config.kaminoReadEnabled ? ("live" as const) : ("disabled" as const),
      writePath: config.kaminoWriteEnabled ? ("enabled" as const) : ("disabled" as const),
      intelligenceVersion: KAMINO_INTELLIGENCE_VERSION,
    };
  });

  app.get("/snapshot", async (request, reply) => {
    const parsed = kaminoSnapshotQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters.",
          issues: parsed.error.issues,
        },
      });
    }

    const config = loadConfig();
    const { wallet, policy } = parsed.data;
    const market =
      parsed.data.market ?? config.kaminoDefaultMarketPubkey ?? undefined;

    if (!market) {
      return reply.status(400).send({
        error: {
          code: "MARKET_REQUIRED",
          message:
            "Query parameter `market` or env KAMINO_MARKET_PUBKEY is required.",
        },
      });
    }

    const started = performance.now();
    try {
      const snapshot = await fetchKaminoRiskSnapshot({
        config,
        wallet,
        marketPubkey: market,
      });
      const intelligence = scoreKaminoSnapshot(snapshot);
      const copilot = buildKaminoCopilotContext(snapshot, policy);
      const latencyMs = Math.round(performance.now() - started);

      return {
        snapshot,
        intelligence,
        copilot,
        latencyMs,
      };
    } catch (e) {
      const latencyMs = Math.round(performance.now() - started);
      if (e instanceof KaminoSnapshotError) {
        const status =
          e.code === "OBLIGATION_NOT_FOUND"
            ? 404
            : e.code === "KAMINO_READ_DISABLED"
              ? 503
              : e.code === "CIRCUIT_OPEN"
                ? 503
                : e.code === "TIMEOUT"
                  ? 504
                  : 502;
        return reply.status(status).send({
          error: {
            code: e.code,
            message: e.message,
            retryAfterMs: e.retryAfterMs,
            latencyMs,
          },
        });
      }
      return reply.status(500).send({
        error: {
          code: "INTERNAL_ERROR",
          message: "Unexpected error while loading Kamino snapshot.",
          latencyMs,
        },
      });
    }
  });

  const kaminoRouteConfig = loadConfig();
  const repaySimulateRouteOpts =
    kaminoRouteConfig.rateLimitKaminoWriteMax > 0
      ? {
          config: {
            rateLimit: {
              max: kaminoRouteConfig.rateLimitKaminoWriteMax,
              timeWindow: "1 minute" as const,
            },
          },
        }
      : {};

  app.post("/repay/simulate", repaySimulateRouteOpts, async (request, reply) => {
    const parsed = kaminoRepaySimulateBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request body.",
          issues: parsed.error.issues,
        },
      });
    }

    const config = loadConfig();
    const body = parsed.data;

    try {
      assertRepayDryRunAllowed(config, {
        amountUi: body.amountUi,
        repayMint: body.repayMint,
      });
    } catch (e) {
      if (e instanceof KaminoWritePolicyError) {
        const status =
          e.code === "WRITE_DISABLED" || e.code === "RPC_NOT_CONFIGURED"
            ? 503
            : 403;
        return reply.status(status).send({
          error: { code: e.code, message: e.message },
        });
      }
      throw e;
    }

    const cacheKey = body.idempotencyKey
      ? `kamino:repay:sim:${body.idempotencyKey}`
      : null;
    if (cacheKey) {
      const cached = getIdempotentResult<unknown>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const started = performance.now();
    request.log.info(
      {
        event: "kamino_repay_dry_run_start",
        wallet: body.wallet,
        market: body.market,
        repayMint: body.repayMint,
      },
      "Kamino repay simulation (dry-run) starting"
    );

    const result = await simulateKaminoRepayDryRun({
      config,
      wallet: body.wallet,
      marketPubkey: body.market,
      repayMint: body.repayMint,
      amountUi: body.amountUi,
    });

    const latencyMs = Math.round(performance.now() - started);

    request.log.info(
      {
        event: "kamino_repay_dry_run_done",
        ok: result.ok,
        latencyMs,
      },
      "Kamino repay simulation finished"
    );

    if (!result.ok) {
      const status =
        result.code === "OBLIGATION_NOT_FOUND"
          ? 404
          : result.code === "MARKET_NOT_FOUND"
            ? 404
            : result.code === "TIMEOUT"
              ? 504
              : 502;
      return reply.status(status).send({
        ok: false,
        error: { code: result.code, message: result.message },
        latencyMs,
      });
    }

    const out = {
      ok: true,
      dryRun: true,
      instructionCount: result.instructionCount,
      unitsConsumed: result.unitsConsumed,
      logs: result.logs,
      simulationErr: result.err,
      latencyMs,
    };
    if (cacheKey) {
      setIdempotentResult(cacheKey, out);
    }
    return reply.status(200).send(out);
  });
}
