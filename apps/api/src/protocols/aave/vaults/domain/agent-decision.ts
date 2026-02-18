/**
 * Vault Agent Decision — Domain Value Object
 *
 * Bounded context: Aave / Vaults / Domain
 *
 * Represents a decision made by a vault agent in response to a risk
 * snapshot. This is a pure value object — no side effects, no I/O.
 *
 * DDD role: Value Object (immutable data carrier).
 *
 * RULES:
 *   - Decisions are driven ONLY by pre-scored AceRiskLevel
 *   - No scoring, no threshold comparisons on raw metrics
 *   - The action field reuses MitigationAction from risk-mitigation-strategy
 *   - Decisions are audit-logged but never directly executed here
 */

import type { MitigationAction } from "./risk-mitigation-strategy.js";
import type { AceRiskLevel } from "../../risk-intelligence/scorer.js";

// ── Types ────────────────────────────────────────────────────────────

/**
 * A decision produced by a vault agent after evaluating a risk snapshot.
 *
 * This is a dry-run artifact — it describes what the agent WOULD do,
 * but does NOT execute it. Execution is handled by the CRE pipeline
 * (future integration).
 */
export interface VaultAgentDecision {
  /** The aqAsset this decision applies to. */
  readonly assetId: string;
  /** The pre-scored risk level that triggered this decision. */
  readonly riskLevel: AceRiskLevel;
  /** The mitigation action the agent decided on. */
  readonly action: MitigationAction;
  /** Human-readable reason for the decision (audit trail). */
  readonly reason: string;
  /** When the decision was made. */
  readonly timestamp: number;
}

/**
 * An alert emitted by the monitoring agent for a single aqAsset.
 * Carries the asset ID and whether the risk level requires action.
 */
export interface VaultRiskAlert {
  /** The aqAsset being evaluated. */
  readonly assetId: string;
  /** The pre-scored risk level from the snapshot. */
  readonly riskLevel: AceRiskLevel;
  /** Whether this risk level requires mitigation (not HOLD). */
  readonly requiresAction: boolean;
}
