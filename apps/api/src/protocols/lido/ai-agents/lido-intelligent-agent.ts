/**
 * Lido Intelligent Agent — Protocol-Specialized Decision Layer
 *
 * Bounded context: Lido / AI Agents
 *
 * Protocol-specific AI agent that produces ExecutionContext decisions
 * based on Lido risk snapshots. This agent NEVER executes directly —
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
 *   - validatorHealth < 0.3 → CRITICAL, ESCALATE, confidential
 *   - validatorHealth < 0.5 → HIGH, PROTECT_POSITION
 *   - stakingAPR drops below 2.0% → MEDIUM, NOTIFY
 *   - Otherwise → LOW, no action (returns null)
 */

import type { ExecutionContext, RiskLevel } from "../../shared/types/execution-context.js";
import type { LidoRiskSnapshot } from "../domain/lido-risk-context.js";

// ── Thresholds ───────────────────────────────────────────────────────

const CRITICAL_VALIDATOR_HEALTH = 0.3;
const HIGH_VALIDATOR_HEALTH = 0.5;
const LOW_APR_THRESHOLD = 2.0;

// ── Public API ───────────────────────────────────────────────────────

/**
 * Decide what action (if any) should be taken for the given Lido
 * risk snapshot.
 *
 * Returns an ExecutionContext if action is warranted, or `null` if
 * conditions are within acceptable range.
 *
 * @param agentId - The agent requesting the action
 * @param snapshot - Lido-specific risk snapshot
 * @returns ExecutionContext or null
 */
export function decideLidoAction(
  agentId: string,
  snapshot: LidoRiskSnapshot
): ExecutionContext | null {
  // ── Critical: validator health severely degraded ───────────────
  if (snapshot.validatorHealth < CRITICAL_VALIDATOR_HEALTH) {
    return {
      agentId,
      action: "ESCALATE",
      payload: {
        protocol: "LIDO",
        reason: "critical-validator-health",
        validatorHealth: snapshot.validatorHealth,
        stakingAPR: snapshot.stakingAPR,
      },
      requiresConfidentiality: true,
      riskLevel: "CRITICAL" as RiskLevel,
    };
  }

  // ── High risk: validator health deteriorating ──────────────────
  if (snapshot.validatorHealth < HIGH_VALIDATOR_HEALTH) {
    return {
      agentId,
      action: "PROTECT_POSITION",
      payload: {
        protocol: "LIDO",
        reason: "high-risk-validator-health",
        validatorHealth: snapshot.validatorHealth,
      },
      requiresConfidentiality: false,
      riskLevel: "HIGH" as RiskLevel,
    };
  }

  // ── Medium: low staking APR, notify ────────────────────────────
  if (snapshot.stakingAPR < LOW_APR_THRESHOLD) {
    return {
      agentId,
      action: "NOTIFY",
      payload: {
        protocol: "LIDO",
        reason: "low-staking-apr",
        stakingAPR: snapshot.stakingAPR,
      },
      requiresConfidentiality: false,
      riskLevel: "MEDIUM" as RiskLevel,
    };
  }

  // ── Low risk: no action needed ─────────────────────────────────
  return null;
}
