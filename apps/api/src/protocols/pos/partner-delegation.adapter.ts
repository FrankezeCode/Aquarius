/**
 * Partner / curated delegation adapter — EVM testnet router calls (viem).
 *
 * Bounded context: PoS delegation — infrastructure.
 */

import {
  createWalletClient,
  http,
  type Hex,
  keccak256,
  parseUnits,
  stringToHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia, baseSepolia, sepolia } from "viem/chains";
import type { CREWorkflowResult } from "../../../../../packages/domain/cre/run-cre-workflow.js";
import type {
  PosDelegationExecutor,
  PosDelegationInput,
} from "../../application/ports/pos-delegation-executor.port.js";
import type { Config } from "../../config/index.js";

const ROUTER_ABI = [
  {
    type: "function",
    name: "recordDelegationIntent",
    inputs: [
      { name: "validator", type: "address" },
      { name: "amountWei", type: "uint256" },
      { name: "partnerId", type: "bytes32" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

function chainForId(chainId: number) {
  if (chainId === 11_155_111) return sepolia;
  if (chainId === 421_614) return arbitrumSepolia;
  if (chainId === 84_532) return baseSepolia;
  return sepolia;
}

function parsePartnerIdBytes32(partnerId?: string): Hex {
  if (!partnerId?.trim()) {
    return "0x0000000000000000000000000000000000000000000000000000000000000000";
  }
  return keccak256(stringToHex(partnerId.trim().slice(0, 64)));
}

function baseCreResult(
  chainId: string,
  vaultTrace: NonNullable<CREWorkflowResult["vaultTrace"]>
): CREWorkflowResult {
  const now = Date.now();
  return {
    protocolStatus: "stable",
    riskScore: {
      composite: 0,
      level: "safe",
      summary: `pos delegation (${chainId})`,
      dimensions: [],
      sampleSize: 0,
    },
    riskFactors: [],
    riskProgression: {
      stage: "info",
      accumulator: 0,
      convergenceSignals: [],
      enteredAt: now,
      transitionReason: `pos:${vaultTrace.command}`,
      lastAction: null,
      actionRequired: "none",
    },
    agentDecision: {
      decision: "POS_DELEGATION",
      confidence: 1,
      actionsRequested: [],
      blackSwanDetected: false,
    },
    actionDispatch: { dispatched: vaultTrace.steps ?? [] },
    latencies: { risk: 0, agent: 0, action: 0, total: 0 },
    events: [
      {
        id: `pos-${now}`,
        timestamp: new Date(now).toISOString(),
        message: `Delegation intent on ${chainId}`,
        severity: "info",
      },
    ],
    timestamp: now,
    vaultTrace,
  };
}

export type PosDelegationMode = "mock" | "testnet";

export interface PartnerDelegationAdapterDeps {
  getConfig: () => Config;
  mode?: PosDelegationMode;
}

export class PartnerDelegationAdapter implements PosDelegationExecutor {
  constructor(private readonly deps: PartnerDelegationAdapterDeps) {}

  async executePartnerDelegation(
    input: PosDelegationInput
  ): Promise<CREWorkflowResult> {
    const cfg = this.deps.getConfig();
    const mode = this.deps.mode ?? cfg.posDelegationExecutionMode;

    let amountWei: bigint;
    try {
      amountWei = parseUnits(input.amountDecimal.trim() || "0", 18);
    } catch {
      amountWei = 0n;
    }

    if (mode === "mock") {
      const txHash = `0xmock_delegate_${Date.now().toString(16)}`;
      return baseCreResult(input.creChainId, {
        command: "pos_delegate",
        simulated: true,
        steps: ["mock.recordDelegationIntent"],
        txHashes: [txHash],
      });
    }

    const pk = cfg.posDelegationOperatorPrivateKey?.trim();
    const router = cfg.posDelegationRouterAddress?.trim();
    if (!pk || !router) {
      throw new Error(
        "POS_DELEGATION: set POS_DELEGATION_ROUTER_ADDRESS and POS_DELEGATION_OPERATOR_PRIVATE_KEY (or DELEGATION_OPERATOR_PRIVATE_KEY) for testnet mode"
      );
    }

    const chain = chainForId(cfg.posDelegationChainId);
    const account = privateKeyToAccount(pk as Hex);
    const transport = http(cfg.posDelegationRpcUrl);
    const client = createWalletClient({
      account,
      chain,
      transport,
    });

    const partnerBytes = parsePartnerIdBytes32(input.partnerId);

    const hash = await client.writeContract({
      address: router as `0x${string}`,
      abi: ROUTER_ABI,
      functionName: "recordDelegationIntent",
      args: [input.validatorAddress, amountWei, partnerBytes],
    });

    return baseCreResult(input.creChainId, {
      command: "pos_delegate",
      simulated: false,
      steps: ["onchain.recordDelegationIntent"],
      txHashes: [hash],
    });
  }
}
