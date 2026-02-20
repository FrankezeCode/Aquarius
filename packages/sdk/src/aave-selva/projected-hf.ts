/**
 * Aave-Selva — Projected Health Factor
 *
 * SDK method that calls the Aquarius API to get a predictive
 * health factor projection for a specific user.
 */

import type { AquariusClient } from "../client.js";
import type { ProjectedHFResponse } from "./types.js";

/**
 * Get the projected health factor for an Aave V3 user.
 *
 * @param client - Aquarius SDK client instance
 * @param user - Ethereum address of the position owner
 * @param blocksAhead - How many blocks to project forward (default: 2)
 * @returns Projected HF, confidence, velocity, and liquidation probability
 */
export async function getProjectedHF(
  client: AquariusClient,
  user: string,
  blocksAhead: number = 2
): Promise<ProjectedHFResponse> {
  const path = `/api/v1/aave-risk/projected-hf/${user}?blocks=${blocksAhead}`;
  const res = await client.fetch(path);
  return res.json() as Promise<ProjectedHFResponse>;
}
