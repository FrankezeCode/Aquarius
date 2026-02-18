/**
 * Secure Vault Agent — Application Service
 *
 * Bounded context: Aave / Vaults / Application
 *
 * Wraps VaultActionAgent with policy enforcement from the existing
 * risk-mitigation-strategy domain. Ensures that only actionable risk
 * levels produce decisions, and non-actionable levels are silently
 * skipped (returning null).
 *
 * DDD role: Application Service (security orchestration).
 *
 * RULES:
 *   - Policy check comes BEFORE decision — fail-fast
 *   - Uses requiresMitigation() from domain (canonical policy)
 *   - Does NOT re-implement security logic
 *   - Does NOT call infrastructure or CRE adapters
 *   - Returns null if risk level does not require mitigation
 *   - Synchronous, zero I/O
 *
 * Architecture note:
 *   This does NOT import from agent-security/ directly — it uses the
 *   vault domain's own requiresMitigation() which is the canonical
 *   source of truth for vault-layer policy. The agent-security layer
 *   (aave-agent-policy.guard.ts) handles protocol-wide agent authorization,
 *   which is a separate concern applied at the EscalationService level.
 */

import { VaultActionAgent } from "./action-agent.service.js";
import { requiresMitigation } from "../../domain/risk-mitigation-strategy.js";
import type { AceRiskLevel } from "../../../risk-intelligence/scorer.js";
import type { VaultAgentDecision } from "../../domain/agent-decision.js";

// ── Service ──────────────────────────────────────────────────────────

export class SecureVaultAgent {
  private readonly actionAgent: VaultActionAgent;

  constructor(actionAgent: VaultActionAgent) {
    this.actionAgent = actionAgent;
  }

  /**
   * Evaluate whether the given risk level warrants action, and if so,
   * produce a secure decision.
   *
   * @param input  The asset ID and pre-scored risk level
   * @returns      A VaultAgentDecision if mitigation needed, or null
   */
  execute(input: {
    assetId: string;
    riskLevel: AceRiskLevel;
  }): VaultAgentDecision | null {
    // Policy gate: skip if risk level does not require mitigation
    if (!requiresMitigation(input.riskLevel)) {
      return null;
    }

    return this.actionAgent.decide(input);
  }
}
