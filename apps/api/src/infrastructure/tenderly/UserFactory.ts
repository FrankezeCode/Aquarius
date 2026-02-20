/**
 * User Factory — Tenderly Fork Infrastructure
 *
 * Creates test users with real Aave V3 positions on a Tenderly fork.
 * Each user gets:
 *   1. ETH balance (for gas)
 *   2. WETH balance (for collateral)
 *   3. Supply to Aave V3 Pool (creates collateral position)
 *   4. Borrow from Aave V3 Pool (creates debt position)
 *   5. ERC-20 approvals for executor + vault contracts
 *
 * Domain layer NEVER imports this file.
 */

import { parseUnits, encodeFunctionData, type Address } from "viem";
import { ForkController } from "./ForkController.js";
import { AaveContractReader, type ParsedAccountData } from "../aave/AaveContractReader.js";
import { WETH, USDC, AAVE_V3_POOL } from "../aave/constants.js";
import { ERC20_ABI } from "../aave/abis.js";
import { TenderlyRpcClient } from "./TenderlyRpcClient.js";

export interface TestUser {
  address: string;
  collateralEth: number;
  debtUsdc: number;
  healthFactor: number;
  accountData: ParsedAccountData;
}

export interface UserFactoryConfig {
  executorAddress?: string;
  vaultAddress?: string;
}

const TEST_ACCOUNTS: readonly string[] = [
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
  "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
  "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
  "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
  "0x14dC79964da2C08dA15Fd353d30d9fCBd3d74933",
  "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
];

export class UserFactory {
  private fork: ForkController;
  private reader: AaveContractReader;
  private rpc: TenderlyRpcClient;
  private config: UserFactoryConfig;

  constructor(
    rpcUrl: string,
    config: UserFactoryConfig = {}
  ) {
    this.fork = new ForkController(rpcUrl);
    this.reader = new AaveContractReader(rpcUrl);
    this.rpc = new TenderlyRpcClient(rpcUrl);
    this.config = config;
  }

  /**
   * Create a single test user with a specific Aave V3 position.
   * @param index Which test account to use (0-7)
   * @param collateralEth Amount of WETH to supply as collateral
   * @param debtUsdc Amount of USDC to borrow
   */
  async createUser(
    index: number,
    collateralEth: number,
    debtUsdc: number
  ): Promise<TestUser> {
    const address = TEST_ACCOUNTS[index % TEST_ACCOUNTS.length];

    console.info(`[user-factory] Creating user ${index}: ${address} (${collateralEth} ETH / ${debtUsdc} USDC)`);

    // 1. Fund with ETH for gas
    await this.fork.setEthBalance(address, "100");

    // 2. Give WETH for collateral
    await this.fork.setTokenBalance(WETH, address, collateralEth.toString(), 18);

    // 3. Supply WETH to Aave V3 as collateral
    await this.fork.simulateSupply(address, WETH, collateralEth.toString(), 18);

    // 4. Give USDC to borrow against (Aave needs liquidity)
    // Actually, we borrow from existing pool liquidity
    if (debtUsdc > 0) {
      await this.fork.simulateBorrow(address, USDC, debtUsdc.toString(), 6);
    }

    // 5. Set ERC-20 approvals for executor and vault if addresses provided
    if (this.config.executorAddress) {
      await this.approveSpender(address, USDC, this.config.executorAddress);
      await this.approveSpender(address, WETH, this.config.executorAddress);
    }
    if (this.config.vaultAddress) {
      await this.approveSpender(address, WETH, this.config.vaultAddress);
    }

    // 6. Read actual position from Aave
    const accountData = this.reader.parseAccountData(
      await this.reader.getUserAccountData(address)
    );

    console.info(
      `[user-factory] User ${index} created: HF=${accountData.healthFactor}, ` +
      `col=$${accountData.totalCollateralUsd}, debt=$${accountData.totalDebtUsd}`
    );

    return {
      address,
      collateralEth,
      debtUsdc,
      healthFactor: accountData.healthFactor,
      accountData,
    };
  }

  /**
   * Create multiple test users with varying risk profiles.
   */
  async createUsers(
    profiles: Array<{ collateralEth: number; debtUsdc: number }>
  ): Promise<TestUser[]> {
    const users: TestUser[] = [];
    for (let i = 0; i < profiles.length; i++) {
      const user = await this.createUser(i, profiles[i].collateralEth, profiles[i].debtUsdc);
      users.push(user);
    }
    return users;
  }

  /**
   * Approve a spender for max uint256 on an ERC-20 token (impersonated).
   */
  private async approveSpender(
    user: string,
    token: string,
    spender: string
  ): Promise<void> {
    const data = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: "approve",
      args: [spender as Address, BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")],
    });

    await this.rpc.sendTransaction({
      from: user,
      to: token,
      data,
    });
  }
}
