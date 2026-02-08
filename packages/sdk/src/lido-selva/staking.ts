/**
 * Lido-Selva — Staking Module
 *
 * Public API for Lido staking data consumption via the Aquarius SDK.
 * This module provides typed methods for fetching staking data from the API.
 */

import type { AquariusClient } from "../client.js";
import type {
  LidoStakingPosition,
  LidoStakingSummary,
  LidoStakingQuery,
} from "./types.js";

/**
 * Fetch Lido staking positions.
 * TODO: Wire to real API endpoint.
 */
export async function getLidoStakingPositions(
  client: AquariusClient,
  query?: LidoStakingQuery
): Promise<LidoStakingPosition[]> {
  const params = new URLSearchParams();
  if (query?.chainId) params.set("chainId", query.chainId);
  if (query?.limit) params.set("limit", String(query.limit));
  if (query?.offset) params.set("offset", String(query.offset));

  const qs = params.toString();
  const path = `/api/v1/protocol/lido/public/staking${qs ? `?${qs}` : ""}`;
  const res = await client.fetch(path);
  return res.json() as Promise<LidoStakingPosition[]>;
}

/**
 * Fetch Lido staking summary.
 * TODO: Wire to real API endpoint.
 */
export async function getLidoStakingSummary(
  client: AquariusClient,
  chainId: string = "ethereum"
): Promise<LidoStakingSummary> {
  const path = `/api/v1/protocol/lido/chains/${chainId}/liquidity`;
  const res = await client.fetch(path);
  return res.json() as Promise<LidoStakingSummary>;
}
