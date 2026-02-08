/**
 * Uniswap-Selva — Arbitrage Module
 *
 * Public API for Uniswap arbitrage opportunity consumption via the Aquarius SDK.
 * This module provides typed methods for fetching arb data from the API.
 */

import type { AquariusClient } from "../client.js";
import type {
  UniswapArbOpportunity,
  UniswapPoolSummary,
  UniswapArbQuery,
} from "./types.js";

/**
 * Fetch the latest Uniswap arbitrage opportunities.
 * TODO: Wire to real API endpoint.
 */
export async function getUniswapArbOpportunities(
  client: AquariusClient,
  query?: UniswapArbQuery
): Promise<UniswapArbOpportunity[]> {
  const params = new URLSearchParams();
  if (query?.chainId) params.set("chainId", query.chainId);
  if (query?.minProfitBps) params.set("minProfitBps", String(query.minProfitBps));
  if (query?.limit) params.set("limit", String(query.limit));
  if (query?.offset) params.set("offset", String(query.offset));

  const qs = params.toString();
  const path = `/api/v1/protocol/uniswap/public/signals/hf-risk${qs ? `?${qs}` : ""}`;
  const res = await client.fetch(path);
  return res.json() as Promise<UniswapArbOpportunity[]>;
}

/**
 * Fetch Uniswap pool summary for a specific chain.
 * TODO: Wire to real API endpoint.
 */
export async function getUniswapPoolSummary(
  client: AquariusClient,
  chainId: string
): Promise<UniswapPoolSummary> {
  const path = `/api/v1/protocol/uniswap/chains/${chainId}/liquidity`;
  const res = await client.fetch(path);
  return res.json() as Promise<UniswapPoolSummary>;
}
