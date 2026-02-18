/**
 * VaultService — Application Service
 *
 * Bounded context: Aave / Vaults / Application
 *
 * Orchestrates deposit, withdrawal, yield harvesting, and automated
 * risk mitigation for Aquarius Buffer Vault positions.
 *
 * DDD role: Application Service (orchestration, no domain logic).
 *
 * RULES:
 *   - riskLevel is READ-ONLY — no scoring in this layer
 *   - All infrastructure calls go through ports (Hexagonal Architecture)
 *   - Deposit always mints aqAsset + creates collateral atomically
 *   - Withdrawal always burns aqAsset + returns collateral + yield
 *   - Mitigation is triggered ONLY by pre-scored riskLevel
 *   - Non-blocking dispatch for mitigation (low-latency)
 */

import {
  mintAqAsset,
  accrueYield,
  redeemableValue,
  validateAqAsset,
  type AqAsset,
  type UnderlyingAsset,
} from "../../domain/aq-asset.js";
import {
  createCollateralAsset,
  harvestYield as harvestCollateralYield,
  validateCollateral,
  type CollateralSource,
} from "../../domain/collateral-asset.js";
import {
  resolveStrategy,
  requiresMitigation,
} from "../../domain/risk-mitigation-strategy.js";
import type { AaveRiskSnapshot } from "../../../domain/aave-risk-snapshot.js";
import type {
  BufferVaultPort,
  StakingPort,
  MitigationPort,
} from "../ports/vault.port.js";

// ── Types ────────────────────────────────────────────────────────────

export interface DepositResult {
  aqAsset: AqAsset;
  collateralId: string;
  txHash: string;
}

export interface WithdrawResult {
  redeemedAmount: number;
  yieldAmount: number;
  totalReturned: number;
  txHash: string;
}

export interface MitigationResult {
  aqAssetId: string;
  action: string;
  triggered: boolean;
  riskLevel: string;
  timestamp: number;
}

// ── Service ──────────────────────────────────────────────────────────

export class VaultService {
  private readonly bufferVault: BufferVaultPort;
  private readonly staking: StakingPort;
  private readonly mitigation: MitigationPort;

  constructor(
    bufferVault: BufferVaultPort,
    staking: StakingPort,
    mitigation: MitigationPort
  ) {
    this.bufferVault = bufferVault;
    this.staking = staking;
    this.mitigation = mitigation;
  }

  // ── Deposit ──────────────────────────────────────────────────────

  /**
   * Deposit collateral and mint an aqAsset token.
   *
   * Flow:
   *   1. Deposit underlying into staking protocol
   *   2. Mint aqAsset domain entity
   *   3. Create CollateralAsset record
   *   4. Store both in buffer vault
   *   5. Return result
   */
  async deposit(
    owner: string,
    underlying: UnderlyingAsset,
    amount: number,
    vaultId: string
  ): Promise<DepositResult> {
    // 1. Deposit into yield protocol
    const { source, txHash } = await this.staking.deposit(underlying, amount);

    // 2. Mint aqAsset (domain factory enforces invariants)
    const aqAssetId = generateId("aq");
    const aqAsset = mintAqAsset(aqAssetId, owner, underlying, amount, vaultId);
    validateAqAsset(aqAsset);

    // 3. Create backing collateral record
    const collateralId = generateId("col");
    const collateral = createCollateralAsset(
      collateralId,
      aqAssetId,
      underlying,
      source,
      amount
    );
    validateCollateral(collateral);

    // 4. Atomic store
    await this.bufferVault.store(aqAsset, collateral);

    console.info(
      `[vault] DEPOSIT | owner=${owner} asset=${underlying} amount=${amount} aqAsset=${aqAssetId} tx=${txHash}`
    );

    return { aqAsset, collateralId, txHash };
  }

  // ── Withdraw ─────────────────────────────────────────────────────

