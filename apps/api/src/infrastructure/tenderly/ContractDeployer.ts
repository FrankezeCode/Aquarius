/**
 * Contract Deployer — Tenderly Fork Infrastructure
 *
 * Deploys all Aquarius smart contracts to a Tenderly Virtual TestNet fork
 * using viem. Returns addresses, tx hashes, and explorer URLs for each.
 *
 * Domain layer NEVER imports this file.
 */

import { createPublicClient, http, encodeFunctionData, encodeDeployData, type Address, type Hex } from "viem";
import { mainnet } from "viem/chains";
import { ContractArtifacts, type ContractName } from "../contracts/artifacts.js";
import { TenderlyRpcClient } from "./TenderlyRpcClient.js";

export interface DeployResult {
  name: string;
  address: string;
  txHash: string;
  explorerUrl: string;
}

export interface DeployedContracts {
  guard: DeployResult;
  executor: DeployResult;
  vault: DeployResult;
  agent: DeployResult;
  ccip: DeployResult;
}

interface TenderlyConfig {
  rpcUrl: string;
  account?: string;
  project?: string;
  testnetId?: string;
}

export class ContractDeployer {
  private rpc: TenderlyRpcClient;
  private config: TenderlyConfig;
  private deployerAddress: string;

  constructor(config: TenderlyConfig) {
    this.config = config;
    this.rpc = new TenderlyRpcClient(config.rpcUrl);
    this.deployerAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  }

  private explorerUrl(txHash: string): string {
    const { account, project, testnetId } = this.config;
    if (account && project && testnetId) {
      return `https://dashboard.tenderly.co/${account}/${project}/testnet/${testnetId}/tx/${txHash}`;
    }
    return `https://dashboard.tenderly.co/tx/${txHash}`;
  }

  /**
   * Deploy a single contract by name with constructor args.
   */
  async deploy(
    name: ContractName,
    constructorArgs: unknown[] = []
  ): Promise<DeployResult> {
    const artifact = ContractArtifacts[name];
    if (!artifact) throw new Error(`No artifact found for ${name}`);

    await this.rpc.setBalance(
      this.deployerAddress,
      `0x${(10n ** 20n).toString(16)}`
    );

    const deployData = encodeDeployData({
      abi: artifact.abi as any,
      bytecode: artifact.bytecode as Hex,
      args: constructorArgs as any,
    });

    const txParams = {
      from: this.deployerAddress,
      data: deployData as string,
    };
    const txHash = await this.rpc.sendDeployTransaction(txParams);

    const receipt = await this.waitForReceipt(txHash);
    const contractAddress = (receipt as any)?.contractAddress;

    if (!contractAddress) {
      throw new Error(`Deployment of ${name} failed — no contract address in receipt`);
    }

    console.info(`[deployer] ${name} deployed at ${contractAddress} (tx: ${txHash})`);

    return {
      name,
      address: contractAddress,
      txHash,
      explorerUrl: this.explorerUrl(txHash),
    };
  }

  /**
   * Deploy all 5 Aquarius contracts in dependency order and initialize them.
   */
  async deployAll(
    aavePoolAddress: string,
    wethAddress: string
  ): Promise<DeployedContracts> {
    console.info("[deployer] Starting full contract deployment...");

    // 1. PolicyGuard — no dependencies
    const guard = await this.deploy("AquaAgentPolicyGuard", [
      50000n * 10n ** 8n, // maxSingleActionUsd: $50k (8 decimals)
      10n,                // maxDailyActionsPerUser: 10
    ]);

    // 2. MitigationExecutor — depends on Pool + Guard
    const executor = await this.deploy("MitigationExecutor", [
      aavePoolAddress,
      guard.address,
    ]);

    // 3. BufferVault — depends on WETH + Pool
    const vault = await this.deploy("BufferVault", [
      wethAddress,
      aavePoolAddress,
    ]);

    // 4. AquaAgent — no constructor deps, initialized separately
    const agent = await this.deploy("AquaAgent", []);

    // 5. CCIPCoordinator — no constructor deps, initialized separately
    const ccip = await this.deploy("CCIPCoordinator", []);

    return { guard, executor, vault, agent, ccip };
  }

  /**
   * Initialize contracts that require post-deploy setup.
   */
  async initializeContracts(deployed: DeployedContracts): Promise<string[]> {
    const txHashes: string[] = [];

    // Initialize BufferVault with risk manager (PolicyGuard)
    const vaultInitData = this.encodeFunctionCall(
      ContractArtifacts.BufferVault.abi,
      "initialize",
      [deployed.guard.address]
    );
    const vaultTx = await this.rpc.sendTransaction({
      from: this.deployerAddress,
      to: deployed.vault.address,
      data: vaultInitData,
    });
    txHashes.push(vaultTx);
    console.info(`[deployer] BufferVault initialized (tx: ${vaultTx})`);

    // Initialize AquaAgent with executor, vault, guard, and approved actions
    const agentInitData = this.encodeFunctionCall(
      ContractArtifacts.AquaAgent.abi,
      "initialize",
      [
        deployed.executor.address,
        deployed.vault.address,
        deployed.guard.address,
        ["partialRepay", "vaultInject", "addCollateral"],
      ]
    );
    const agentTx = await this.rpc.sendTransaction({
      from: this.deployerAddress,
      to: deployed.agent.address,
      data: agentInitData,
    });
    txHashes.push(agentTx);
    console.info(`[deployer] AquaAgent initialized (tx: ${agentTx})`);

    // Initialize CCIPCoordinator with admin + registered chains
    const ccipInitData = this.encodeFunctionCall(
      ContractArtifacts.CCIPCoordinator.abi,
      "initialize",
      [
        deployed.agent.address,
        ["arbitrum", "polygon", "optimism"],
      ]
    );
    const ccipTx = await this.rpc.sendTransaction({
      from: this.deployerAddress,
      to: deployed.ccip.address,
      data: ccipInitData,
    });
    txHashes.push(ccipTx);
    console.info(`[deployer] CCIPCoordinator initialized (tx: ${ccipTx})`);

    return txHashes;
  }

  getDeployerAddress(): string {
    return this.deployerAddress;
  }

  private encodeFunctionCall(abi: any, functionName: string, args: any[]): string {
    return encodeFunctionData({ abi, functionName, args });
  }

  private async waitForReceipt(txHash: string, maxAttempts = 30): Promise<Record<string, unknown> | null> {
    for (let i = 0; i < maxAttempts; i++) {
      const receipt = await this.rpc.getTransactionReceipt(txHash);
      if (receipt) return receipt;
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error(`Timeout waiting for receipt: ${txHash}`);
  }
}
