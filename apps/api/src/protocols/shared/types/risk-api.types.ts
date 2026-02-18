/**
 * Shared — Risk API Types
 *
 * Bounded context: Shared / Types
 *
 * Canonical types for the API-as-a-Product layer's multi-protocol
 * risk intelligence surface.  These are transport-layer contracts
 * — no domain logic, no scoring, no CRE.
 *
 * DDD role: Shared Kernel (types only).
 */

// ── Protocol ─────────────────────────────────────────────────────────

/**
 * Protocols exposed via the public Risk API.
 * Lowercase for URL-safe slug usage (e.g. /api/v1/aave-risk/...).
 */
export enum Protocol {
  AAVE = "aave",
  COMPOUND = "compound",
  MORPHO = "morpho",
}

/** Set of valid protocol slugs for fast O(1) validation. */
export const VALID_PROTOCOLS = new Set<string>(Object.values(Protocol));

// ── Chain ────────────────────────────────────────────────────────────

/** Chains supported by the Risk API. */
export type Chain =
  | "ethereum"
  | "polygon"
  | "arbitrum"
  | "base"
  | "solana";

/** Set of valid chain slugs for fast O(1) validation. */
export const VALID_CHAINS = new Set<string>([
  "ethereum",
  "polygon",
  "arbitrum",
  "base",
  "solana",
]);

/** Default chain when callers omit the parameter. */
export const DEFAULT_CHAIN: Chain = "ethereum";

// ── Snapshot Key ─────────────────────────────────────────────────────

/**
 * Composite cache key:  `protocol:chain`
 *
 * Examples: `aave:ethereum`, `compound:polygon`
 */
export type SnapshotKey = `${Protocol}:${Chain}`;

/** Build a type-safe snapshot key. */
export function buildSnapshotKey(protocol: Protocol, chain: Chain): SnapshotKey {
  return `${protocol}:${chain}`;
}
