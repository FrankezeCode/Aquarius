/**
 * Aave-Selva — Health Score
 *
 * SDK methods for fetching protocol and user health scores
 * from the Aquarius API.
 */

import type { AquariusClient } from "../client.js";
import type { ProtocolHealthScore, UserHealthScore } from "./types.js";

/**
 * Get the protocol-level health score for Aave.
 *
 * @param client - Aquarius SDK client instance
 * @param chain - Chain to query (default: "ethereum")
 */
export async function getProtocolHealth(
  client: AquariusClient,
  chain: string = "ethereum"
): Promise<ProtocolHealthScore> {
  const path = `/api/v1/aave-risk/protocol-health/${chain}`;
  const res = await client.fetch(path);
  return res.json() as Promise<ProtocolHealthScore>;
}

/**
 * Get the user-level health score for a wallet on Aave.
 *
 * @param client - Aquarius SDK client instance
 * @param address - Ethereum address
 */
export async function getUserHealth(
  client: AquariusClient,
  address: string
): Promise<UserHealthScore> {
  const path = `/api/v1/aave-risk/user-health/${address}`;
  const res = await client.fetch(path);
  return res.json() as Promise<UserHealthScore>;
}
