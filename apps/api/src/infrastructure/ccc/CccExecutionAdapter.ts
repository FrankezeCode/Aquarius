/**
 * CCC — Execution Adapter (Infrastructure Only)
 *
 * Simulates Chainlink Confidential Compute mitigation actions.
 * In simulated mode: builds tx, sends to Tenderly fork, records trace.
 * In real mode: would submit to actual Chainlink DON endpoint.
 *
 * Domain layer NEVER imports this file.
 * Domain emits MitigationIntent → infrastructure executes.
 */

import type {
  MitigationIntent,
  ExecutionReport,
} from "../../domain/events/MitigationIntent.js";
import { ForkController } from "../tenderly/ForkController.js";
import { AaveContractReader } from "../aave/AaveContractReader.js";
import { TenderlyRpcClient } from "../tenderly/TenderlyRpcClient.js";
import { ContractArtifacts } from "../contracts/artifacts.js";
import { WETH, USDC } from "../aave/constants.js";
import { encodeFunctionData, type Address } from "viem";

export type ContractExecutionMode = "non-custodial" | "vault-backed";

export class CccExecutionAdapter {
  private forkController: ForkController;
  private reader: AaveContractReader;
  private rpc: TenderlyRpcClient;
  private forkId?: string;
  private rpcUrl: string;

  constructor(rpcUrl: string, forkId?: string) {
    this.rpcUrl = rpcUrl;
    this.forkController = new ForkController(rpcUrl);
    this.reader = new AaveContractReader(rpcUrl);
    this.rpc = new TenderlyRpcClient(rpcUrl);
    this.forkId = forkId;
  }

  /**
   * Execute a mitigation action based on a MitigationIntent.
   *
   * In simulated_ccc mode:
   *   1. Read pre-execution state
   *   2. Build + send mitigation tx via Tenderly fork
   *   3. Read post-execution state
   *   4. Generate ExecutionReport
   */
  async executeMitigation(intent: MitigationIntent): Promise<ExecutionReport> {
    const decisionStart = performance.now();

    console.info(
      `[ccc-adapter] Executing mitigation: ${intent.type} for ${intent.user} on ${intent.chainId}`
    );

    // Read pre-execution HF
    const preData = this.reader.parseAccountData(
      await this.reader.getUserAccountData(intent.user)
    );
    const preHF = preData.healthFactor;

    const decisionLatencyMs = Math.round(performance.now() - decisionStart);
    const executionStart = performance.now();

    let txHash: string;
    let success = true;
    let error: string | undefined;

    try {
      switch (intent.type) {
        case "ADD_COLLATERAL": {
          // Give the user tokens to supply, then supply
          const decimals = intent.asset.toLowerCase() === USDC.toLowerCase() ? 6 : 18;
          await this.forkController.setTokenBalance(
            intent.asset,
            intent.user,
            intent.amount,
            decimals
          );
          // Give gas
          await this.forkController.setEthBalance(intent.user, "1");
          txHash = await this.forkController.simulateSupply(
            intent.user,
            intent.asset,
            intent.amount,
            decimals
          );
          break;
        }

        case "REPAY_DEBT": {
          const decimals = intent.asset.toLowerCase() === USDC.toLowerCase() ? 6 : 18;
          // Give user tokens to repay
          await this.forkController.setTokenBalance(
            intent.asset,
            intent.user,
            intent.amount,
            decimals
          );
          await this.forkController.setEthBalance(intent.user, "1");
          txHash = await this.forkController.simulateRepay(
            intent.user,
            intent.asset,
            intent.amount,
            decimals
          );
          break;
        }

        case "PARTIAL_LIQUIDATION":
        case "EMERGENCY_EXIT":
          // These would require more complex multi-step transactions.
          // For now, fall through to ADD_COLLATERAL as primary strategy.
          console.info(
            `[ccc-adapter] ${intent.type} mapped to ADD_COLLATERAL for simulation`
          );
          await this.forkController.setTokenBalance(
            WETH,
            intent.user,
            intent.amount,
            18
          );
          await this.forkController.setEthBalance(intent.user, "1");
          txHash = await this.forkController.simulateSupply(
            intent.user,
            WETH,
            intent.amount,
            18
          );
          break;

        default:
          throw new Error(`Unknown mitigation type: ${intent.type}`);
      }
    } catch (e) {
      success = false;
      error = e instanceof Error ? e.message : String(e);
      txHash = "0x_failed";
    }

    const executionLatencyMs = Math.round(performance.now() - executionStart);

    // Read post-execution HF
    let postHF = preHF;
    if (success) {
      try {
        const postData = this.reader.parseAccountData(
          await this.reader.getUserAccountData(intent.user)
        );
        postHF = postData.healthFactor;
      } catch {
        console.warn("[ccc-adapter] Failed to read post-execution HF");
      }
    }

    const totalLatencyMs = decisionLatencyMs + executionLatencyMs;

    const report: ExecutionReport = {
      intentId: intent.id,
      preHF,
      postHF,
      decisionLatencyMs,
      executionLatencyMs,
      totalLatencyMs,
      txHash,
      forkId: this.forkId,
      success,
      error,
      timestamp: Date.now(),
    };

    console.info(
      `[ccc-adapter] ExecutionReport: preHF=${preHF} postHF=${postHF} success=${success} txHash=${txHash} latency=${totalLatencyMs}ms`
    );

    return report;
  }

