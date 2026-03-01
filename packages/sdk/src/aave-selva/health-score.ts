/**
 * Aave-Selva — Health Score
 *
 * SDK methods for fetching protocol and user health scores
 * from the Aquarius API.
 */

import type { AquariusClient } from "../client.js";
import type {
  ProtocolHealthScore,
  UserHealthScore,
  UserRiskResponse,
} from "./types.js";

/**
 * Get the protocol-level health score for Aave.
 *
 * @param client - Aquarius SDK client instance
 * @param chain - Chain to query (default: "ethereum")
 *
 * Throws if the API returns non-2xx (including 503 when
 * validation requires DATA_PROVIDER_MODE=tenderly).
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
 *
 * Throws if the API returns non-2xx (including 503 when
 * validation requires DATA_PROVIDER_MODE=tenderly).
 */
export async function getUserHealth(
  client: AquariusClient,
  address: string
): Promise<UserHealthScore> {
  const path = `/api/v1/aave-risk/user-health/${address}`;
  const res = await client.fetch(path);
  return res.json() as Promise<UserHealthScore>;
}

/**
 * Get the unified user-risk projection for direct UI rendering.
 *
 * @param client - Aquarius SDK client instance
 * @param address - Ethereum address
 */
export async function getUserRisk(
  client: AquariusClient,
  address: string
): Promise<UserRiskResponse> {
  const path = `/api/v1/aave-risk/user-risk/${address}`;
  const res = await client.fetch(path);
  return res.json() as Promise<UserRiskResponse>;
}
