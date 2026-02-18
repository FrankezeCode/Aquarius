/**
 * Aave-Selva — Risk Module
 *
 * Public API for Aave risk signal consumption via the Aquarius SDK.
 *
 * Architecture:
 *   AaveRiskAdapter   — implements ProtocolRiskAdapter<AaveRiskSnapshot>
 *                        Owns: HTTP fetch + normalization math
 *   getRisk()         — Convenience function (fetch + normalize)
 *   guard()           — Convenience function (fetch + normalize + evaluate)
 *
 * The runtime NEVER touches AaveRiskSnapshot directly.
 * It only receives EvaluatableRisk via the adapter's normalize().
 */

import type { AquariusClient } from "../client.js";
import type { ProtocolRiskAdapter } from "../protocols/adapter.js";
import type { EvaluatableRisk, RiskSeverity } from "../runtime/types.js";
import { SelvaStrategy } from "../runtime/strategy.js";
import type {
  AaveRiskSignal,
  AaveMarketRiskSummary,
  AaveRiskQuery,
  AaveRiskSnapshot,
  AaveRiskApiResponse,
} from "./types.js";

// ── Normalization (protocol-specific math) ───────────────────────────

/**
 * Derive severity from a 0–100 risk score.
 * This math lives HERE — inside the Aave bounded context.
 * The runtime never does this.
 */
function deriveSeverity(riskScore: number): RiskSeverity {
  if (riskScore >= 80) return "critical";
  if (riskScore >= 60) return "high";
  if (riskScore >= 35) return "medium";
  return "low";
}

// ── Adapter ──────────────────────────────────────────────────────────

/**
 * Aave risk adapter.
 *
 * Implements the ProtocolRiskAdapter contract:
 *   fetch()     — HTTP to Aquarius API
 *   normalize() — raw API response → AaveRiskSnapshot (which IS an EvaluatableRisk)
 */
export class AaveRiskAdapter
  implements ProtocolRiskAdapter<AaveRiskApiResponse>
{
  constructor(
    private readonly client: AquariusClient,
    private readonly chainId: number = 1
  ) {}

  async fetch(): Promise<AaveRiskApiResponse> {
    const path = `/api/v1/aave-risk/health/${this.chainId}`;
    const res = await this.client.fetch(path);
    return res.json() as Promise<AaveRiskApiResponse>;
  }

  normalize(raw: AaveRiskApiResponse): AaveRiskSnapshot {
    const riskScore = raw.globalRiskIndex;
    return {
      metadata: {
        protocol: "aave",
        chainId: raw.chainId,
        timestamp: raw.timestamp,
      },
      riskScore,
      severity: deriveSeverity(riskScore),
      healthFactor: raw.healthFactor,
      liquidationThreshold: raw.liquidationThreshold,
    };
  }
}

// ── Convenience Functions ────────────────────────────────────────────

/**
 * Fetch + normalize Aave risk into EvaluatableRisk.
 *
 * Returns an AaveRiskSnapshot (which extends EvaluatableRisk), so
 * callers who know they're in Aave context can access healthFactor
 * etc., while the runtime only sees the base contract.
 */
export async function getRisk(
  client: AquariusClient,
  chainId: number = 1
): Promise<AaveRiskSnapshot> {
  const adapter = new AaveRiskAdapter(client, chainId);
  const raw = await adapter.fetch();
  return adapter.normalize(raw);
}

/**
 * Fetch + normalize + evaluate through strategy runtime.
 *
 * Uses the new decoupled pattern:
 *   strategy.guard(key, fetcher)
 *
 * The fetcher is a closure that fetch + normalizes.
 * The runtime receives only EvaluatableRisk.
 */
export async function guard(
  client: AquariusClient,
  chainId: number,
  strategy: SelvaStrategy
): Promise<EvaluatableRisk> {
  const adapter = new AaveRiskAdapter(client, chainId);

  return strategy.guard(`aave:${chainId}`, async () => {
    const raw = await adapter.fetch();
    return adapter.normalize(raw);
  });
}

// ── Legacy API (preserved for backward compatibility) ────────────────

/**
 * Fetch the latest Aave risk signals.
 * @deprecated Use getRisk() + SelvaStrategy for new code.
 */
export async function getAaveRiskSignals(
  client: AquariusClient,
  query?: AaveRiskQuery
): Promise<AaveRiskSignal[]> {
  const params = new URLSearchParams();
  if (query?.chainId) params.set("chainId", query.chainId);
  if (query?.riskLevel) params.set("riskLevel", query.riskLevel);
  if (query?.limit) params.set("limit", String(query.limit));
  if (query?.offset) params.set("offset", String(query.offset));

  const qs = params.toString();
  const path = `/api/v1/protocol/aave/public/signals/hf-risk${qs ? `?${qs}` : ""}`;
  const res = await client.fetch(path);
  return res.json() as Promise<AaveRiskSignal[]>;
}

/**
 * Fetch Aave market risk summary for a specific chain.
 * @deprecated Use getRisk() for new code.
 */
export async function getAaveMarketRisk(
  client: AquariusClient,
  chainId: string
): Promise<AaveMarketRiskSummary> {
  const path = `/api/v1/protocol/aave/chains/${chainId}/liquidity`;
  const res = await client.fetch(path);
  return res.json() as Promise<AaveMarketRiskSummary>;
}
