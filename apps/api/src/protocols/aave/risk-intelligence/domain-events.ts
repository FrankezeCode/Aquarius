/**
 * Risk-Intelligence — Domain Events
 *
 * Bounded context: Aave / Risk Intelligence
 *
 * Pure domain event types emitted by the risk-intelligence layer.
 * These events carry NO infrastructure references (no CCIP, no HTTP,
 * no blockchain SDK imports). They are consumed by the application
 * layer which decides how to dispatch them.
 *
 * DDD principle: Domain emits facts. Infrastructure reacts.
 */

import type { AceRiskLevel } from "./scorer.js";

// ── Domain Events ─────────────────────────────────────────────────────

/**
 * Emitted when the monitor determines a risk score should be
 * propagated cross-chain (e.g. critical risk detected on one chain
 * that may affect positions on other chains).
 */
export interface CrossChainRiskSignal {
  /** Chain where the risk was detected. */
  sourceChain: string;
  /** CRE workflow that triggered the assessment. */
  workflowId: string;
  /** ACE risk classification. */
  riskLevel: AceRiskLevel;
  /** Numeric composite score 0..1. */
  composite: number;
  /** Unix ms when the signal was created. */
  timestamp: number;
}
