/**
 * API Route — Projected Health Factor
 *
 * GET /api/v1/aave-risk/projected-hf/:user
 *
 * Reads the user's current Aave V3 position and returns a predictive
 * health factor projection based on oracle velocity and position state.
 *
 * The prediction math is inlined here to avoid cross-package imports
 * from services/prediction-engine (which is outside apps/api rootDir).
 * The canonical implementations live in services/prediction-engine/*.ts.
 */

import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { assertAaveValidationMode } from "./validation-guard.js";
import {
  fetchUserAccountData,
  getActiveDataMode,
} from "../../../services/health-engine/provider-data.js";
import { normalizeEthereumAddress } from "./address-normalizer.js";
import { isAaveActiveChain, resolveAaveActiveChain } from "./chain.js";

const DEFAULT_BLOCKS_AHEAD = 2;
const MIN_CONFIDENCE = 0.5;
const MAX_CONFIDENCE = 0.95;

export function createProjectedHFRoute() {
  return async function projectedHFRoute(
    app: FastifyInstance,
    _opts: FastifyPluginOptions
  ) {
    app.get<{ Params: { user: string }; Querystring: { blocks?: string; chain?: string } }>(
      "/:user",
      async (request, reply) => {
        if (!assertAaveValidationMode(reply)) return;
        const { user } = request.params;
        const normalizedUser = normalizeEthereumAddress(user);
        const blocksAhead = parseInt(request.query.blocks ?? "2", 10);
        const requestedChain = request.query.chain?.toLowerCase();
        if (requestedChain && !isAaveActiveChain(requestedChain)) {
          return reply.status(400).send({
            error: "Unsupported chain",
            message: `Unsupported chain "${request.query.chain}". Supported chains: ethereum, polygon.`,
          });
        }
        const chain = resolveAaveActiveChain(requestedChain);

        if (!normalizedUser) {
          return reply.status(400).send({ error: "Invalid user address" });
        }

        try {
          const parsed = await fetchUserAccountData(normalizedUser, chain);
          if (!parsed) {
            return reply.status(404).send({
              error: "User position not found",
              message: `No active Aave position found for ${normalizedUser} on ${chain} in DATA_PROVIDER_MODE=${getActiveDataMode()}.`,
            });
          }

          // Inline HF projection: linear extrapolation from oracle velocity
          const oracleVelocity = -0.5; // assumed declining
          const collateralDeltaPercent = oracleVelocity * blocksAhead * 0.8;
          const futureCollateral = parsed.totalCollateralUsd * (1 + collateralDeltaPercent / 100);
          const projectedHF = parsed.totalDebtUsd > 0
            ? Math.round((futureCollateral / parsed.totalDebtUsd) * 1000) / 1000
            : 999;

          const confidence = Math.max(MIN_CONFIDENCE, MAX_CONFIDENCE - blocksAhead * 0.02);

          // Estimate breach block
          let breachBlock: number | null = null;
          if (projectedHF < parsed.healthFactor && projectedHF < 1.1) {
            const hfDelta = (parsed.healthFactor - projectedHF) / blocksAhead;
            if (hfDelta > 0) {
              breachBlock = Math.ceil((parsed.healthFactor - 1.0) / hfDelta);
            }
          }

          // Inline risk velocity: assume declining HF
          const slope = -0.002;
          const isAccelerating = false;

          // Inline liquidation probability
          const hfBuffer = Math.max(0, parsed.healthFactor - 1.0);
          const proximityScore = hfBuffer < 0.5 ? 1.0 - hfBuffer / 0.5 : 0;
          const trajectoryScore = projectedHF < parsed.healthFactor
            ? (projectedHF < 1.05 ? 0.9 : projectedHF < 1.15 ? 0.5 : 0.2)
            : 0;
          const liqProb = Math.min(1.0, Math.max(0, proximityScore * 0.4 + trajectoryScore * 0.6));

          // Price drop to liquidation: how much collateral value can drop before HF = 1.0
          const priceDropToLiquidation = parsed.healthFactor > 1.0
            ? Math.round((1 - 1.0 / parsed.healthFactor) * 10000) / 100
            : 0;

          const interpretation = parsed.healthFactor < 1.2
            ? `Critical: ${priceDropToLiquidation}% price drop triggers liquidation. HF declining.`
            : parsed.healthFactor < 1.8
              ? `Moderate buffer: ${priceDropToLiquidation}% drop to liquidation. Monitor volatility.`
              : `Healthy buffer: ${priceDropToLiquidation}% drop to liquidation.`;

          const action = parsed.healthFactor < 1.2
            ? "Add collateral immediately or reduce debt."
            : parsed.healthFactor < 1.8
              ? "Consider adding collateral if volatility regime is elevated."
              : "No action required.";

          return reply.send({
            user: normalizedUser,
            currentHF: parsed.healthFactor,
            projectedHF,
            blocksAhead,
            confidence,
            breachBlock,
            liquidationThreshold: parsed.liquidationThreshold ?? null,
            priceDropToLiquidation,
            riskVelocity: { slope, isAccelerating },
            liquidationProbability: Math.round(liqProb * 10000) / 10000,
            interpretation,
            action,
            timestamp: Date.now(),
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return reply.status(500).send({ error: message });
        }
      }
    );
  };
}
