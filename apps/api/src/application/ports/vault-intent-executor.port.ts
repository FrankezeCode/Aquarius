/**
 * Vault intent executor — application port for Aave (and future Kamino) vault/buffer
 * operations invoked only from orchestration, not from vault-gateway HTTP.
 */

import type { CREWorkflowResult } from "../../../../../packages/domain/cre/run-cre-workflow.js";
import type { VaultProtectRiskLevel } from "./orchestration.port.js";

export interface VaultBufferTopUpInput {
  readonly creChainId: string;
  readonly normalizedAsset: string;
  readonly amountDecimal: string;
  readonly simulatedOwner: string;
}

export interface VaultProtectPathInput {
  readonly creChainId: string;
  readonly aqAssetId: string;
  readonly riskLevel: VaultProtectRiskLevel;
}

export interface VaultIntentExecutor {
  executeBufferTopUp(input: VaultBufferTopUpInput): Promise<CREWorkflowResult>;
  executeProtectPath(input: VaultProtectPathInput): Promise<CREWorkflowResult>;
}
