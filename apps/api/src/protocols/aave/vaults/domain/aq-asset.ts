/**
 * aqAsset Entity — Vault Domain
 *
 * Bounded context: Aave / Vaults / Domain
 *
 * Represents a yield-bearing collateral token issued to Aave borrowers
 * upon deposit into the Aquarius Buffer Vault. Each aqAsset (e.g. aqETH,
 * aqPOL, aqWETH) is backed 1:1 by a deposited collateral asset and
 * accrues yield over time.
 *
 * DDD role: Entity (identity + lifecycle).
 *
 * RULES:
 *   - aqAsset can ONLY be minted when collateral is deposited
 *   - aqAsset is redeemable ONLY for the original underlying collateral
 *   - Balance must never be negative
 *   - accruedYield must never be negative
 *   - linkedVault must always reference a valid vault identifier
 */

// ── Types ────────────────────────────────────────────────────────────

/** Supported underlying assets for aqAsset minting. */
export type UnderlyingAsset =
  | "ETH"
  | "WETH"
  | "POL"
  | "USDC"
  | "USDT"
  | "DAI"
  | "WBTC";

/** Maps underlying asset to its aqAsset symbol. */
export function toAqSymbol(underlying: UnderlyingAsset): string {
  return `aq${underlying}`;
}

/**
 * aqAsset — yield-bearing collateral token.
 *
 * Minted on deposit, burned on withdrawal. Accrues yield from the
 * underlying staking / yield protocol integration.
 */
export interface AqAsset {
  /** Unique aqAsset token identifier (UUID or deterministic hash). */
  readonly id: string;
  /** Owner wallet address. */
  readonly owner: string;
  /** Underlying collateral type (ETH, POL, WETH, etc.). */
  readonly underlyingAsset: UnderlyingAsset;
  /** Current aqAsset balance (mirrors deposited collateral amount). */
  balance: number;
  /** Accumulated yield from staking / yield integration. */
  accruedYield: number;
  /** Timestamp of last yield accrual or balance update. */
  lastUpdate: number;
  /** Vault identifier this aqAsset is linked to. */
  readonly linkedVault: string;
}

// ── Factory ──────────────────────────────────────────────────────────

/**
 * Mint a new aqAsset for a collateral deposit.
 *
 * @param id            Unique token ID
 * @param owner         Depositor wallet address
 * @param underlying    The collateral type being deposited
 * @param amount        Collateral amount (must be > 0)
 * @param linkedVault   Vault ID this aqAsset belongs to
 * @returns             A freshly minted aqAsset
 * @throws              If amount <= 0
 */
export function mintAqAsset(
  id: string,
  owner: string,
  underlying: UnderlyingAsset,
  amount: number,
  linkedVault: string
): AqAsset {
  if (amount <= 0) {
    throw new Error(
      `Cannot mint aqAsset with non-positive amount: ${amount}`
    );
  }
  if (!id || !owner || !linkedVault) {
    throw new Error(
      "Cannot mint aqAsset: id, owner, and linkedVault are required"
    );
  }

  return {
    id,
    owner,
    underlyingAsset: underlying,
    balance: amount,
    accruedYield: 0,
    lastUpdate: Date.now(),
    linkedVault,
  };
}

// ── Mutations ────────────────────────────────────────────────────────

/**
 * Record accrued yield on an aqAsset.
 *
 * Pure domain operation — does not call infrastructure.
 */
export function accrueYield(asset: AqAsset, yieldAmount: number): AqAsset {
  if (yieldAmount < 0) {
    throw new Error(`Yield amount cannot be negative: ${yieldAmount}`);
  }
  return {
    ...asset,
    accruedYield: asset.accruedYield + yieldAmount,
    lastUpdate: Date.now(),
  };
}

/**
 * Compute the total redeemable value: balance + accrued yield.
 */
export function redeemableValue(asset: AqAsset): number {
  return asset.balance + asset.accruedYield;
}

/**
 * Validate an aqAsset is in a consistent state.
 * Used as a domain invariant check.
 */
export function validateAqAsset(asset: AqAsset): void {
  if (asset.balance < 0) {
    throw new Error(`aqAsset ${asset.id}: balance is negative`);
  }
  if (asset.accruedYield < 0) {
    throw new Error(`aqAsset ${asset.id}: accruedYield is negative`);
  }
  if (!asset.linkedVault) {
    throw new Error(`aqAsset ${asset.id}: missing linkedVault`);
  }
  if (!asset.owner) {
    throw new Error(`aqAsset ${asset.id}: missing owner`);
  }
}
