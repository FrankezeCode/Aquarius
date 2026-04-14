/**
 * CRE orchestration adapter — infrastructure implementation of OrchestrationPort.
 *
 * Delegates to `runCREWorkflow`; persists jobs via OrchestrationJobStore for polling and staging.
 * Vault intents that target buffer / protect paths use `VaultIntentExecutor` (Aave adapter);
 * `pos.delegate` uses `PosDelegationExecutor` (curated delegation adapter).
 */

import { randomUUID } from "node:crypto";
import {
  runCREWorkflow,
  type CREWorkflowOptions,
  type CREWorkflowResult,
} from "../../../../../packages/domain/cre/run-cre-workflow.js";
import type {
  OrchestrationJobStore,
  PersistedOrchestrationJob,
} from "../../application/ports/orchestration-job-store.port.js";
import type { PosDelegationExecutor } from "../../application/ports/pos-delegation-executor.port.js";
import type { VaultIntentExecutor } from "../../application/ports/vault-intent-executor.port.js";
import type {
  OrchestrationIntent,
  OrchestrationPort,
  OrchestrationSubmitResult,
  VaultIntentEnvelope,
} from "../../application/ports/orchestration.port.js";
import { resolveWorkflowDefinitionId } from "../../services/vault-gateway/workflow-registry.js";
import { MemoryOrchestrationJobStore } from "./memory-orchestration-job-store.js";
import { getPosDelegationExecutor } from "../pos-delegation-executor.singleton.js";
import { getVaultIntentExecutor } from "./vault-intent-executor.singleton.js";
import { triggerVaultRemoteWorkflow } from "./vault-workflow-trigger.js";

export type CreWorkflowRunner = (
  options?: CREWorkflowOptions
) => Promise<CREWorkflowResult>;

export type OrchestrationExecutionMode = "live" | "mock";

export interface CreOrchestrationAdapterDeps {
  runWorkflow?: CreWorkflowRunner;
  executionMode?: OrchestrationExecutionMode;
  jobStore?: OrchestrationJobStore;
  vaultIntentCreWorkflowId?: string;
  creVaultWorkflowTriggerUrl?: string;
  creVaultWorkflowTriggerToken?: string;
  creVaultWorkflowTriggerTimeoutMs?: number;
  vaultCreCallbackUrl?: string;
  /** Simulated vault owner for buffer top-up (staging / testnet). */
  vaultProtocolSimulatedOwner?: string;
  vaultIntentExecutor?: VaultIntentExecutor;
  posDelegationExecutor?: PosDelegationExecutor;
}

function syntheticCreWorkflowResult(chainId: string): CREWorkflowResult {
  const now = Date.now();
  return {
    protocolStatus: "stable",
    riskScore: {
      composite: 0,
      level: "safe",
      summary: `mock orchestration (${chainId})`,
      dimensions: [],
      sampleSize: 0,
    },
    riskFactors: [],
    riskProgression: {
      stage: "info",
      accumulator: 0,
      convergenceSignals: [],
      enteredAt: now,
      transitionReason: "ORCHESTRATION_EXECUTION_MODE=mock",
      lastAction: null,
      actionRequired: "none",
    },
    agentDecision: {
      decision: "OBSERVE_ONLY",
      confidence: 1,
      actionsRequested: [],
      blackSwanDetected: false,
    },
    actionDispatch: { dispatched: [] },
    latencies: { risk: 0, agent: 0, action: 0, total: 0 },
    events: [],
    timestamp: now,
  };
}

function syntheticBufferTopUpMock(chainId: string): CREWorkflowResult {
  const base = syntheticCreWorkflowResult(chainId);
  return {
    ...base,
    riskScore: {
      ...base.riskScore,
      summary: `mock buffer top-up (${chainId})`,
    },
    vaultTrace: {
      command: "buffer_top_up",
      simulated: true,
      steps: ["mock"],
    },
  };
}

function syntheticProtectMock(chainId: string): CREWorkflowResult {
  const base = syntheticCreWorkflowResult(chainId);
  return {
    ...base,
    riskScore: {
      ...base.riskScore,
      summary: `mock vault protect (${chainId})`,
    },
    vaultTrace: {
      command: "vault_protect",
      simulated: true,
      steps: ["mock"],
    },
  };
}

function syntheticPosDelegateMock(chainId: string): CREWorkflowResult {
  const base = syntheticCreWorkflowResult(chainId);
  return {
    ...base,
    riskScore: {
      ...base.riskScore,
      summary: `mock pos delegate (${chainId})`,
    },
    vaultTrace: {
      command: "pos_delegate",
      simulated: true,
      steps: ["mock.recordDelegationIntent"],
      txHashes: [`0xmock_delegate_${Date.now().toString(16)}`],
    },
  };
}

