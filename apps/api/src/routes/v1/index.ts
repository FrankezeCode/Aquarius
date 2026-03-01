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

export async function registerV1Routes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  await app.register(registerAaveRoutes, { prefix: "/aave" });
  await app.register(registerUniswapRoutes, { prefix: "/uniswap" });
  await app.register(registerLidoRoutes, { prefix: "/lido" });

  // ── API-as-a-Product: Public Aave Risk Intelligence endpoints ──────
  await app.register(registerAaveRiskApiRoutes, { prefix: "/aave-risk" });

  // ── API-as-a-Product: Risk Co-Pilot endpoints (informational mode) ─
  await app.register(registerCopilotRoutes, { prefix: "/copilot" });

  // ── API-as-a-Product: Agent enrollment (phase A, in-memory) ─────────
  await app.register(registerAgentEnrollmentRoutes, { prefix: "/agent-enrollment" });
}
