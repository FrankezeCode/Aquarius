/**
 * Vault Monitoring Agent — Application Service
 *
 * Bounded context: Aave / Vaults / Application
 *
 * Evaluates an AaveRiskSnapshot against all aqAssets in the buffer vault
 * and emits risk alerts. This agent is READ-ONLY — it never mutates
 * vault state or calls infrastructure directly.
 *
 * DDD role: Application Service (orchestration, no domain logic).
 *
 * RULES:
 *   - Accepts a pre-scored AaveRiskSnapshot (never computes risk)
 *   - Reads aqAssets from BufferVaultPort (read-only query)
 *   - Returns VaultRiskAlert[] — no mutations, no side effects
 *   - Does NOT call CRE adapters or infrastructure
 *   - Synchronous evaluation for low-latency hot path
 */

import type { AaveRiskSnapshot } from "../../../domain/aave-risk-snapshot.js";
import type { BufferVaultPort } from "../ports/vault.port.js";
import type { AqAsset } from "../../domain/aq-asset.js";
import { requiresMitigation } from "../../domain/risk-mitigation-strategy.js";
import type { VaultRiskAlert } from "../../domain/agent-decision.js";

// ── Service ──────────────────────────────────────────────────────────

export class VaultMonitoringAgent {
  private readonly bufferVault: BufferVaultPort;

  constructor(bufferVault: BufferVaultPort) {
    this.bufferVault = bufferVault;
  }

  /**
   * Evaluate a risk snapshot against all aqAssets for a given owner.
   *
   * Returns an alert for each aqAsset indicating whether it requires
   * mitigation based on the pre-scored riskLevel.
   *
   * This is a pure read operation — no vault state is modified.
   */
  async evaluateByOwner(
    owner: string,
    snapshot: AaveRiskSnapshot
  ): Promise<VaultRiskAlert[]> {
    const assets = await this.bufferVault.listByOwner(owner);
    return this.buildAlerts(assets, snapshot);
  }

  /**
   * Evaluate a risk snapshot for a specific list of aqAssets.
   *
   * Useful when the caller already has the asset list (e.g., dry-run
   * orchestrator that pre-fetches assets).
   *
   * Pure synchronous evaluation — zero I/O, zero blocking.
   */
  evaluateAssets(
    assets: readonly AqAsset[],
    snapshot: AaveRiskSnapshot
  ): VaultRiskAlert[] {
    return this.buildAlerts(assets, snapshot);
  }

  // ── Internal ─────────────────────────────────────────────────────

  private buildAlerts(
    assets: readonly AqAsset[],
    snapshot: AaveRiskSnapshot
  ): VaultRiskAlert[] {
    return assets.map((asset) => ({
      assetId: asset.id,
      riskLevel: snapshot.riskLevel,
      requiresAction: requiresMitigation(snapshot.riskLevel),
    }));
  }
}
