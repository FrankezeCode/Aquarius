/**
 * Maps Klend SDK obligation view → domain KaminoRiskSnapshot (anti-corruption layer).
 * Lives under infrastructure so `protocols/kamino-solana` stays free of Klend SDK imports.
 */

import type { KaminoRiskSnapshot } from "@aquarius/types";
import type { KaminoMarket, KaminoObligation } from "@kamino-finance/klend-sdk";
import type { KaminoCluster } from "../../../domain/ports/kamino.js";

function deriveReserveLabels(
  market: KaminoMarket,
  obligation: KaminoObligation
): string[] {
  const labels = new Set<string>();
  for (const addr of obligation.deposits.keys()) {
    const r = market.getReserveByAddress(addr);
    if (r) labels.add(r.symbol || r.getTokenSymbol());
  }
  for (const addr of obligation.borrows.keys()) {
    const r = market.getReserveByAddress(addr);
    if (r) labels.add(r.symbol || r.getTokenSymbol());
  }
  return [...labels];
}

function deriveSeverity(
  loanToValueRatio: number,
  liquidationLtvRatio: number
): KaminoRiskSnapshot["severity"] {
  if (liquidationLtvRatio <= 0) return "low";
  const cushion = liquidationLtvRatio - loanToValueRatio;
  if (cushion <= 0) return "critical";
  if (cushion < 0.02) return "high";
  if (cushion < 0.06) return "medium";
  return "low";
}

/**
 * Composite 0–100: higher = more risk. Uses LTV proximity to liquidation LTV.
 */
function deriveRiskScore(
  loanToValueRatio: number,
  liquidationLtvRatio: number
): number {
  if (liquidationLtvRatio <= 0) return 5;
  const t = Math.max(0, Math.min(1, loanToValueRatio / liquidationLtvRatio));
  return Math.round(Math.min(100, t * 100));
}

export function mapKaminoObligationToSnapshot(input: {
  obligation: KaminoObligation;
  market: KaminoMarket;
  marketPubkeyBase58: string;
  walletBase58: string;
  cluster: KaminoCluster;
}): KaminoRiskSnapshot {
  const { obligation, market, marketPubkeyBase58, walletBase58, cluster } =
    input;
  const stats = obligation.refreshedStats;
  const loanToValueRatio = stats.loanToValue.toNumber();
  const liquidationLtvRatio = stats.liquidationLtv.toNumber();
  const loanToValuePct = loanToValueRatio * 100;
  const severity = deriveSeverity(loanToValueRatio, liquidationLtvRatio);
  const riskScore = deriveRiskScore(loanToValueRatio, liquidationLtvRatio);
  const reserveLabels = deriveReserveLabels(market, obligation);

  return {
    metadata: {
      protocol: "kamino",
      chainId: 0,
      timestamp: Date.now(),
      solanaCluster: cluster,
    },
    wallet: walletBase58,
    marketPubkey: marketPubkeyBase58,
    loanToValuePct,
    reserveLabels,
    riskScore,
    severity,
  };
}
