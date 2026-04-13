/**
 * Policy guards for Kamino repay dry-run / write path (Phase D).
 */

import type { Config } from "../../../config/index.js";

export class KaminoWritePolicyError extends Error {
  constructor(
    public readonly code:
      | "WRITE_DISABLED"
      | "RPC_NOT_CONFIGURED"
      | "AMOUNT_EXCEEDS_MAX"
      | "MINT_NOT_ALLOWED"
      | "INVALID_AMOUNT",
    message: string
  ) {
    super(message);
    this.name = "KaminoWritePolicyError";
  }
}

function parsePositiveDecimalUi(s: string): number {
  const n = Number(s.trim());
  if (!Number.isFinite(n) || n < 0) {
    throw new KaminoWritePolicyError("INVALID_AMOUNT", "amountUi must be a non-negative finite number.");
  }
  return n;
}

export function assertRepayDryRunAllowed(
  config: Config,
  input: { amountUi: string; repayMint: string }
): void {
  if (!config.kaminoWriteEnabled) {
    throw new KaminoWritePolicyError(
      "WRITE_DISABLED",
      "Kamino write path is disabled. Set KAMINO_WRITE_ENABLED=true and SOLANA_RPC_URL."
    );
  }

  if (!config.solanaRpcUrl?.trim()) {
    throw new KaminoWritePolicyError(
      "RPC_NOT_CONFIGURED",
      "SOLANA_RPC_URL is required for Kamino repay simulation."
    );
  }

  const amt = parsePositiveDecimalUi(input.amountUi);
  if (amt <= 0) {
    throw new KaminoWritePolicyError(
      "INVALID_AMOUNT",
      "amountUi must be greater than zero for repay dry-run."
    );
  }
  const max = parsePositiveDecimalUi(config.kaminoMaxRepayUi);
  if (amt > max) {
    throw new KaminoWritePolicyError(
      "AMOUNT_EXCEEDS_MAX",
      `amountUi exceeds configured maximum (${config.kaminoMaxRepayUi}).`
    );
  }

  const allow = config.kaminoAllowedRepayMints;
  if (allow && !allow.has(input.repayMint.trim())) {
    throw new KaminoWritePolicyError(
      "MINT_NOT_ALLOWED",
      "repayMint is not in KAMINO_ALLOWED_REPAY_MINTS allowlist."
    );
  }
}