  /**
   * Execute mitigation via a deployed smart contract on the fork.
   *
   * Two execution modes:
   *   - "non-custodial": Routes through MitigationExecutor contract
   *     (uses user's pre-approved tokens, bounded by PolicyGuard)
   *   - "vault-backed": Routes through BufferVault contract
   *     (injects liquidity from pooled vault reserves)
   *
   * Existing executeMitigation() is untouched.
   */
  async executeMitigationViaContract(
    intent: MitigationIntent,
    contractAddress: string,
    mode: ContractExecutionMode
  ): Promise<ExecutionReport> {
    const decisionStart = performance.now();

    console.info(
      `[ccc-adapter] Contract execution (${mode}): ${intent.type} for ${intent.user} via ${contractAddress}`
    );

    const preData = this.reader.parseAccountData(
      await this.reader.getUserAccountData(intent.user)
    );
    const preHF = preData.healthFactor;

    const decisionLatencyMs = Math.round(performance.now() - decisionStart);
    const executionStart = performance.now();

    let txHash: string;
    let success = true;
    let error: string | undefined;

    try {
      const decimals = intent.asset.toLowerCase() === USDC.toLowerCase() ? 6 : 18;
      const amountWei = BigInt(Math.floor(Number(intent.amount) * 10 ** decimals));

      // Ensure executor/vault has gas
      await this.forkController.setEthBalance(contractAddress, "10");

      if (mode === "non-custodial") {
        // Give user tokens so transferFrom works
        await this.forkController.setTokenBalance(
          intent.asset, intent.user, intent.amount, decimals
        );

        const fnName = intent.type === "REPAY_DEBT" ? "repayOnBehalf" : "supplyOnBehalf";
        const data = encodeFunctionData({
          abi: ContractArtifacts.MitigationExecutor.abi as any,
          functionName: fnName,
          args: [intent.user as Address, intent.asset as Address, amountWei],
        });

        txHash = await this.rpc.sendTransaction({
          from: contractAddress,
          to: contractAddress,
          data,
        });
      } else {
        // vault-backed: inject liquidity from vault reserves
        // Give vault tokens for the injection
        await this.forkController.setTokenBalance(
          intent.asset, contractAddress, intent.amount, decimals
        );

        const data = encodeFunctionData({
          abi: ContractArtifacts.BufferVault.abi as any,
          functionName: "injectLiquidity",
          args: [intent.user as Address, intent.asset as Address, amountWei],
        });

        txHash = await this.rpc.sendTransaction({
          from: contractAddress,
          to: contractAddress,
          data,
        });
      }
    } catch (e) {
      success = false;
      error = e instanceof Error ? e.message : String(e);
      txHash = "0x_failed";
    }

    const executionLatencyMs = Math.round(performance.now() - executionStart);

    let postHF = preHF;
    if (success) {
      try {
        const postData = this.reader.parseAccountData(
          await this.reader.getUserAccountData(intent.user)
        );
        postHF = postData.healthFactor;
      } catch {
        console.warn("[ccc-adapter] Failed to read post-execution HF (contract mode)");
      }
    }

    const totalLatencyMs = decisionLatencyMs + executionLatencyMs;

    const report: ExecutionReport = {
      intentId: intent.id,
      preHF,
      postHF,
      decisionLatencyMs,
      executionLatencyMs,
      totalLatencyMs,
      txHash,
      forkId: this.forkId,
      success,
      error,
      timestamp: Date.now(),
    };

    console.info(
      `[ccc-adapter] Contract ExecutionReport (${mode}): preHF=${preHF} postHF=${postHF} success=${success} txHash=${txHash} latency=${totalLatencyMs}ms`
    );

    return report;
  }
}