function toSubmitResult(
  j: PersistedOrchestrationJob
): OrchestrationSubmitResult {
  return {
    jobId: j.jobId,
    status: j.status,
    result: j.result,
    error: j.error,
    correlationId: j.correlationId,
    workflowDefinitionId: j.workflowDefinitionId,
    externalWorkflowId: j.externalWorkflowId,
  };
}

function usesRemoteCreRail(envelope: VaultIntentEnvelope): boolean {
  return envelope.intentType === "cre.workflow";
}

export class CreOrchestrationAdapter implements OrchestrationPort {
  private readonly runWorkflow: CreWorkflowRunner;
  private readonly executionMode: OrchestrationExecutionMode;
  private readonly jobStore: OrchestrationJobStore;
  private readonly vaultIntentCreWorkflowId?: string;
  private readonly creVaultWorkflowTriggerUrl?: string;
  private readonly creVaultWorkflowTriggerToken?: string;
  private readonly creVaultWorkflowTriggerTimeoutMs: number;
  private readonly vaultCreCallbackUrl?: string;
  private readonly vaultProtocolSimulatedOwner: string;
  private readonly vaultIntentExecutor: VaultIntentExecutor;
  private readonly posDelegationExecutor: PosDelegationExecutor;

  constructor(deps: CreOrchestrationAdapterDeps = {}) {
    this.runWorkflow = deps.runWorkflow ?? runCREWorkflow;
    this.executionMode = deps.executionMode ?? "live";
    this.jobStore = deps.jobStore ?? new MemoryOrchestrationJobStore();
    this.vaultIntentCreWorkflowId = deps.vaultIntentCreWorkflowId;
    this.creVaultWorkflowTriggerUrl = deps.creVaultWorkflowTriggerUrl;
    this.creVaultWorkflowTriggerToken = deps.creVaultWorkflowTriggerToken;
    this.creVaultWorkflowTriggerTimeoutMs =
      deps.creVaultWorkflowTriggerTimeoutMs ?? 10_000;
    this.vaultCreCallbackUrl = deps.vaultCreCallbackUrl;
    this.vaultProtocolSimulatedOwner =
      deps.vaultProtocolSimulatedOwner?.trim() ||
      "0x000000000000000000000000000000000000cafe";
    this.vaultIntentExecutor =
      deps.vaultIntentExecutor ?? getVaultIntentExecutor();
    this.posDelegationExecutor =
      deps.posDelegationExecutor ?? getPosDelegationExecutor();
  }

  async submitIntent(
    intent: OrchestrationIntent
  ): Promise<OrchestrationSubmitResult> {
    if (intent.type === "vault.intent") {
      return this.runVaultIntent(intent.envelope);
    }
    if (intent.type === "cre.workflow") {
      return this.runCreWorkflowIntent(intent.options);
    }
    const jobId = `cre-job-${randomUUID()}`;
    await this.jobStore.putJob({
      jobId,
      status: "failed",
      error: `Unsupported orchestration intent type: ${String((intent as OrchestrationIntent).type)}`,
      updatedAt: Date.now(),
    });
    const j = await this.jobStore.getJob(jobId);
    return toSubmitResult(j!);
  }

  private mockResultForVaultIntent(
    envelope: VaultIntentEnvelope
  ): CREWorkflowResult {
    const chain = envelope.creChainId;
    if (envelope.intentType === "aave.buffer.top_up") {
      return syntheticBufferTopUpMock(chain);
    }
    if (envelope.intentType === "aave.vault.protect") {
      return syntheticProtectMock(chain);
    }
    if (envelope.intentType === "pos.delegate") {
      return syntheticPosDelegateMock(chain);
    }
    return syntheticCreWorkflowResult(chain);
  }

