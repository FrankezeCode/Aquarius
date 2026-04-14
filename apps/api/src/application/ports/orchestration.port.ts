/**
 * Orchestration port — single application boundary for CRE-backed workflows.
 *
 * All HTTP and protocol facades submit work through this port; implementations
 * delegate to Chainlink CRE (`runCREWorkflow`) per ADR 0003.
 *
 * DDD: Application port (hexagonal). No Fastify, no protocol scoring here.
 */

import type {
  CREWorkflowOptions,
  CREWorkflowResult,
} from "../../../../../packages/domain/cre/run-cre-workflow.js";

/** ACE risk bands supplied on protect intents (declared by caller; gateway does not score). */
export type VaultProtectRiskLevel =
  | "safe"
  | "watch"
  | "early-warning"
  | "critical";

export interface VaultIntentEnvelopeBase {
  readonly chain: string;
  readonly asset: string;
  readonly amount: string;
  readonly idempotencyKey: string;
  readonly correlationId: string;
  readonly creChainId: string;
  /** From `normalizeVaultAsset` — uppercase symbol for protocol mapping. */
  readonly normalizedAsset: string;
}

/**
 * Vault-gateway execution envelope — mapped from POST body after Zod + eligibility checks.
 * `creChainId` is the normalized chain id passed to CRE (`runCREWorkflow`) or adapters.
 */
export type VaultIntentEnvelope =
  | (VaultIntentEnvelopeBase & {
      readonly intentType: "cre.workflow";
    })
  | (VaultIntentEnvelopeBase & {
      readonly intentType: "aave.buffer.top_up";
    })
  | (VaultIntentEnvelopeBase & {
      readonly intentType: "aave.vault.protect";
      readonly aqAssetId: string;
      readonly riskLevel: VaultProtectRiskLevel;
    })
  | (VaultIntentEnvelopeBase & {
      readonly intentType: "pos.delegate";
      /** Curated validator / partner contract address (checksummed or lower hex). */
      readonly validatorAddress: `0x${string}`;
      readonly partnerId?: string;
      readonly memo?: string;
    });

/** Intent accepted by the orchestration rail (CRE workflow and vault-mapped execution). */
export type OrchestrationIntent =
  | { readonly type: "cre.workflow"; readonly options: CREWorkflowOptions }
  | { readonly type: "vault.intent"; readonly envelope: VaultIntentEnvelope };

export type OrchestrationJobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "unknown";

export interface OrchestrationSubmitResult {
  readonly jobId: string;
  readonly status: OrchestrationJobStatus;
  readonly result?: CREWorkflowResult;
  readonly error?: string;
  /** Echo for vault-gateway tracing. */
  readonly correlationId?: string;
  /** Mapped CRE workflow id (e.g. aave-risk-monitor). */
  readonly workflowDefinitionId?: string;
  /** Remote CRE request/run id when async trigger is used. */
  readonly externalWorkflowId?: string;
}

/**
 * Single top rail for orchestrated execution (CRE workflow today).
 */
export interface OrchestrationPort {
  submitIntent(intent: OrchestrationIntent): Promise<OrchestrationSubmitResult>;
  getJobStatus(jobId: string): Promise<OrchestrationSubmitResult | null>;
}
