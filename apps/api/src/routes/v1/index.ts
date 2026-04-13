/**
 * v1 Routes — Versioned Public API
 *
 * Aggregates all protocol routes under the /v1 namespace.
 * Each protocol's routes are imported from the v1/{protocol}/ adapter,
 * which in turn re-exports from routes/protocol/{protocol}/.
 *
 * This layer exists for DDD alignment and future versioning (v2, etc.).
 */

import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { registerAaveRoutes } from "./aave/index.js";
import { registerUniswapRoutes } from "./uniswap/index.js";
import { registerLidoRoutes } from "./lido/index.js";
import { registerAaveRiskApiRoutes } from "./aave-risk/index.js";
import { registerCopilotRoutes } from "./copilot/index.js";
import { registerAgentEnrollmentRoutes } from "./agent-enrollment/index.js";
import { registerZgRoutes } from "./zg/index.js";
import { registerVaultGatewayPlugin } from "./vault-gateway/index.js";
import { registerKaminoRiskRoutes } from "./kamino-risk/index.js";

export interface V1RouteRegisterOpts extends FastifyPluginOptions {
  copilotRateLimitMax?: number;
}

export async function registerV1Routes(
  app: FastifyInstance,
  opts: V1RouteRegisterOpts = {}
) {
  await app.register(registerAaveRoutes, { prefix: "/aave" });
  await app.register(registerUniswapRoutes, { prefix: "/uniswap" });
  await app.register(registerLidoRoutes, { prefix: "/lido" });

  // ── API-as-a-Product: Public Aave Risk Intelligence endpoints ──────
  await app.register(registerAaveRiskApiRoutes, { prefix: "/aave-risk" });

  // ── API-as-a-Product: Risk Co-Pilot endpoints (informational mode) ─
  await app.register(registerCopilotRoutes, {
    prefix: "/copilot",
    copilotRateLimitMax: opts.copilotRateLimitMax,
  });

  // ── API-as-a-Product: Agent enrollment (phase A, in-memory) ─────────
  await app.register(registerAgentEnrollmentRoutes, { prefix: "/agent-enrollment" });

  // ── ZG (0G-aligned) intelligence pipeline (advisory; separate from CRE) ──
  await app.register(registerZgRoutes, { prefix: "/zg" });

  // ── Cross-chain vault gateway (manifest + advisory routing; no custody) ──
  await app.register(registerVaultGatewayPlugin, { prefix: "/vault-gateway" });

  // ── Kamino / Solana bounded context (separate from aave-risk) ─────────────
  await app.register(registerKaminoRiskRoutes, { prefix: "/kamino-risk" });
}
