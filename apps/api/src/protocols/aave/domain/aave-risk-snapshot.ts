/**
 * Aave Risk Snapshot — Canonical Domain DTO
 *
 * Bounded context: Aave / Domain
 *
 * The single source of truth for Aave risk snapshot data. This DTO
 * is produced by the risk-intelligence pipeline and consumed by:
 *   - agent-security (policy validation)
 *   - ai-agents (decision logic)
 *   - application services (escalation)
 *
 * DDD role: Value Object (immutable data carrier, no logic).
 *
 * RULES:
 *   - No scoring logic — just structure
 *   - No computation — just fields
 *   - This is the ONLY place AaveRiskSnapshot is defined
 *   - All consumers import from here
 */

import type { AceRiskLevel } from "../risk-intelligence/scorer.js";

// ── Types ────────────────────────────────────────────────────────────

/**
 * Canonical Aave risk snapshot DTO.
 *
 * Produced by risk-intelligence pipeline (scorer, correlator, monitor).
 * Consumed by agent-security, AI agents, and application services.
 *
 * Fields:
 *   healthFactor    — Average HF across sampled positions. < 1.0 = liquidatable.
 *   debtRatio       — Aggregate debt-to-collateral ratio (0..1).
 *   liquidityIndex  — Liquidity change as decimal fraction. Negative = drop.
 *   volatilityScore — Normalized volatility metric (0..1). Higher = more volatile.
 *   riskLevel       — ACE-classified risk level (computed by scorer.ts).
 *   timestamp       — Unix ms when this snapshot was produced.
 */
export interface AaveRiskSnapshot {
  /** Average health factor across sampled positions. */
  healthFactor: number;
  /** Aggregate debt-to-collateral ratio (0..1). */
  debtRatio: number;
  /** Liquidity change as decimal fraction. Negative = drop. */
  liquidityIndex: number;
  /** Normalized volatility metric (0..1). Higher = more volatile. */
  volatilityScore: number;
  /** ACE-classified risk level — computed ONLY by risk-intelligence. */
  riskLevel: AceRiskLevel;
  /** Unix ms when this snapshot was produced. */
  timestamp: number;
}
