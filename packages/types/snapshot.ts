/**
 * MonitorSnapshot — SDK-side API contract
 *
 * Mirrors the normalized response shape returned by:
 *   GET /api/v1/aave-risk/health
 *   GET /api/v1/aave-risk/liquidation-pressure
 *
 * This is a consumer-side type definition.  The backend owns the
 * actual normalization logic — the SDK only reads the result.
 *
 * DO NOT duplicate normalization logic here.
 * DO NOT import from the backend.
 */

/** Protocols supported by the Aquarius Risk API. */
export type SelvaProtocol = "aave" | "compound" | "morpho";

/** Chains supported by the Aquarius Risk API. */
export type SelvaChain =
  | "ethereum"
  | "polygon"
  | "arbitrum"
  | "base"
  | "solana";

/**
 * Normalized risk snapshot as returned by the API.
 *
 * Every field is readonly — snapshots are immutable value objects.
 */
export interface MonitorSnapshot {
  /** Which protocol produced this snapshot. */
  readonly protocol: SelvaProtocol;
  /** Which chain was monitored. */
  readonly chain: SelvaChain;
  /** Composite risk index on a 0–100 scale. */
  readonly globalRiskIndex: number;
  /** Liquidation pressure metric on a 0–100 scale. */
  readonly liquidationPressure: number;
  /** ISO-8601 timestamp of when the pipeline last ran. */
  readonly timestamp: string;
}
