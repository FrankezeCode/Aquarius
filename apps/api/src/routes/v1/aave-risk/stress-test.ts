/**
 * API Route — Stress Test Simulation
 *
 * GET /api/v1/aave-risk/stress-test/:user
 *
 * Runs preset stress scenarios against user positions and returns
 * projected HF + liquidation risk per scenario.
 *
 * Stress logic is inlined to avoid cross-package rootDir issues.
 */

import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { assertAaveValidationMode } from "./validation-guard.js";
import {
  fetchUserAccountData,
  getActiveDataMode,
} from "../../../services/health-engine/provider-data.js";
import { normalizeEthereumAddress } from "./address-normalizer.js";
import { isAaveActiveChain, resolveAaveActiveChain } from "./chain.js";

interface StressScenario {
  name: string;
  priceChanges: Record<string, number>;
}

const SCENARIOS: Record<string, StressScenario> = {
  eth_drop_10: { name: "ETH -10%", priceChanges: { WETH: -10 } },
  eth_drop_20: { name: "ETH -20%", priceChanges: { WETH: -20 } },
  depeg_usdc: { name: "USDC depeg to $0.95", priceChanges: { USDC: -5 } },
};

function inlineStressTest(
  collateralUsd: number,
  debtUsd: number,
  healthFactor: number,
  scenario: StressScenario,
): { stressedHF: number; wouldLiquidate: boolean; lossUsd: number } {
  if (debtUsd <= 0) {
    return { stressedHF: 999, wouldLiquidate: false, lossUsd: 0 };
  }

  let maxImpact = 0;
  for (const change of Object.values(scenario.priceChanges)) {
    maxImpact = Math.min(maxImpact, change);
  }

  const impactFraction = maxImpact / 100;
  const stressedCollateral = collateralUsd * (1 + impactFraction);
  const stressedHF = Math.round((stressedCollateral / debtUsd) * 1000) / 1000;
  const wouldLiquidate = stressedHF < 1.0;
  const lossUsd = wouldLiquidate ? Math.round((debtUsd - stressedCollateral) * 100) / 100 : 0;

  return { stressedHF, wouldLiquidate, lossUsd };
}

export function createStressTestRoute() {
  return async function stressTestRoute(
    app: FastifyInstance,
    _opts: FastifyPluginOptions,
  ) {
    app.get<{ Params: { user: string }; Querystring: { chain?: string } }>("/:user", async (request, reply) => {
      if (!assertAaveValidationMode(reply)) return;
      const { user } = request.params;
      const normalizedUser = normalizeEthereumAddress(user);
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

        const scenarioKeys = ["eth_drop_10", "eth_drop_20", "depeg_usdc"] as const;
        const scenarios = scenarioKeys.map((key) => {
          const scenario = SCENARIOS[key];
          const result = inlineStressTest(
            parsed.totalCollateralUsd,
            parsed.totalDebtUsd,
            parsed.healthFactor,
            scenario,
          );

          return {
            name: scenario.name,
            projectedHF: result.stressedHF,
            lossUsd: result.lossUsd,
            wouldLiquidate: result.wouldLiquidate,
          };
        });

        const worstCase = scenarios.find(s => s.wouldLiquidate);
        const interpretation = worstCase
          ? `Under ${worstCase.name}, your position would be liquidated (HF ${worstCase.projectedHF}).`
          : "Your position survives all tested stress scenarios.";
        const action = worstCase
          ? "Add collateral or reduce debt to increase your liquidation buffer."
          : "No action required. Position is resilient.";

        return reply.send({
          user: normalizedUser,
          currentHF: parsed.healthFactor,
          scenarios,
          interpretation,
          action,
          timestamp: Date.now(),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return reply.status(500).send({ error: message });
      }
    });
  };
}
