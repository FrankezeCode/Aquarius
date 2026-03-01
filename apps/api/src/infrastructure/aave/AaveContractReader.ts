/**
 * Aave V3 — Contract Reader (Infrastructure Only)
 *
 * Reads Aave V3 on-chain state via any JSON-RPC endpoint.
 * Shared by both TenderlyMarketDataProvider and OnchainMarketDataProvider.
 *
 * Domain layer NEVER imports this file.
 * Only infrastructure adapters use it.
 */

import { createPublicClient, http, formatUnits, type PublicClient, type Address } from "viem";
import { mainnet, polygon } from "viem/chains";
import { AAVE_POOL_ABI, AAVE_ORACLE_ABI } from "./abis.js";
import {
  AAVE_BASE_CURRENCY_DECIMALS,
  AAVE_HF_DECIMALS,
  getAavePoolAddress,
  getAaveOracleAddress,
} from "./constants.js";

export interface RawAccountData {
  user: string;
  totalCollateralBase: bigint;
  totalDebtBase: bigint;
  availableBorrowsBase: bigint;
  currentLiquidationThreshold: bigint;
  ltv: bigint;
  healthFactor: bigint;
}

export interface ParsedAccountData {
  user: string;
  totalCollateralUsd: number;
  totalDebtUsd: number;
  healthFactor: number;
  ltv: number;
  liquidationThreshold: number;
}

export class AaveContractReader {
  private client: PublicClient;
  private readonly chainId: string;

  constructor(rpcUrl: string, chainId: string = "ethereum") {
    this.chainId = chainId;
    this.client = createPublicClient({
      chain: chainId === "polygon" ? polygon : mainnet,
      transport: http(rpcUrl),
    });
  }

  /**
   * Read a single user's account data from Aave V3 Pool.
   * Returns raw bigint values from the contract.
   */
  async getUserAccountData(user: string): Promise<RawAccountData> {
    const result = await this.client.readContract({
      address: getAavePoolAddress(this.chainId) as Address,
      abi: AAVE_POOL_ABI,
      functionName: "getUserAccountData",
      args: [user as Address],
    });

    const [
      totalCollateralBase,
      totalDebtBase,
      availableBorrowsBase,
      currentLiquidationThreshold,
      ltv,
      healthFactor,
    ] = result;

    return {
      user,
      totalCollateralBase,
      totalDebtBase,
      availableBorrowsBase,
      currentLiquidationThreshold,
      ltv,
      healthFactor,
    };
  }

  /**
   * Parse raw account data into human-readable numbers.
   */
  parseAccountData(raw: RawAccountData): ParsedAccountData {
    const collateralUsd = Number(formatUnits(raw.totalCollateralBase, AAVE_BASE_CURRENCY_DECIMALS));
    const debtUsd = Number(formatUnits(raw.totalDebtBase, AAVE_BASE_CURRENCY_DECIMALS));

    let hf: number;
    if (raw.totalDebtBase === 0n) {
      hf = raw.totalCollateralBase > 0n ? 999 : 0;
    } else {
      hf = Number(formatUnits(raw.healthFactor, AAVE_HF_DECIMALS));
    }

    return {
      user: raw.user,
      totalCollateralUsd: Math.round(collateralUsd * 100) / 100,
      totalDebtUsd: Math.round(debtUsd * 100) / 100,
      healthFactor: Math.round(hf * 1000) / 1000,
      ltv: Number(raw.ltv) / 100,
      liquidationThreshold: Number(raw.currentLiquidationThreshold) / 100,
    };
  }

  /**
   * Batch-read account data for multiple users.
   * Filters out users with no collateral or no debt (no active position).
   */
  async getPositionsForUsers(users: string[]): Promise<ParsedAccountData[]> {
    const results = await Promise.allSettled(
      users.map((u) => this.getUserAccountData(u))
    );

    const parsed: ParsedAccountData[] = [];

    for (const r of results) {
      if (r.status === "fulfilled") {
        const data = this.parseAccountData(r.value);
        if (data.totalCollateralUsd > 0 && data.totalDebtUsd > 0) {
          parsed.push(data);
        }
      }
    }

    return parsed;
  }

  /**
   * Get the current oracle price for an asset.
   * Returns price in base currency (USD, 8 decimals).
   */
  async getAssetPrice(asset: string): Promise<number> {
    const price = await this.client.readContract({
      address: getAaveOracleAddress(this.chainId) as Address,
      abi: AAVE_ORACLE_ABI,
      functionName: "getAssetPrice",
      args: [asset as Address],
    });

    return Number(formatUnits(price, AAVE_BASE_CURRENCY_DECIMALS));
  }

  /**
   * Expose the underlying viem client for advanced operations
   * (e.g., fork state manipulation by ForkController).
   */
  getClient(): PublicClient {
    return this.client;
  }
}
