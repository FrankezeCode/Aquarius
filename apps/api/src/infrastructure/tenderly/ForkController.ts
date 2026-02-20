/**
 * Tenderly — Fork Controller (Infrastructure Only)
 *
 * Deterministic fork state manipulation for simulation scenarios.
 * Allows programmatic control of:
 *   - Oracle prices (via storage override)
 *   - User token balances
 *   - User borrow positions (via impersonated tx)
 *   - Fork snapshots / reverts
 *
 * This is NOT domain logic. This is fork manipulation infrastructure.
 * Domain layer NEVER imports this file.
 */

import { encodeFunctionData, parseEther, parseUnits, type Address } from "viem";
import { TenderlyRpcClient } from "./TenderlyRpcClient.js";
import { AaveContractReader } from "../aave/AaveContractReader.js";
import { AAVE_POOL_ABI, ERC20_ABI } from "../aave/abis.js";
import { AAVE_V3_POOL, WETH } from "../aave/constants.js";

export interface ForkStateChange {
  type: string;
  target: string;
  details: Record<string, unknown>;
  timestamp: number;
}

export class ForkController {
  private rpc: TenderlyRpcClient;
  private reader: AaveContractReader;
  private stateLog: ForkStateChange[] = [];

  constructor(rpcUrl: string) {
    this.rpc = new TenderlyRpcClient(rpcUrl);
    this.reader = new AaveContractReader(rpcUrl);
  }

  /**
   * Set ETH balance for an address on the fork.
   * Amount in ETH (e.g., "100" = 100 ETH).
   */
  async setEthBalance(address: string, amountEth: string): Promise<void> {
    const weiHex = `0x${parseEther(amountEth).toString(16)}`;
    await this.rpc.setBalance(address, weiHex);
    this.log("setEthBalance", address, { amountEth });
  }

  /**
   * Set ERC-20 token balance for an address on the fork.
   * Amount in token units (e.g., "1000" = 1000 USDC).
   */
  async setTokenBalance(
    token: string,
    address: string,
    amount: string,
    decimals = 18
  ): Promise<void> {
    const valueHex = `0x${parseUnits(amount, decimals).toString(16)}`;
    await this.rpc.setErc20Balance(token, address, valueHex);
    this.log("setTokenBalance", address, { token, amount, decimals });
  }

  /**
   * Simulate a borrow on behalf of a user (impersonated transaction).
   * This increases the user's debt and lowers their health factor.
   */
  async simulateBorrow(
    user: string,
    asset: string,
    amount: string,
    decimals = 18,
    interestRateMode = 2 // variable rate
  ): Promise<string> {
    const data = encodeFunctionData({
      abi: AAVE_POOL_ABI,
      functionName: "borrow",
      args: [
        asset as Address,
        parseUnits(amount, decimals),
        BigInt(interestRateMode),
        0,
        user as Address,
      ],
    });

    const txHash = await this.rpc.sendTransaction({
      from: user,
      to: AAVE_V3_POOL,
      data,
    });

    this.log("simulateBorrow", user, { asset, amount, txHash });
    return txHash;
  }

