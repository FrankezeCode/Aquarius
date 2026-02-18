/**
 * CRE Mitigation Adapter — Infrastructure Stub
 *
 * Bounded context: Aave / Vaults / Infrastructure
 *
 * Stub implementation of MitigationPort for MVP. Simulates executing
 * automated mitigation actions triggered by risk-intelligence snapshots.
 *
 * DDD role: Adapter (Hexagonal Architecture).
 *
 * Design:
 *   - Non-blocking: uses queueMicrotask for fire-and-forget dispatch
 *   - No await in the caller's hot path
 *   - Structured audit logging for all mitigation actions
 *
 * Production TODO:
 *   - Integrate with Chainlink CRE pipeline for actual execution
 *   - Route confidential actions through ConfidentialCREAdapter
 *   - Route public actions through PublicCREAdapter
 *   - Add execution receipt tracking
 *   - Add retry / dead-letter for failed mitigations
 */

import type { MitigationAction } from "../domain/risk-mitigation-strategy.js";
import type { AceRiskLevel } from "../../risk-intelligence/scorer.js";
import type { MitigationPort } from "../application/ports/vault.port.js";

// ── Stub Adapter ─────────────────────────────────────────────────────

export class StubCREMitigationAdapter implements MitigationPort {
  async executeMitigation(
    aqAssetId: string,
    action: MitigationAction,
    riskLevel: AceRiskLevel,
    confidential: boolean
  ): Promise<void> {
    // Non-blocking dispatch — queueMicrotask ensures caller returns
    // immediately. In production, this dispatches to CRE pipeline.
    queueMicrotask(() => {
      const pipeline = confidential ? "CONFIDENTIAL_CRE" : "PUBLIC_CRE";

      console.info(
        JSON.stringify({
          module: "vault-cre-adapter",
          event: "MITIGATION_DISPATCHED",
          aqAssetId,
          action,
          riskLevel,
          pipeline,
          timestamp: new Date().toISOString(),
        })
      );

      // TODO: CRE integration layer (future)
      // if (confidential) {
      //   await confidentialCREAdapter.execute({ ... });
      // } else {
      //   await publicCREAdapter.execute({ ... });
      // }
    });
  }
}
