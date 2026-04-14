/**
 * Maps vault intent types to CRE workflow definition ids for traceability and remote triggers.
 *
 * Defaults align with [`cre-webhook.ts`](../../routes/internal/ingest/cre-webhook.ts) AAVE_RISK_WORKFLOWS.
 */

export type VaultIntentTypeKey =
  | "cre.workflow"
  | "aave.buffer.top_up"
  | "aave.vault.protect"
  | "pos.delegate";

export function resolveWorkflowDefinitionId(
  intentType: VaultIntentTypeKey,
  envWorkflowOverride: string | undefined
): string {
  if (envWorkflowOverride?.trim()) {
    return envWorkflowOverride.trim();
  }
  switch (intentType) {
    case "cre.workflow":
      return "aave-risk-monitor";
    case "aave.buffer.top_up":
      return "aave-buffer-top-up";
    case "aave.vault.protect":
      return "aave-vault-protect";
    case "pos.delegate":
      return "pos-partner-delegate";
  }
}
