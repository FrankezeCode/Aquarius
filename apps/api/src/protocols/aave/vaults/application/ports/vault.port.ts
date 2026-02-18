/**
 * Vault Port — Application Boundary
 *
 * Bounded context: Aave / Vaults / Application
 *
 * Defines the interfaces through which VaultService interacts with
 * infrastructure (buffer vault storage, staking integration, CRE adapter).
 *
 * DDD role: Port (Hexagonal Architecture).
 *
 * RULES:
 *   - ZERO infrastructure logic here — only interface contracts
 *   - All methods return Promises for async infrastructure calls
 *   - No protocol-specific imports beyond domain types
 */

import type { AqAsset, UnderlyingAsset } from "../../domain/aq-asset.js";
import type { CollateralAsset, CollateralSource } from "../../domain/collateral-asset.js";
import type { MitigationAction } from "../../domain/risk-mitigation-strategy.js";
import type { AceRiskLevel } from "../../../risk-intelligence/scorer.js";

// ── Buffer Vault Port ────────────────────────────────────────────────

/**
 * Storage port for aqAsset ↔ collateral mapping.
 *
 * Infrastructure implementation manages actual storage
 * (in-memory for MVP, on-chain or DB for production).
 */
export interface BufferVaultPort {
  /** Store a newly minted aqAsset with its backing collateral. */
  store(aqAsset: AqAsset, collateral: CollateralAsset): Promise<void>;

  /** Retrieve an aqAsset by its ID. Returns null if not found. */
  getAqAsset(id: string): Promise<AqAsset | null>;

  /** Retrieve collateral backing a specific aqAsset. */
  getCollateral(aqAssetId: string): Promise<CollateralAsset | null>;

  /** Remove an aqAsset and its collateral (on burn/withdrawal). */
  remove(aqAssetId: string): Promise<void>;

  /** Update an existing aqAsset record (yield accrual, etc.). */
  updateAqAsset(aqAsset: AqAsset): Promise<void>;

  /** Update an existing collateral record (yield harvest, etc.). */
  updateCollateral(collateral: CollateralAsset): Promise<void>;

  /** List all aqAssets for a given owner. */
  listByOwner(owner: string): Promise<AqAsset[]>;
}

// ── Staking Integration Port ─────────────────────────────────────────

/**
 * Port for depositing and withdrawing collateral from yield protocols.
 *
 * Infrastructure implementation wraps actual staking protocol calls
 * (Aave aToken deposits, Lido stETH, native staking, etc.).
 */
export interface StakingPort {
  /**
   * Deposit collateral into a yield-bearing protocol.
   * Returns the collateral source type used.
   */
  deposit(
    underlying: UnderlyingAsset,
    amount: number
  ): Promise<{ source: CollateralSource; txHash: string }>;

  /**
   * Withdraw collateral from a yield-bearing protocol.
   * Returns the actual amount withdrawn (may differ due to yield).
   */
  withdraw(
    underlying: UnderlyingAsset,
    amount: number,
    source: CollateralSource
  ): Promise<{ actualAmount: number; txHash: string }>;

  /**
   * Query current pending yield for a given collateral position.
   */
  queryPendingYield(
    underlying: UnderlyingAsset,
    source: CollateralSource,
    depositedAmount: number
  ): Promise<number>;
}

// ── CRE Mitigation Port ─────────────────────────────────────────────

/**
 * Port for executing automated mitigation actions via CRE pipelines.
 *
 * Infrastructure implementation dispatches to Public or Confidential
 * CRE adapters depending on the action's confidentiality requirement.
 */
export interface MitigationPort {
  /**
   * Execute an automated mitigation action for a vault position.
   *
   * @param aqAssetId    The aqAsset being protected
   * @param action       The mitigation action to execute
   * @param riskLevel    The risk level that triggered this action
   * @param confidential Whether this requires confidential execution
   */
  executeMitigation(
    aqAssetId: string,
    action: MitigationAction,
    riskLevel: AceRiskLevel,
    confidential: boolean
  ): Promise<void>;
}
