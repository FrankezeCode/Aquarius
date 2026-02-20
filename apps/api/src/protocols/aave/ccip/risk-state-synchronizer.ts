/**
 * CCIP — Risk State Synchronizer
 *
 * Maintains a consistent multi-chain risk view by aggregating
 * incoming CCIP risk signals from all chains.
 *
 * Keeps an in-memory map of per-chain risk levels.
 * Exposes aggregate risk assessment for cross-chain decisions.
 *
 * Currently: in-memory only. Future: shared KV store for multi-instance.
 */

import type { AceRiskLevel } from "../risk-intelligence/scorer.js";

export interface ChainRiskState {
  chainId: string;
  riskLevel: AceRiskLevel;
  composite: number;
  lastUpdated: number;
}

const RISK_WEIGHTS: Record<AceRiskLevel, number> = {
  safe: 0,
  watch: 0.25,
  "early-warning": 0.6,
  critical: 1.0,
};

export class RiskStateSynchronizer {
  private chainStates = new Map<string, ChainRiskState>();
  private staleThresholdMs: number;

  constructor(staleThresholdMs = 300_000) { // 5 minutes
    this.staleThresholdMs = staleThresholdMs;
  }

  /**
   * Update the risk state for a specific chain.
   */
  updateChainState(
    chainId: string,
    riskLevel: AceRiskLevel,
    composite: number
  ): void {
    this.chainStates.set(chainId, {
      chainId,
      riskLevel,
      composite,
      lastUpdated: Date.now(),
    });

    console.info(
      `[risk-sync] Updated ${chainId}: ${riskLevel} (composite=${composite})`
    );
  }

  /**
   * Get the aggregate risk level across all tracked chains.
   * Returns the highest risk level among non-stale chains.
   */
  getAggregateRiskLevel(): AceRiskLevel {
    const now = Date.now();
    let maxWeight = 0;
    let maxLevel: AceRiskLevel = "safe";

    for (const state of this.chainStates.values()) {
      if (now - state.lastUpdated > this.staleThresholdMs) continue;

      const weight = RISK_WEIGHTS[state.riskLevel];
      if (weight > maxWeight) {
        maxWeight = weight;
        maxLevel = state.riskLevel;
      }
    }

    return maxLevel;
  }

  /**
   * Check if any chain is reporting critical risk.
   */
  isSystemicStress(): boolean {
    const now = Date.now();
    for (const state of this.chainStates.values()) {
      if (now - state.lastUpdated > this.staleThresholdMs) continue;
      if (state.riskLevel === "critical") return true;
    }
    return false;
  }

  /**
   * Get all tracked chain states (for diagnostics).
   */
  getAllStates(): ChainRiskState[] {
    return Array.from(this.chainStates.values());
  }
}
