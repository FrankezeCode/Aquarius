/**
 * Infrastructure — Risk Query Cache
 *
 * Read-only cache layer between the position graph / prediction engine
 * and the API routes. API endpoints read from this cache instead of
 * recomputing from chain.
 *
 * Updated asynchronously by the event engine + prediction engine.
 * API routes only call synchronous reads — zero network latency.
 *
 * Performance target: < 0.1ms for any read operation.
 */

import type { AceRiskLevel } from "../protocols/aave/risk-intelligence/scorer.js";

export interface CachedRiskState {
  user: string;
  healthFactor: number;
  projectedHF: number;
  riskTier: AceRiskLevel;
  liquidationProbability: number;
  collateralUsd: number;
  debtUsd: number;
  lastBlock: number;
  updatedAt: number;
}

export interface SystemRiskSummary {
  totalPositions: number;
  positionsAtRisk: number;
  avgHealthFactor: number;
  avgProjectedHF: number;
  avgLiquidationProb: number;
  systemRiskLevel: AceRiskLevel;
  lastBlock: number;
  updatedAt: number;
}

export class RiskQueryCache {
  private positions = new Map<string, CachedRiskState>();
  private systemSummary: SystemRiskSummary | null = null;

  /**
   * Update a single position's cached risk state.
   * Called by the event router when graph + prediction update completes.
   */
  updatePosition(state: CachedRiskState): void {
    this.positions.set(state.user.toLowerCase(), state);
  }

  /**
   * Batch update from position graph + prediction engine output.
   */
  updateBatch(states: CachedRiskState[]): void {
    for (const state of states) {
      this.positions.set(state.user.toLowerCase(), state);
    }
  }

  /**
   * Update the system-level risk summary.
   */
  updateSystemSummary(summary: SystemRiskSummary): void {
    this.systemSummary = summary;
  }

  // ── Read-Only API ──────────────────────────────────────────────

  /**
   * Get cached risk state for a specific user.
   */
  getPosition(user: string): CachedRiskState | undefined {
    return this.positions.get(user.toLowerCase());
  }

  /**
   * Get all positions at risk (below HF threshold).
   */
  getPositionsAtRisk(hfThreshold = 1.25): CachedRiskState[] {
    const result: CachedRiskState[] = [];

    for (const pos of this.positions.values()) {
      if (pos.healthFactor > 0 && pos.healthFactor < hfThreshold) {
        result.push(pos);
      }
    }

    return result.sort((a, b) => a.healthFactor - b.healthFactor);
  }

  /**
   * Get all positions sorted by liquidation probability (highest first).
   */
  getHighestRiskPositions(limit = 20): CachedRiskState[] {
    const all = Array.from(this.positions.values())
      .filter((p) => p.debtUsd > 0)
      .sort((a, b) => b.liquidationProbability - a.liquidationProbability);

    return all.slice(0, limit);
  }

  /**
   * Get the system-level risk summary.
   */
  getSystemSummary(): SystemRiskSummary | null {
    return this.systemSummary;
  }

  /**
   * Get total cached position count.
   */
  size(): number {
    return this.positions.size;
  }
}
