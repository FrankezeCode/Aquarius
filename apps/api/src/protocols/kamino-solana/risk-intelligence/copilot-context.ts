/**
 * Kamino — copilot context builder (Kamino semantics only; no Aave vocabulary).
 */

import type { KaminoRiskSnapshot } from "@aquarius/types";
import type { AquariusDomainId } from "@aquarius/types";

export interface KaminoCopilotContext {
  readonly domain: Extract<AquariusDomainId, "kamino-solana">;
  /** Structured lines for LLM / UI (no secrets). */
  readonly lines: readonly string[];
  /** Single blob for prompt injection. */
  readonly promptBlock: string;
}

const MAX_POLICY_LEN = 512;

/**
 * Builds advisory context from KaminoRiskSnapshot + optional user policy note.
 */
export function buildKaminoCopilotContext(
  snapshot: KaminoRiskSnapshot,
  policyNote?: string
): KaminoCopilotContext {
  const policy =
    policyNote && policyNote.trim().length > 0
      ? policyNote.trim().slice(0, MAX_POLICY_LEN)
      : null;

  const lines = [
    `Domain: Kamino Lending on Solana (${snapshot.metadata.solanaCluster ?? "cluster unknown"}).`,
    `Wallet (owner): ${snapshot.wallet}.`,
    `Market (lending): ${snapshot.marketPubkey}.`,
    `Loan-to-value (display): ${snapshot.loanToValuePct.toFixed(2)}%.`,
    `Reserve tags: ${snapshot.reserveLabels.length > 0 ? snapshot.reserveLabels.join(", ") : "none"}.`,
    `Assessed severity: ${snapshot.severity}; composite risk score (0–100): ${snapshot.riskScore}.`,
    policy ? `User policy note: ${policy}` : "User policy note: (none)",
  ];

  const promptBlock = lines.join("\n");

  return {
    domain: "kamino-solana",
    lines,
    promptBlock,
  };
}

/** @deprecated Use buildKaminoCopilotContext(snapshot) with real data. */
export function buildKaminoCopilotContextStub(): {
  domain: Extract<AquariusDomainId, "kamino-solana">;
  context: string;
} {
  return {
    domain: "kamino-solana",
    context: "Kamino copilot context is not wired yet.",
  };
}
