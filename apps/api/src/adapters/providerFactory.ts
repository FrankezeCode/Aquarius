/**
 * Provider Factory — Runtime Data Source Selection
 *
 * Reads DATA_PROVIDER_MODE from environment and returns the
 * appropriate IMarketDataProvider implementation.
 *
 * Switching data source is an env change — no code changes required.
 *
 * Supported modes:
 *   - "mock"      → MockMarketDataProvider (synthetic random data)
 *   - "tenderly"  → TenderlyMarketDataProvider (Tenderly Virtual TestNet)
 *   - "onchain"   → OnchainMarketDataProvider (mainnet / live chain RPC)
 *   - "realtime"  → GraphMarketDataProvider (in-memory position graph, WSS-fed)
 *
 * Default: "mock"
 */

import type { IMarketDataProvider } from "../domain/ports/IMarketDataProvider.js";
import { MockMarketDataProvider } from "./mock/MockMarketDataProvider.js";
import { TenderlyMarketDataProvider } from "./tenderly/TenderlyMarketDataProvider.js";
import { OnchainMarketDataProvider } from "./onchain/OnchainMarketDataProvider.js";
import { GraphMarketDataProvider } from "./realtime/GraphMarketDataProvider.js";

export type DataProviderMode = "mock" | "tenderly" | "onchain" | "realtime";

/**
 * Shared reference to the position graph instance.
 * Set by the event engine bootstrap; consumed by the "realtime" provider.
 */
let _graphStoreRef: unknown = null;

export function setGraphStoreRef(graph: unknown): void {
  _graphStoreRef = graph;
}

export function resolveDataProviderMode(): DataProviderMode {
  return (process.env.DATA_PROVIDER_MODE ?? "mock") as DataProviderMode;
}

export function isTenderlyValidationRequired(): boolean {
  return process.env.AAVE_VALIDATION_REQUIRE_TENDERLY === "1";
}

export function getTenderlyValidationError(): string | null {
  const mode = resolveDataProviderMode();
  if (!isTenderlyValidationRequired()) return null;
  if (mode === "tenderly") return null;
  return (
    `Aave validation requires DATA_PROVIDER_MODE=tenderly, but got "${mode}". ` +
    "Set DATA_PROVIDER_MODE=tenderly (or disable AAVE_VALIDATION_REQUIRE_TENDERLY=1)."
  );
}

export function createMarketDataProvider(): IMarketDataProvider {
  const mode = resolveDataProviderMode();
  const resolveTenderlyRpc = (chainId: string): string | null => {
    if (chainId === "polygon") {
      return process.env.TENDERLY_RPC_URL_POLYGON ?? process.env.TENDERLY_RPC_URL ?? null;
    }
    return process.env.TENDERLY_RPC_URL_ETHEREUM ?? process.env.TENDERLY_RPC_URL ?? null;
  };
  const resolveOnchainRpc = (chainId: string): string | null => {
    if (chainId === "polygon") {
      return process.env.RPC_URL_POLYGON ?? process.env.RPC_URL ?? null;
    }
    return process.env.RPC_URL_ETHEREUM ?? process.env.RPC_URL ?? null;
  };

  switch (mode) {
    case "realtime": {
      if (!_graphStoreRef) {
        throw new Error(
          "DATA_PROVIDER_MODE=realtime requires the event engine to be running. " +
          "Call setGraphStoreRef() during bootstrap."
        );
      }
      return new GraphMarketDataProvider(
        _graphStoreRef as ConstructorParameters<typeof GraphMarketDataProvider>[0]
      );
    }

    case "tenderly":
      return new TenderlyMarketDataProvider(
        resolveTenderlyRpc("ethereum")!,
        resolveTenderlyRpc
      );

    case "onchain":
      return new OnchainMarketDataProvider(
        resolveOnchainRpc("ethereum")!,
        resolveOnchainRpc
      );

    case "mock":
    default:
      return new MockMarketDataProvider();
  }
}
