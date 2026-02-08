/**
 * Aave-Selva — Risk Module
 *
 * Public API for Aave risk signal consumption via the Aquarius SDK.
 * This module provides typed methods for fetching risk data from the API.
 */

import type { AquariusClient } from "../client.js";
import type {
  AaveRiskSignal,
  AaveMarketRiskSummary,
  AaveRiskQuery,
} from "./types.js";

/**
 * Fetch the latest Aave risk signals.
 * TODO: Wire to real API endpoint.
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
 * TODO: Wire to real API endpoint.
 */
export async function getAaveMarketRisk(
  client: AquariusClient,
  chainId: string
): Promise<AaveMarketRiskSummary> {
  const path = `/api/v1/protocol/aave/chains/${chainId}/liquidity`;
  const res = await client.fetch(path);
  return res.json() as Promise<AaveMarketRiskSummary>;
}