  /**
   * Burn aqAsset and return collateral + accrued yield.
   *
   * Flow:
   *   1. Retrieve aqAsset and collateral from vault
   *   2. Harvest any pending yield from collateral
   *   3. Withdraw from staking protocol
   *   4. Remove records from buffer vault
   *   5. Return total amount
   */
  async withdraw(aqAssetId: string): Promise<WithdrawResult> {
    // 1. Retrieve
    const aqAsset = await this.bufferVault.getAqAsset(aqAssetId);
    if (!aqAsset) {
      throw new Error(`aqAsset not found: ${aqAssetId}`);
    }

    const collateral = await this.bufferVault.getCollateral(aqAssetId);
    if (!collateral) {
      throw new Error(
        `Collateral not found for aqAsset: ${aqAssetId}`
      );
    }

    // 2. Harvest pending yield
    const { harvested } = harvestCollateralYield(collateral);
    const finalAqAsset = accrueYield(aqAsset, harvested);

    // 3. Withdraw from staking
    const totalRedeem = redeemableValue(finalAqAsset);
    const { actualAmount, txHash } = await this.staking.withdraw(
      collateral.underlying,
      totalRedeem,
      collateral.source
    );

    // 4. Remove from vault (burn aqAsset)
    await this.bufferVault.remove(aqAssetId);

    console.info(
      `[vault] WITHDRAW | aqAsset=${aqAssetId} balance=${aqAsset.balance} yield=${harvested} total=${actualAmount} tx=${txHash}`
    );

    return {
      redeemedAmount: aqAsset.balance,
      yieldAmount: finalAqAsset.accruedYield,
      totalReturned: actualAmount,
      txHash,
    };
  }

  // ── Risk Mitigation ──────────────────────────────────────────────

  /**
   * Evaluate a risk snapshot and trigger automated mitigation if needed.
   *
   * This method is called when new risk-intelligence snapshots arrive.
   * It reads the pre-scored riskLevel (NEVER computes risk) and resolves
   * the appropriate vault mitigation strategy.
   *
   * Non-blocking: mitigation dispatch uses fire-and-forget via port.
   */
  async evaluateAndMitigate(
    aqAssetId: string,
    snapshot: AaveRiskSnapshot
  ): Promise<MitigationResult> {
    const now = Date.now();
    const strategy = resolveStrategy(snapshot.riskLevel);

    if (!requiresMitigation(snapshot.riskLevel)) {
      console.info(
        `[vault] MITIGATION SKIP | aqAsset=${aqAssetId} riskLevel=${snapshot.riskLevel} action=HOLD`
      );
      return {
        aqAssetId,
        action: strategy.action,
        triggered: false,
        riskLevel: snapshot.riskLevel,
        timestamp: now,
      };
    }

    // Non-blocking dispatch — fire-and-forget via port
    // Uses queueMicrotask internally in the infrastructure adapter
    queueMicrotask(() => {
      this.mitigation
        .executeMitigation(
          aqAssetId,
          strategy.action,
          snapshot.riskLevel,
          strategy.requiresConfidentiality
        )
        .catch((err) => {
          console.error(
            `[vault] MITIGATION ERROR | aqAsset=${aqAssetId} action=${strategy.action}`,
            err
          );
        });
    });

    console.info(
      `[vault] MITIGATION TRIGGERED | aqAsset=${aqAssetId} riskLevel=${snapshot.riskLevel} action=${strategy.action} confidential=${strategy.requiresConfidentiality}`
    );

    return {
      aqAssetId,
      action: strategy.action,
      triggered: true,
      riskLevel: snapshot.riskLevel,
      timestamp: now,
    };
  }

  // ── Yield Harvest ────────────────────────────────────────────────

  /**
   * Harvest yield for a specific aqAsset position.
   * Updates both the collateral and aqAsset records.
   */
  async harvestYield(aqAssetId: string): Promise<number> {
    const aqAsset = await this.bufferVault.getAqAsset(aqAssetId);
    if (!aqAsset) {
      throw new Error(`aqAsset not found: ${aqAssetId}`);
    }

    const collateral = await this.bufferVault.getCollateral(aqAssetId);
    if (!collateral) {
      throw new Error(`Collateral not found for aqAsset: ${aqAssetId}`);
    }

    // Query pending yield from staking protocol
    const pendingYield = await this.staking.queryPendingYield(
      collateral.underlying,
      collateral.source,
      collateral.amount
    );

    if (pendingYield <= 0) {
      return 0;
    }

    // Update collateral and aqAsset
    const { collateral: updatedCollateral, harvested } =
      harvestCollateralYield({ ...collateral, pendingYield });
    const updatedAqAsset = accrueYield(aqAsset, harvested);

    await this.bufferVault.updateCollateral(updatedCollateral);
    await this.bufferVault.updateAqAsset(updatedAqAsset);

    console.info(
      `[vault] YIELD HARVEST | aqAsset=${aqAssetId} harvested=${harvested}`
    );

    return harvested;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

/** Generate a simple prefixed ID. Production: use UUID v4. */
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
