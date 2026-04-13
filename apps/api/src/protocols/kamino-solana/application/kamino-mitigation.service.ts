/**
 * Kamino mitigation — application edge (no Klend / no Solana RPC).
 *
 * Phase C: structured audit + notification hook; on-chain execution deferred.
 */

import type { KaminoMitigationIntent } from "../../../domain/events/KaminoMitigationIntent.js";

export interface KaminoMitigationResult {
  readonly status: "acknowledged";
  readonly intentId: string;
  readonly loggedAt: number;
}

export class KaminoMitigationService {
  /**
   * Records escalation mitigation intent (audit). Does not submit transactions.
   */
  async execute(intent: KaminoMitigationIntent): Promise<KaminoMitigationResult> {
    const loggedAt = Date.now();
    // Structured audit line — no secrets; wallet/market are public identifiers.
    console.info(
      `[kamino-mitigation] intent=${intent.id} stage=${intent.stage} action=${intent.suggestedAction} wallet=${intent.wallet} market=${intent.marketPubkey} composite=${intent.composite01.toFixed(4)} agent=${intent.agentId}${intent.correlationId ? ` correlation=${intent.correlationId}` : ""}`
    );
    return {
      status: "acknowledged",
      intentId: intent.id,
      loggedAt,
    };
  }
}

/** Process-local singleton for webhook orchestration. */
let instance: KaminoMitigationService | null = null;

export function getKaminoMitigationService(): KaminoMitigationService {
  if (!instance) {
    instance = new KaminoMitigationService();
  }
  return instance;
}

export function resetKaminoMitigationServiceForTests(): void {
  instance = null;
}
