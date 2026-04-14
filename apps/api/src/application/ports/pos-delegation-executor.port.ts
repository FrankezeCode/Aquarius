/**
 * PoS / curated partner delegation — application port (no HTTP, no vault-gateway imports).
 */

import type { CREWorkflowResult } from "../../../../../packages/domain/cre/run-cre-workflow.js";

export interface PosDelegationInput {
  readonly creChainId: string;
  readonly normalizedAsset: string;
  readonly amountDecimal: string;
  /** Curated validator / partner contract address (0x…). */
  readonly validatorAddress: `0x${string}`;
  readonly partnerId?: string;
  readonly memo?: string;
}

export interface PosDelegationExecutor {
  executePartnerDelegation(input: PosDelegationInput): Promise<CREWorkflowResult>;
}
