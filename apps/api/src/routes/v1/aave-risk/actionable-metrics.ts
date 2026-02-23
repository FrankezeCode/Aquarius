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

function deriveVolatilityRegime(): ActionableMetric {
  // Volatility regime derived from mock EWMA data.
  // In production, this would read from VolatilityForecaster singleton.
  const regime = "low" as "low" | "elevated" | "extreme";
  const annualizedVol = 0.42;

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
    app.get("/", async (_request, reply) => {
      try {
        const provider = createMarketDataProvider();
        const positions = await provider.fetchPositionSnapshots("ethereum", 50);
        const metrics = deriveChainMetrics("ethereum", positions);

        const result: ActionableMetric[] = [
          deriveCascadingExposure(metrics.positionsAtRisk, metrics.totalPositions),
          deriveLiquidityBuffer(metrics.totalCollateralUsd, metrics.totalDebtUsd),
          deriveVolatilityRegime(),
        ];

        return reply.send({ metrics: result, timestamp: Date.now() });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return reply.status(500).send({ error: message });
      }
    });
  };
}
