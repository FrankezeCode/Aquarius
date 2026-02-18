/**
 * Buffer Vault — Infrastructure (In-Memory)
 *
 * Bounded context: Aave / Vaults / Infrastructure
 *
 * In-memory implementation of BufferVaultPort for MVP.
 * Stores aqAsset ↔ collateral mappings in Maps.
 *
 * DDD role: Adapter (Hexagonal Architecture).
 *
 * Production TODO:
 *   - Replace with on-chain vault contract interaction
 *   - Add persistence layer (PostgreSQL / Redis)
 *   - Add transaction boundaries for atomic operations
 *
 * Performance:
 *   - All operations are O(1) or O(n) where n = owner's positions
 *   - Zero I/O, zero blocking — suitable for low-latency hot path
 */

import type { AqAsset } from "../domain/aq-asset.js";
import type { CollateralAsset } from "../domain/collateral-asset.js";
import type { BufferVaultPort } from "../application/ports/vault.port.js";

// ── In-Memory Store ──────────────────────────────────────────────────

export class InMemoryBufferVault implements BufferVaultPort {
  /** aqAsset ID → AqAsset */
  private readonly aqAssets = new Map<string, AqAsset>();
  /** aqAsset ID → CollateralAsset */
  private readonly collaterals = new Map<string, CollateralAsset>();

  async store(aqAsset: AqAsset, collateral: CollateralAsset): Promise<void> {
    if (this.aqAssets.has(aqAsset.id)) {
      throw new Error(`aqAsset already exists: ${aqAsset.id}`);
    }
    this.aqAssets.set(aqAsset.id, aqAsset);
    this.collaterals.set(aqAsset.id, collateral);

    console.info(
      `[buffer-vault] STORE | aqAsset=${aqAsset.id} collateral=${collateral.id} underlying=${aqAsset.underlyingAsset}`
    );
  }

  async getAqAsset(id: string): Promise<AqAsset | null> {
    return this.aqAssets.get(id) ?? null;
  }

  async getCollateral(aqAssetId: string): Promise<CollateralAsset | null> {
    return this.collaterals.get(aqAssetId) ?? null;
  }

  async remove(aqAssetId: string): Promise<void> {
    const existed = this.aqAssets.delete(aqAssetId);
    this.collaterals.delete(aqAssetId);

    if (!existed) {
      console.warn(
        `[buffer-vault] REMOVE WARNING | aqAsset=${aqAssetId} not found`
      );
    } else {
      console.info(`[buffer-vault] REMOVE | aqAsset=${aqAssetId} burned`);
    }
  }

  async updateAqAsset(aqAsset: AqAsset): Promise<void> {
    if (!this.aqAssets.has(aqAsset.id)) {
      throw new Error(`Cannot update non-existent aqAsset: ${aqAsset.id}`);
    }
    this.aqAssets.set(aqAsset.id, aqAsset);
  }

  async updateCollateral(collateral: CollateralAsset): Promise<void> {
    if (!this.collaterals.has(collateral.linkedAqAssetId)) {
      throw new Error(
        `Cannot update collateral for non-existent aqAsset: ${collateral.linkedAqAssetId}`
      );
    }
    this.collaterals.set(collateral.linkedAqAssetId, collateral);
  }

  async listByOwner(owner: string): Promise<AqAsset[]> {
    const results: AqAsset[] = [];
    for (const asset of this.aqAssets.values()) {
      if (asset.owner === owner) {
        results.push(asset);
      }
    }
    return results;
  }

  // ── Diagnostics ──────────────────────────────────────────────────

  /** Total number of aqAssets in the vault (for testing/diagnostics). */
  get size(): number {
    return this.aqAssets.size;
  }

  /** Clear all data (for testing). */
  clear(): void {
    this.aqAssets.clear();
    this.collaterals.clear();
  }
}
