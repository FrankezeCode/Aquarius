/**
 * Vault Action Agent — Application Service
 *
 * Bounded context: Aave / Vaults / Application
 *
 * Deterministic decision engine that maps a risk level to a concrete
 * VaultAgentDecision. Reuses the canonical strategy mapping from the
 * domain layer (risk-mitigation-strategy.ts).
 *
 * DDD role: Application Service (decision orchestration).
 *
 * RULES:
 *   - Deterministic: same input always produces the same decision
 *   - Delegates action mapping to resolveStrategy() — no duplicate logic
 *   - Does NOT call CRE, infrastructure, or any external service
 *   - Pure computation, synchronous, zero I/O
 *   - LLM-pluggable: future iterations can replace/augment decide()
 *     with an LLM call, keeping the same interface
 *
 * Future TODO:
 *   - Add optional LLM advisor stub for enhanced reasoning
 *   - Add confidence scoring to decisions
 */

import { resolveStrategy } from "../../domain/risk-mitigation-strategy.js";
import type { AceRiskLevel } from "../../../risk-intelligence/scorer.js";
import type { VaultAgentDecision } from "../../domain/agent-decision.js";

// ── Service ──────────────────────────────────────────────────────────

export class VaultActionAgent {
  /**
   * Produce a mitigation decision for a given aqAsset and risk level.
   *
   * Delegates to the canonical strategy map in risk-mitigation-strategy.ts.
   * This ensures zero duplication of risk-to-action mapping logic.
   *
   * @param input  The asset ID and pre-scored risk level
   * @returns      A VaultAgentDecision describing the intended action
   */
  decide(input: {
    assetId: string;
    riskLevel: AceRiskLevel;
  }): VaultAgentDecision {
    const strategy = resolveStrategy(input.riskLevel);

    return {
      assetId: input.assetId,
      riskLevel: input.riskLevel,
      action: strategy.action,
      reason: `[deterministic] ${strategy.description}`,
      timestamp: Date.now(),
    };
  }
}