  private async runVaultIntent(
    envelope: VaultIntentEnvelope
  ): Promise<OrchestrationSubmitResult> {
    const jobId = `cre-job-${randomUUID()}`;
    const wfDef = resolveWorkflowDefinitionId(
      envelope.intentType,
      this.vaultIntentCreWorkflowId
    );

    if (this.executionMode === "mock") {
      const result = this.mockResultForVaultIntent(envelope);
      await this.jobStore.putJob({
        jobId,
        status: "completed",
        correlationId: envelope.correlationId,
        workflowDefinitionId: wfDef,
        result,
        updatedAt: Date.now(),
      });
      const j = await this.jobStore.getJob(jobId);
      return toSubmitResult(j!);
    }

    if (
      this.creVaultWorkflowTriggerUrl &&
      usesRemoteCreRail(envelope)
    ) {
      await this.jobStore.putJob({
        jobId,
        status: "running",
        correlationId: envelope.correlationId,
        workflowDefinitionId: wfDef,
        updatedAt: Date.now(),
      });
      const trig = await triggerVaultRemoteWorkflow({
        url: this.creVaultWorkflowTriggerUrl,
        token: this.creVaultWorkflowTriggerToken,
        workflowId: wfDef,
        chainId: envelope.creChainId,
        correlationId: envelope.correlationId,
        callbackUrl: this.vaultCreCallbackUrl,
        timeoutMs: this.creVaultWorkflowTriggerTimeoutMs,
      });
      if (!trig.ok) {
        await this.jobStore.patchJob(jobId, {
          status: "failed",
          error: trig.errorMessage ?? "Remote workflow trigger failed",
        });
        const j = await this.jobStore.getJob(jobId);
        return toSubmitResult(j!);
      }
      if (trig.externalWorkflowId) {
        await this.jobStore.patchJob(jobId, {
          externalWorkflowId: trig.externalWorkflowId,
        });
      }
      const j = await this.jobStore.getJob(jobId);
      return toSubmitResult(j!);
    }

    await this.jobStore.putJob({
      jobId,
      status: "running",
      correlationId: envelope.correlationId,
      workflowDefinitionId: wfDef,
      updatedAt: Date.now(),
    });
    void this.finalizeVaultLocalJob(jobId, envelope);
    const j = await this.jobStore.getJob(jobId);
    return toSubmitResult(j!);
  }

  private async finalizeVaultLocalJob(
    jobId: string,
    envelope: VaultIntentEnvelope
  ): Promise<void> {
    try {
      let result: CREWorkflowResult;
      if (envelope.intentType === "cre.workflow") {
        result = await this.runWorkflow({ chainId: envelope.creChainId });
      } else if (envelope.intentType === "aave.buffer.top_up") {
        result = await this.vaultIntentExecutor.executeBufferTopUp({
          creChainId: envelope.creChainId,
          normalizedAsset: envelope.normalizedAsset,
          amountDecimal: envelope.amount,
          simulatedOwner: this.vaultProtocolSimulatedOwner,
        });
      } else if (envelope.intentType === "aave.vault.protect") {
        result = await this.vaultIntentExecutor.executeProtectPath({
          creChainId: envelope.creChainId,
          aqAssetId: envelope.aqAssetId,
          riskLevel: envelope.riskLevel,
        });
      } else if (envelope.intentType === "pos.delegate") {
        result = await this.posDelegationExecutor.executePartnerDelegation({
          creChainId: envelope.creChainId,
          normalizedAsset: envelope.normalizedAsset,
          amountDecimal: envelope.amount,
          validatorAddress: envelope.validatorAddress,
          partnerId: envelope.partnerId,
          memo: envelope.memo,
        });
      } else {
        const unknown: never = envelope;
        throw new Error(
          `Unsupported vault intent: ${String((unknown as VaultIntentEnvelope).intentType)}`
        );
      }
      await this.jobStore.patchJob(jobId, { status: "completed", result });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await this.jobStore.patchJob(jobId, { status: "failed", error: message });
    }
  }

  private async runCreWorkflowIntent(
    options: CREWorkflowOptions
  ): Promise<OrchestrationSubmitResult> {
    const jobId = `cre-job-${randomUUID()}`;
    const chainId = options.chainId ?? "ethereum";

    if (this.executionMode === "mock") {
      const result = syntheticCreWorkflowResult(chainId);
      await this.jobStore.putJob({
        jobId,
        status: "completed",
        result,
        updatedAt: Date.now(),
      });
      const j = await this.jobStore.getJob(jobId);
      return toSubmitResult(j!);
    }

    try {
      const result = await this.runWorkflow(options);
      await this.jobStore.putJob({
        jobId,
        status: "completed",
        result,
        updatedAt: Date.now(),
      });
      const j = await this.jobStore.getJob(jobId);
      return toSubmitResult(j!);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await this.jobStore.putJob({
        jobId,
        status: "failed",
        error: message,
        updatedAt: Date.now(),
      });
      const j = await this.jobStore.getJob(jobId);
      return toSubmitResult(j!);
    }
  }

  async getJobStatus(jobId: string): Promise<OrchestrationSubmitResult | null> {
    const j = await this.jobStore.getJob(jobId);
    if (!j) return null;
    return toSubmitResult(j);
  }
}
