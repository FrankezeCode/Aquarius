/**
 * CollateralAsset Entity — Vault Domain
 *
 * Bounded context: Aave / Vaults / Domain
 *
 * Wraps an Aave aToken or staked token (aETH, aPOL, stETH, etc.)
 * and tracks yield accrual from the underlying protocol.
 *
 * DDD role: Entity (identity + lifecycle).
 *
 * RULES:
 *   - Each CollateralAsset is linked 1:1 to an aqAsset
 *   - Yield is tracked independently from the aqAsset layer
 *   - CollateralAsset cannot exist without a backing deposit
 *   - Amount must always be > 0
 */

import type { UnderlyingAsset } from "./aq-asset.js";

// ── Types ────────────────────────────────────────────────────────────

/** Source protocol for the yield-bearing token. */
export type CollateralSource = "AAVE_ATOKEN" | "LIDO_STETH" | "NATIVE_STAKING";

/**
 * CollateralAsset — wraps a yield-bearing token held in the vault.
 *
 * Represents the actual collateral backing an aqAsset. The vault
 * holds this on behalf of the depositor and forwards yield.
 */
export interface CollateralAsset {
  /** Unique collateral record identifier. */
  readonly id: string;
  /** The aqAsset ID this collateral backs. */
  readonly linkedAqAssetId: string;
  /** Underlying asset type. */
  readonly underlying: UnderlyingAsset;
  /** Source of the yield-bearing wrapper (aToken, stETH, etc.). */
  readonly source: CollateralSource;
  /** Amount of collateral held. */
  amount: number;
  /** Yield accrued from the underlying protocol since last harvest. */
  pendingYield: number;
  /** Timestamp of the last yield harvest. */
  lastHarvest: number;
  /** Unix ms when this collateral was deposited. */
  readonly depositedAt: number;
}

// ── Factory ──────────────────────────────────────────────────────────

/**
 * Create a new CollateralAsset record for a deposit.
 *
 * @param id               Unique collateral record ID
 * @param linkedAqAssetId  The aqAsset this collateral backs
 * @param underlying       The underlying asset type
 * @param source           Protocol source for yield-bearing wrapper
 * @param amount           Deposited amount (must be > 0)
 * @returns                A new CollateralAsset
 * @throws                 If amount <= 0
 */
export function createCollateralAsset(
  id: string,
  linkedAqAssetId: string,
  underlying: UnderlyingAsset,
  source: CollateralSource,
  amount: number
): CollateralAsset {
  if (amount <= 0) {
    throw new Error(
      `Cannot create collateral with non-positive amount: ${amount}`
    );
  }
  if (!id || !linkedAqAssetId) {
    throw new Error(
      "Cannot create collateral: id and linkedAqAssetId are required"
    );
  }

  const now = Date.now();
  return {
    id,
    linkedAqAssetId,
    underlying,
    source,
    amount,
    pendingYield: 0,
    lastHarvest: now,
    depositedAt: now,
  };
}

// ── Mutations ────────────────────────────────────────────────────────

/**
 * Record pending yield from the underlying protocol.
 * Called during periodic yield harvests.
 */
export function recordYield(
  collateral: CollateralAsset,
  yieldAmount: number
): CollateralAsset {
  if (yieldAmount < 0) {
    throw new Error(`Yield amount cannot be negative: ${yieldAmount}`);
  }
  return {
    ...collateral,
    pendingYield: collateral.pendingYield + yieldAmount,
    lastHarvest: Date.now(),
  };
}

/**
 * Harvest pending yield — resets pendingYield to 0 and returns
 * the harvested amount for forwarding to the aqAsset.
 */
export function harvestYield(
  collateral: CollateralAsset
): { collateral: CollateralAsset; harvested: number } {
  const harvested = collateral.pendingYield;
  return {
    collateral: {
      ...collateral,
      pendingYield: 0,
      lastHarvest: Date.now(),
    },
    harvested,
  };
}

/**
 * Validate a CollateralAsset is in a consistent state.
 */
export function validateCollateral(collateral: CollateralAsset): void {
  if (collateral.amount <= 0) {
    throw new Error(
      `Collateral ${collateral.id}: amount must be positive`
    );
  }
  if (collateral.pendingYield < 0) {
    throw new Error(
      `Collateral ${collateral.id}: pendingYield is negative`
    );
  }
  if (!collateral.linkedAqAssetId) {
    throw new Error(
      `Collateral ${collateral.id}: missing linkedAqAssetId`
    );
  }
}
