/**
 * Risk Mitigation Strategy — Vault Domain
 *
 * Bounded context: Aave / Vaults / Domain
 *
 * Defines automated mitigation actions that the vault executes based on
 * the `riskLevel` from an AaveRiskSnapshot. The vault layer NEVER
 * computes risk — it only reads the pre-scored `riskLevel` and reacts.
 *
 * DDD role: Value Object (immutable strategy definition).
 *
 * RULES:
 *   - Strategy is driven ONLY by AaveRiskSnapshot.riskLevel
 *   - No scoring, no threshold comparisons on raw metrics
 *   - No fallback defaults for riskLevel — if missing, throw
 *   - Each riskLevel maps to exactly one MitigationAction
 */

import type { AceRiskLevel } from "../../risk-intelligence/scorer.js";

// ── Types ────────────────────────────────────────────────────────────

/**
 * Automated mitigation actions the vault can perform.
 *
 *   HOLD              — No action, position is healthy
 *   INCREASE_BUFFER   — Shift additional collateral to buffer vault
 *   REBALANCE         — Rebalance collateral across yield sources
 *   PROTECT           — Activate protective withdrawal to reduce exposure
 *   EMERGENCY_EXIT    — Emergency liquidation protection (full withdrawal)
 */
export type MitigationAction =
  | "HOLD"
  | "INCREASE_BUFFER"
  | "REBALANCE"
  | "PROTECT"
  | "EMERGENCY_EXIT";

/**
 * Risk mitigation strategy: maps a risk level to an automated vault action.
 */
export interface RiskMitigationStrategy {
  /** The risk level this strategy responds to. */
  readonly riskLevel: AceRiskLevel;
  /** The automated action to execute. */
  readonly action: MitigationAction;
  /** Human-readable description for audit logs. */
  readonly description: string;
  /** Whether this action requires confidential execution. */
  readonly requiresConfidentiality: boolean;
}

// ── Strategy Map ─────────────────────────────────────────────────────

/**
 * Canonical mapping from AceRiskLevel to vault mitigation action.
 *
 * This is the ONLY place where risk-to-action mapping is defined
 * for the vault layer. No other file should duplicate this logic.
 */
const STRATEGY_MAP: Record<AceRiskLevel, RiskMitigationStrategy> = {
  safe: {
    riskLevel: "safe",
    action: "HOLD",
    description: "Position healthy — no mitigation needed",
    requiresConfidentiality: false,
  },
  watch: {
    riskLevel: "watch",
    action: "INCREASE_BUFFER",
    description:
      "Minor risk detected — increasing buffer allocation as precaution",
    requiresConfidentiality: false,
  },
  "early-warning": {
    riskLevel: "early-warning",
    action: "PROTECT",
    description:
      "Significant risk — activating protective collateral withdrawal",
    requiresConfidentiality: true,
  },
  critical: {
    riskLevel: "critical",
    action: "EMERGENCY_EXIT",
    description:
      "Critical risk — emergency exit to prevent liquidation losses",
    requiresConfidentiality: true,
  },
};

// ── Public API ───────────────────────────────────────────────────────

/**
 * Resolve the vault mitigation strategy for a given risk level.
 *
 * @param riskLevel  Pre-computed risk level from AaveRiskSnapshot
 * @returns          The matching RiskMitigationStrategy
 * @throws           If riskLevel is missing or unrecognized
 */
export function resolveStrategy(
  riskLevel: AceRiskLevel
): RiskMitigationStrategy {
  const strategy = STRATEGY_MAP[riskLevel];
  if (!strategy) {
    throw new Error(
      `Risk level missing or unrecognized — vault cannot operate without a scored riskLevel. Received: ${String(riskLevel)}`
    );
  }
  return strategy;
}

/**
 * Determine whether a given risk level requires automated mitigation
 * (i.e., any action beyond HOLD).
 */
export function requiresMitigation(riskLevel: AceRiskLevel): boolean {
  return resolveStrategy(riskLevel).action !== "HOLD";
}

/**
 * Return all defined strategies (for diagnostics / admin UI).
 */
export function allStrategies(): readonly RiskMitigationStrategy[] {
  return Object.values(STRATEGY_MAP);
}
