/**
 * API Route — Actionable Protocol Metrics
 *
 * GET /api/v1/aave-risk/actionable-metrics
 *
 * Returns protocol-level metrics where every value includes
 * interpretation and recommended action. No vanity numbers.
 *
 * Metrics: Cascading Liquidation Exposure, Liquidity Buffer, Volatility Regime
 */

import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { createMarketDataProvider } from "../../../adapters/providerFactory.js";
import { deriveChainMetrics } from "../../../protocols/aave/risk-intelligence/signals.js";
import type { PositionSnapshot } from "../../../domain/models/PositionSnapshot.js";
import { assertAaveValidationMode } from "./validation-guard.js";
import {
  formatAaveActiveChains,
  isAaveActiveChain,
  resolveAaveActiveChain,
} from "./chain.js";

interface ActionableMetric {
  id: string;
  label: string;
  value: string;
  numericValue: number;
  interpretation: string;
  action: string;
  severity: "safe" | "warning" | "critical";
}

function deriveCascadingExposure(
  positionsAtRisk: number,
  totalPositions: number,
): ActionableMetric {
  const pct = totalPositions > 0 ? (positionsAtRisk / totalPositions) * 100 : 0;
  const rounded = Math.round(pct * 10) / 10;

  let severity: "safe" | "warning" | "critical" = "safe";
  let interpretation: string;
  let action: string;

  if (pct >= 20) {
    severity = "critical";
    interpretation = `${rounded}% of positions within liquidation band. Cascading liquidations likely.`;
    action = "Reduce exposure immediately. Liquidation bots are active.";
  } else if (pct >= 10) {
    severity = "warning";
    interpretation = `${rounded}% of positions approaching liquidation. Systemic stress building.`;
    action = "Monitor closely. Consider reducing leverage.";
  } else {
    interpretation = `${rounded}% of positions near liquidation. Low systemic risk.`;
    action = "No action required.";
  }

  return {
    id: "cascading-exposure",
    label: "Cascading Liquidation Exposure",
    value: `${rounded}%`,
    numericValue: rounded,
    interpretation,
    action,
    severity,
  };
}

function deriveLiquidityBuffer(
  totalCollateralUsd: number,
  totalDebtUsd: number,
): ActionableMetric {
  const ratio = totalDebtUsd > 0 ? totalCollateralUsd / totalDebtUsd : 999;
  const rounded = Math.round(ratio * 100) / 100;

  let severity: "safe" | "warning" | "critical" = "safe";
  let interpretation: string;
  let action: string;

  if (ratio < 1.2) {
    severity = "critical";
    interpretation = `Buffer ratio ${rounded}x. Protocol under-collateralized stress.`;
    action = "Avoid new borrowing. Add collateral to existing positions.";
  } else if (ratio < 1.8) {
    severity = "warning";
    interpretation = `Buffer ratio ${rounded}x. Tightening liquidity.`;
    action = "Monitor borrow rates for spikes. Reduce leverage if volatile.";
  } else {
    interpretation = `Buffer ratio ${rounded}x. Healthy protocol collateralization.`;
    action = "No action required.";
  }

  return {
    id: "liquidity-buffer",
    label: "Liquidity Buffer Ratio",
    value: `${rounded}x`,
    numericValue: rounded,
    interpretation,
    action,
    severity,
  };
}

function deriveVolatilityRegime(
  positions: PositionSnapshot[],
): ActionableMetric {
  const hfs = positions.map((p) => p.healthFactor).filter((v) => Number.isFinite(v) && v > 0);
  const mean = hfs.length > 0 ? hfs.reduce((a, b) => a + b, 0) / hfs.length : 1.5;
  const variance =
    hfs.length > 1
      ? hfs.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / hfs.length
      : 0.02;
  const hfStdDev = Math.sqrt(Math.max(0, variance));
  const annualizedVol = Math.max(0.1, Math.min(1.8, hfStdDev * 0.9));
  const regime: "low" | "elevated" | "extreme" =
    annualizedVol > 1.0 ? "extreme" : annualizedVol > 0.6 ? "elevated" : "low";

  let severity: "safe" | "warning" | "critical" = "safe";
  let interpretation: string;
  let action: string;

  if (regime === "extreme" || annualizedVol > 1.0) {
    severity = "critical";
    interpretation = `Extreme volatility (${(annualizedVol * 100).toFixed(0)}% annualized). Rapid HF changes expected.`;
    action = "Increase collateral buffer. Set tight alert thresholds.";
  } else if (regime === "elevated" || annualizedVol > 0.6) {
    severity = "warning";
    interpretation = `Elevated volatility (${(annualizedVol * 100).toFixed(0)}% annualized). HF may shift faster than normal.`;
    action = "Monitor positions more frequently.";
  } else {
    interpretation = `Low volatility (${(annualizedVol * 100).toFixed(0)}% annualized). Stable market conditions.`;
    action = "No action required.";
  }

  return {
    id: "volatility-regime",
    label: "Volatility Regime",
    value: regime.charAt(0).toUpperCase() + regime.slice(1),
    numericValue: annualizedVol,
    interpretation,
    action,
    severity,
  };
}

export function createActionableMetricsRoute() {
  return async function actionableMetricsRoute(
    app: FastifyInstance,
    _opts: FastifyPluginOptions,
  ) {
    app.get<{ Querystring: { chain?: string } }>("/", async (request, reply) => {
      if (!assertAaveValidationMode(reply)) return;
      try {
        const requestedChain = request.query.chain?.toLowerCase();
        if (requestedChain && !isAaveActiveChain(requestedChain)) {
          return reply.status(400).send({
            error: "Unsupported chain",
            message: `Unsupported chain "${request.query.chain}". Supported chains: ${formatAaveActiveChains()}.`,
          });
        }
        const chain = resolveAaveActiveChain(requestedChain);

        const provider = createMarketDataProvider();
        const positions = await provider.fetchPositionSnapshots(chain, 50);
        const metrics = deriveChainMetrics(chain, positions);

        const result: ActionableMetric[] = [
          deriveCascadingExposure(metrics.positionsAtRisk, metrics.totalPositions),
          deriveLiquidityBuffer(metrics.totalCollateralUsd, metrics.totalDebtUsd),
          deriveVolatilityRegime(positions),
        ];

        return reply.send({ metrics: result, timestamp: Date.now() });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return reply.status(500).send({ error: message });
      }
    });
  };
}
