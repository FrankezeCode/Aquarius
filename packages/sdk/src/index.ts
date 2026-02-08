/**
 * Aquarius SDK — Public Entry Point
 *
 * Re-exports all existing SDK primitives plus protocol-specific
 * bounded contexts (DDD pattern).
 *
 * Backward-compatible: all original exports are preserved.
 */

// ── Core SDK primitives (preserved) ──────────────────────────────────
export { createClient, type AquariusClient, type AquariusClientConfig } from "./client.js";
export { type StreamKind, type StreamConfig } from "./streams.js";
export { type ChainId, type ProtocolEndpoint } from "./protocols.js";

// ── Provider ─────────────────────────────────────────────────────────
export { createProvider, type AquariusProvider, type AquariusProviderConfig } from "./provider.js";

// ── Protocol Bounded Contexts (DDD) ──────────────────────────────────
export * as aaveSelva from "./aave-selva/index.js";
export * as uniswapSelva from "./uniswap-selva/index.js";
export * as lidoSelva from "./lido-selva/index.js";