  /**
   * Simulate supplying collateral on behalf of a user.
   * Requires the user to have sufficient token balance + approval.
   */
  async simulateSupply(
    user: string,
    asset: string,
    amount: string,
    decimals = 18
  ): Promise<string> {
    const amountParsed = parseUnits(amount, decimals);

    // Approve Pool to spend tokens
    const approveData = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: "approve",
      args: [AAVE_V3_POOL as Address, amountParsed],
    });

    await this.rpc.sendTransaction({
      from: user,
      to: asset,
      data: approveData,
    });

    // Supply to Pool
    const supplyData = encodeFunctionData({
      abi: AAVE_POOL_ABI,
      functionName: "supply",
      args: [asset as Address, amountParsed, user as Address, 0],
    });

    const txHash = await this.rpc.sendTransaction({
      from: user,
      to: AAVE_V3_POOL,
      data: supplyData,
    });

    this.log("simulateSupply", user, { asset, amount, txHash });
    return txHash;
  }

  /**
   * Simulate a debt repayment on behalf of a user.
   */
  async simulateRepay(
    user: string,
    asset: string,
    amount: string,
    decimals = 18,
    interestRateMode = 2
  ): Promise<string> {
    const amountParsed = parseUnits(amount, decimals);

    const approveData = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: "approve",
      args: [AAVE_V3_POOL as Address, amountParsed],
    });

    await this.rpc.sendTransaction({
      from: user,
      to: asset,
      data: approveData,
    });

    const repayData = encodeFunctionData({
      abi: AAVE_POOL_ABI,
      functionName: "repay",
      args: [
        asset as Address,
        amountParsed,
        BigInt(interestRateMode),
        user as Address,
      ],
    });

    const txHash = await this.rpc.sendTransaction({
      from: user,
      to: AAVE_V3_POOL,
      data: repayData,
    });

    this.log("simulateRepay", user, { asset, amount, txHash });
    return txHash;
  }

  /**
   * Force a user's health factor down by increasing their borrow.
   * Reads current position, calculates required borrow, executes.
   */
  async forceHealthFactor(
    user: string,
    targetHF: number,
    borrowAsset: string = WETH,
    borrowDecimals = 18
  ): Promise<{ txHash: string; preHF: number; targetHF: number }> {
    const preData = this.reader.parseAccountData(
      await this.reader.getUserAccountData(user)
    );
    const preHF = preData.healthFactor;

    if (preHF <= targetHF) {
      console.info(`[fork-ctrl] User ${user} HF already at ${preHF} (target ${targetHF})`);
      return { txHash: "0x_no_action", preHF, targetHF };
    }

    if (preData.totalDebtUsd === 0) {
      throw new Error(
        `[fork-ctrl] User ${user} has no debt — cannot manipulate HF via borrow.`
      );
    }

    // Estimate additional borrow needed: HF = collateral * threshold / debt
    // targetHF = collateral * threshold / (debt + additionalBorrow)
    // additionalBorrow = (collateral * threshold / targetHF) - debt
    const threshold = preData.liquidationThreshold / 100;
    const requiredDebt = (preData.totalCollateralUsd * threshold) / targetHF;
    const additionalBorrowUsd = requiredDebt - preData.totalDebtUsd;

    if (additionalBorrowUsd <= 0) {
      return { txHash: "0x_no_action", preHF, targetHF };
    }

    // Get asset price to convert USD to token amount
    const assetPrice = await this.reader.getAssetPrice(borrowAsset);
    const borrowAmount = (additionalBorrowUsd / assetPrice) * 0.95; // 5% buffer

    // Ensure user has enough to cover gas
    await this.setEthBalance(user, "10");

    const txHash = await this.simulateBorrow(
      user,
      borrowAsset,
      borrowAmount.toFixed(borrowDecimals > 8 ? 8 : borrowDecimals),
      borrowDecimals
    );

    this.log("forceHealthFactor", user, { preHF, targetHF, additionalBorrowUsd, txHash });

    return { txHash, preHF, targetHF };
  }

  /**
   * Create a fork snapshot (for reverting later).
   */
  async snapshot(): Promise<string> {
    return this.rpc.snapshot();
  }

  /**
   * Revert fork to a previous snapshot.
   */
  async revert(snapshotId: string): Promise<boolean> {
    return this.rpc.revert(snapshotId);
  }

  /**
   * Get the full state change log for this session.
   */
  getStateLog(): ForkStateChange[] {
    return [...this.stateLog];
  }

  /**
   * Expose the reader for direct position checks.
   */
  getReader(): AaveContractReader {
    return this.reader;
  }

  /**
   * Expose the RPC client for direct low-level calls.
   */
  getRpcClient(): TenderlyRpcClient {
    return this.rpc;
  }

  private log(type: string, target: string, details: Record<string, unknown>): void {
    this.stateLog.push({ type, target, details, timestamp: Date.now() });
    console.info(`[fork-ctrl] ${type} | target=${target} | ${JSON.stringify(details)}`);
  }
}
