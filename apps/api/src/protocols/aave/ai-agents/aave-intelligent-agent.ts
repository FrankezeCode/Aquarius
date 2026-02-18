/**
 * Aave Intelligent Agent — Protocol-Specialized Decision Layer
 *
 * Bounded context: Aave / AI Agents
 *
 * Protocol-specific AI agent that produces ExecutionContext decisions
 * based on the canonical AaveRiskSnapshot DTO from the Aave domain.
 * This agent NEVER executes directly — it returns an ExecutionContext
 * that must be routed through EscalationService for policy enforcement.
 *
 * DDD role: Application Service (protocol-specific decision logic).
 *
 * CRITICAL DDD BOUNDARY RULES:
 *   - Imports AaveRiskSnapshot from protocols/aave/domain/ (canonical source)
 *   - Does NOT import from agent-security/ (reverse dependency FORBIDDEN)
 *   - Reads ONLY the pre-computed riskLevel from the snapshot
 *   - Contains ZERO threshold constants — all scoring lives in risk-intelligence/
 *   - Does NOT compare healthFactor, volatilityScore, or any raw metric
 *     against hardcoded numbers (that would be parallel risk classification)
 *   - The ONLY field this agent branches on is snapshot.riskLevel
 *
 * Architecture constraints:
 *   - Returns ExecutionContext, never calls execution directly
 *   - Never bypasses EscalationService
 *   - Never imports infrastructure modules
 *   - Pure decision function — deterministic, no side effects
 *   - Suitable for future ML model training (input → output mapping)
 *
 * Decision logic (based EXCLUSIVELY on pre-computed riskLevel):
 *   - "critical"      → ESCALATE, require confidentiality
 *   - "early-warning" → PROTECT_POSITION
 *   - "watch"         → NOTIFY
 *   - "safe"          → no action (returns null)
 */

import type { ExecutionContext, RiskLevel } from "../../shared/types/execution-context.js";
import type { AaveRiskSnapshot } from "../domain/aave-risk-snapshot.js";

// ── NO THRESHOLD CONSTANTS ──────────────────────────────────────────
//
// This agent does NOT define any numeric thresholds.
// Risk classification is the sole responsibility of risk-intelligence/scorer.ts.
// The agent reads snapshot.riskLevel and acts on it.

// ── Public API ───────────────────────────────────────────────────────

/**
 * Decide what action (if any) should be taken for the given Aave
 * risk snapshot.
 *
 * Reads ONLY snapshot.riskLevel (pre-computed by risk-intelligence/scorer.ts).
 * Attaches snapshot metrics to the payload for downstream audit/logging,
 * but NEVER uses raw metrics for branching decisions.
 *
 * @param agentId - The agent requesting the action
 * @param snapshot - Canonical AaveRiskSnapshot from the Aave domain
 * @returns ExecutionContext or null
 */
export function decideAaveAction(
  agentId: string,
  snapshot: AaveRiskSnapshot
): ExecutionContext | null {
  // All branching is on the pre-computed riskLevel from risk-intelligence.
  // Raw metrics are attached to the payload for observability only.

  switch (snapshot.riskLevel) {
    case "critical":
      return {
        agentId,
        action: "ESCALATE",
        payload: {
          protocol: "AAVE",
          reason: "critical-risk-level",
          healthFactor: snapshot.healthFactor,
          liquidityIndex: snapshot.liquidityIndex,
          riskLevel: snapshot.riskLevel,
        },
        requiresConfidentiality: true,
        riskLevel: "CRITICAL" as RiskLevel,
      };

    case "early-warning":
      return {
        agentId,
        action: "PROTECT_POSITION",
        payload: {
          protocol: "AAVE",
          reason: "early-warning-risk-level",
          healthFactor: snapshot.healthFactor,
          riskLevel: snapshot.riskLevel,
        },
        requiresConfidentiality: false,
        riskLevel: "HIGH" as RiskLevel,
      };

    case "watch":
      return {
        agentId,
        action: "NOTIFY",
        payload: {
          protocol: "AAVE",
          reason: "watch-risk-level",
          volatilityScore: snapshot.volatilityScore,
          riskLevel: snapshot.riskLevel,
        },
        requiresConfidentiality: false,
        riskLevel: "MEDIUM" as RiskLevel,
      };

    case "safe":
      // No action needed — risk-intelligence classified this as safe.
      return null;
  }
}
