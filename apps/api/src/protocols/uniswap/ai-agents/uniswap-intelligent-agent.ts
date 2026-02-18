/**
 * Uniswap Intelligent Agent — Protocol-Specialized Decision Layer
 *
 * Bounded context: Uniswap / AI Agents
 *
 * Protocol-specific AI agent that produces ExecutionContext decisions
 * based on Uniswap risk snapshots. This agent NEVER executes directly —
 * it returns an ExecutionContext that must be routed through the
 * EscalationService for policy enforcement and execution routing.
 *
 * DDD role: Application Service (protocol-specific decision logic).
 *
 * Architecture constraints:
 *   - Returns ExecutionContext, never calls execution directly
 *   - Never bypasses EscalationService
 *   - Pure decision function — deterministic, no side effects
 *   - Imports only from shared/ types and own domain — NO cross-protocol imports
 *   - Suitable for future ML model training
 *
 * Decision logic:
 *   - priceImpact > 0.10 (10%) → CRITICAL, ESCALATE, confidential
 *   - priceImpact > 0.05 (5%) → HIGH, PROTECT_POSITION
 *   - volatility > 0.8 → MEDIUM, NOTIFY
 *   - Otherwise → LOW, no action (returns null)
 */

import type { ExecutionContext, RiskLevel } from "../../shared/types/execution-context.js";
import type { UniswapRiskSnapshot } from "../domain/uniswap-risk-context.js";

// ── Thresholds ───────────────────────────────────────────────────────

const CRITICAL_PRICE_IMPACT = 0.10;
const HIGH_PRICE_IMPACT = 0.05;
const VOLATILITY_ALERT_THRESHOLD = 0.8;

// ── Public API ───────────────────────────────────────────────────────

/**
 * Decide what action (if any) should be taken for the given Uniswap
 * risk snapshot.
 *
 * Returns an ExecutionContext if action is warranted, or `null` if
 * conditions are within acceptable range.
 *
 * @param agentId - The agent requesting the action
 * @param snapshot - Uniswap-specific risk snapshot
 * @returns ExecutionContext or null
 */
export function decideUniswapAction(
  agentId: string,
  snapshot: UniswapRiskSnapshot
): ExecutionContext | null {
  // ── Critical: extreme price impact, requires confidential handling ──
  if (snapshot.priceImpact > CRITICAL_PRICE_IMPACT) {
    return {
      agentId,
      action: "ESCALATE",
      payload: {
        protocol: "UNISWAP",
        reason: "critical-price-impact",
        priceImpact: snapshot.priceImpact,
        poolLiquidity: snapshot.poolLiquidity,
      },
      requiresConfidentiality: true,
      riskLevel: "CRITICAL" as RiskLevel,
    };
  }

  // ── High risk: significant price impact ────────────────────────
  if (snapshot.priceImpact > HIGH_PRICE_IMPACT) {
    return {
      agentId,
      action: "PROTECT_POSITION",
      payload: {
        protocol: "UNISWAP",
        reason: "high-price-impact",
        priceImpact: snapshot.priceImpact,
      },
      requiresConfidentiality: false,
      riskLevel: "HIGH" as RiskLevel,
    };
  }

  // ── Medium: high volatility, notify ────────────────────────────
  if (snapshot.volatility > VOLATILITY_ALERT_THRESHOLD) {
    return {
      agentId,
      action: "NOTIFY",
      payload: {
        protocol: "UNISWAP",
        reason: "high-volatility",
        volatility: snapshot.volatility,
      },
      requiresConfidentiality: false,
      riskLevel: "MEDIUM" as RiskLevel,
    };
  }

  // ── Low risk: no action needed ─────────────────────────────────
  return null;
}
