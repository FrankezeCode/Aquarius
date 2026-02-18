/**
 * Staking Integration — Infrastructure Stub
 *
 * Bounded context: Aave / Vaults / Infrastructure
 *
 * Stub implementation of StakingPort for MVP. Simulates depositing
 * and withdrawing collateral from yield-bearing protocols.
 *
 * DDD role: Adapter (Hexagonal Architecture).
 *
 * Production TODO:
 *   - Integrate with Aave V3 aToken deposit/withdrawal
 *   - Integrate with Lido stETH wrapping
 *   - Add retry logic and error handling for on-chain calls
 *   - Support native ETH staking
 *   - Track gas costs
 */

import type { UnderlyingAsset } from "../domain/aq-asset.js";
import type { CollateralSource } from "../domain/collateral-asset.js";
import type { StakingPort } from "../application/ports/vault.port.js";

// ── Yield Rates (Stub) ──────────────────────────────────────────────

/** Simulated annual yield rates per source. */
const STUB_APR: Record<CollateralSource, number> = {
  AAVE_ATOKEN: 0.035,     // 3.5% APR
  LIDO_STETH: 0.042,      // 4.2% APR
  NATIVE_STAKING: 0.038,  // 3.8% APR
};

/** Default collateral source per underlying asset. */
const DEFAULT_SOURCE: Record<UnderlyingAsset, CollateralSource> = {
  ETH: "AAVE_ATOKEN",
  WETH: "AAVE_ATOKEN",
  POL: "AAVE_ATOKEN",
  USDC: "AAVE_ATOKEN",
  USDT: "AAVE_ATOKEN",
  DAI: "AAVE_ATOKEN",
  WBTC: "AAVE_ATOKEN",
};

// ── Stub Adapter ─────────────────────────────────────────────────────

export class StubStakingIntegration implements StakingPort {
  async deposit(
    underlying: UnderlyingAsset,
    amount: number
  ): Promise<{ source: CollateralSource; txHash: string }> {
    if (amount <= 0) {
      throw new Error(`Cannot deposit non-positive amount: ${amount}`);
    }

    const source = DEFAULT_SOURCE[underlying];
    const txHash = `0xstub_deposit_${Date.now().toString(16)}`;

    console.info(
      `[staking-stub] DEPOSIT | asset=${underlying} amount=${amount} source=${source} tx=${txHash}`
    );

    // Simulate: in production this would be an on-chain transaction
    return { source, txHash };
  }

  async withdraw(
    underlying: UnderlyingAsset,
    amount: number,
    source: CollateralSource
  ): Promise<{ actualAmount: number; txHash: string }> {
    if (amount <= 0) {
      throw new Error(`Cannot withdraw non-positive amount: ${amount}`);
    }

    const txHash = `0xstub_withdraw_${Date.now().toString(16)}`;

    console.info(
      `[staking-stub] WITHDRAW | asset=${underlying} amount=${amount} source=${source} tx=${txHash}`
    );

    // Simulate: return exact amount requested (in production, may vary)
    return { actualAmount: amount, txHash };
  }

  async queryPendingYield(
    underlying: UnderlyingAsset,
    source: CollateralSource,
    depositedAmount: number
  ): Promise<number> {
    // Simulate: daily yield based on APR stub
    const apr = STUB_APR[source];
    const dailyRate = apr / 365;
    const pendingYield = depositedAmount * dailyRate;

    console.info(
      `[staking-stub] YIELD QUERY | asset=${underlying} source=${source} deposited=${depositedAmount} pending=${pendingYield.toFixed(6)}`
    );

    return pendingYield;
  }
}
