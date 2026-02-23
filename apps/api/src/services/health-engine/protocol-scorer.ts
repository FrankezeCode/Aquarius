/**
 * Health Engine — Protocol Health Scorer
 *
 * Computes a protocol-level health score from on-chain signals.
 * Uses the existing risk-intelligence correlator and signals modules.
 *
 * Inputs → normalized risk dimensions → weighted score → category
 */

import type { ProtocolHealthScore, RiskInputs } from "@aquarius/types";
import {
  fetchPositionSnapshots,
  deriveChainMetrics,
} from "../../protocols/aave/risk-intelligence/signals.js";
import { correlateSignals } from "../../protocols/aave/risk-intelligence/correlator.js";
import { calculateHealthScore, buildBreakdown } from "./scoring.js";

/**
 * Compute protocol-level health score for Aave.
 *
 * Pulls position snapshots, derives chain metrics, correlates signals,
 * then maps correlated dimensions to the 0–100 health score.
 */
export async function computeProtocolHealth(
  protocol: string,
  chainId: string = "ethereum"
): Promise<ProtocolHealthScore & { _riskInputs: RiskInputs }> {
  const positions = await fetchPositionSnapshots(chainId, 50);
  const metrics = deriveChainMetrics(chainId, positions);
  const assessment = correlateSignals(chainId, positions, metrics);

  const riskInputs: RiskInputs = {
    volatility: Math.round(
      (assessment.dimensions.find((d) => d.label === "Health-Factor Pressure")
        ?.value ?? 0) * 100
    ),
    liquidityRisk: Math.round(
      (assessment.dimensions.find((d) => d.label === "Market Concentration")
        ?.value ?? 0) * 100
    ),
    liquidationRisk: Math.round(
      (assessment.dimensions.find((d) => d.label === "Liquidation Proximity")
        ?.value ?? 0) * 100
    ),
    smartContractRisk: Math.round(
      (assessment.dimensions.find(
        (d) => d.label === "Debt-to-Collateral Ratio"
      )?.value ?? 0) * 100
    ),
  };

  const result = calculateHealthScore(riskInputs);
  const breakdown = buildBreakdown(riskInputs);

  const confidence = computeConfidence(positions.length, assessment.compositeScore);

  return {
    protocol,
    score: result.score,
    category: result.category,
    confidence,
    breakdown,
    reasoning: result.reasoning,
    metadata: {
      block: null,
      timestamp: new Date().toISOString(),
      sources: [
        "on-chain-aave-v3",
        "position-snapshots",
        "risk-correlator",
      ],
    },
    _riskInputs: riskInputs,
  };
}

/**
 * Confidence: higher when more positions are sampled and signals agree.
 */
function computeConfidence(sampleSize: number, compositeScore: number): number {
  const sampleConfidence = Math.min(1, sampleSize / 50);
  const signalClarity = 1 - Math.abs(compositeScore - 0.5) * 0.2;
  return Math.round(sampleConfidence * signalClarity * 100) / 100;
}
