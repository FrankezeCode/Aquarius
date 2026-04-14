/**
 * Aave vault intent adapter — executes buffer / protect paths via VaultService and ports.
 *
 * Bounded context: Aave / Vaults / Infrastructure
 *
 * Invoked only from `CreOrchestrationAdapter` (or tests), never from vault-gateway HTTP.
 */

import type {
  CREWorkflowResult,
  CreVaultTrace,
} from "../../../../../../../packages/domain/cre/run-cre-workflow.js";
import type {
  VaultBufferTopUpInput,
  VaultIntentExecutor,
  VaultProtectPathInput,
} from "../../../../application/ports/vault-intent-executor.port.js";
import type { AceRiskLevel } from "../../risk-intelligence/scorer.js";
import type { AaveRiskSnapshot } from "../../domain/aave-risk-snapshot.js";
import type { UnderlyingAsset } from "../domain/aq-asset.js";
import { requiresMitigation } from "../domain/risk-mitigation-strategy.js";
import { VaultService } from "../application/services/vault.service.js";

const UNDERLYING: ReadonlySet<string> = new Set([
  "ETH",
  "WETH",
  "POL",
  "USDC",
  "USDT",
  "DAI",
  "WBTC",
]);

function parseUnderlyingAsset(normalized: string): UnderlyingAsset | null {
  const u = normalized.trim().toUpperCase();
  return UNDERLYING.has(u) ? (u as UnderlyingAsset) : null;
}

function parsePositiveAmount(raw: string): number {
  const n = Number.parseFloat(raw.trim().replace(/,/g, ""));
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("INVALID_AMOUNT: expected a positive decimal amount");
  }
  return n;
}

function minimalSnapshot(riskLevel: AceRiskLevel): AaveRiskSnapshot {
  return {
    healthFactor: 1.5,
    debtRatio: 0.3,
    liquidityIndex: 0,
    volatilityScore: 0.2,
    riskLevel,
    timestamp: Date.now(),
  };
}

function baseCreShell(
  chainId: string,
  vaultTrace: CreVaultTrace,
  summary: string
): CREWorkflowResult {
  const now = Date.now();
  return {
    protocolStatus: "stable",
    riskScore: {
      composite: 0,
      level: "safe",
      summary,
      dimensions: [],
      sampleSize: 0,
    },
    riskFactors: [],
    riskProgression: {
      stage: "info",
      accumulator: 0,
      convergenceSignals: [],
      enteredAt: now,
      transitionReason: `vault:${vaultTrace.command}`,
      lastAction: null,
      actionRequired: "none",
    },
    agentDecision: {
      decision: "VAULT_PROTOCOL",
      confidence: 1,
      actionsRequested: [],
      blackSwanDetected: false,
    },
    actionDispatch: { dispatched: vaultTrace.steps },
    latencies: { risk: 0, agent: 0, action: 0, total: 0 },
    events: [
      {
        id: `vault-${now}`,
        timestamp: new Date(now).toISOString(),
        message: `${vaultTrace.command} on ${chainId}`,
        severity: "info",
      },
    ],
    timestamp: now,
    vaultTrace,
  };
}

export class AaveVaultAdapter implements VaultIntentExecutor {
  constructor(private readonly vaultService: VaultService) {}

  async executeBufferTopUp(
    input: VaultBufferTopUpInput
  ): Promise<CREWorkflowResult> {
    const underlying = parseUnderlyingAsset(input.normalizedAsset);
    if (!underlying) {
      throw new Error(
        `UNSUPPORTED_ASSET: ${input.normalizedAsset} (expected ETH, WETH, USDC, …)`
      );
    }
    const amount = parsePositiveAmount(input.amountDecimal);
    const vaultId = `buffer-${input.creChainId}`;
    const deposit = await this.vaultService.deposit(
      input.simulatedOwner,
      underlying,
      amount,
      vaultId
    );
    const trace: CreVaultTrace = {
      command: "buffer_top_up",
      simulated: true,
      steps: ["staking.deposit", "vault.mint", "buffer.store"],
      txHashes: [deposit.txHash],
    };
    return baseCreShell(
      input.creChainId,
      trace,
      `Buffer top-up (${underlying} ${amount})`
    );
  }

  async executeProtectPath(
    input: VaultProtectPathInput
  ): Promise<CREWorkflowResult> {
    const level = input.riskLevel as AceRiskLevel;
    const snapshot = minimalSnapshot(level);

    if (!requiresMitigation(level)) {
      const trace: CreVaultTrace = {
        command: "vault_protect",
        simulated: true,
        steps: ["mitigation.skipped"],
      };
      return baseCreShell(
        input.creChainId,
        trace,
        `Protect path skipped (riskLevel=${level})`
      );
    }

    await this.vaultService.evaluateAndMitigate(input.aqAssetId, snapshot);

    const trace: CreVaultTrace = {
      command: "vault_protect",
      simulated: true,
      steps: ["vault.evaluateAndMitigate"],
    };
    return baseCreShell(
      input.creChainId,
      trace,
      `Protect path dispatched (riskLevel=${level})`
    );
  }
}
