/**
 * SDK Provider
 *
 * Wraps the base Aquarius client with protocol-aware routing.
 * Consumers use the provider to interact with protocol-specific
 * SDK modules without managing client configuration directly.
 */

import { createClient, type AquariusClient, type AquariusClientConfig } from "./client.js";

export interface AquariusProviderConfig extends AquariusClientConfig {
  /** Default timeout (ms) for SDK requests. */
  timeoutMs?: number;
}

export interface AquariusProvider {
  client: AquariusClient;
  config: AquariusProviderConfig;
}

/**
 * Create an Aquarius SDK provider.
 *
 * Usage:
 * ```ts
 * const provider = createProvider({ baseUrl: "https://api.aquarius.dev" });
 * ```
 */
export function createProvider(config: AquariusProviderConfig): AquariusProvider {
  const client = createClient({ baseUrl: config.baseUrl });
  return { client, config };
}

export type { AquariusClient, AquariusClientConfig };
