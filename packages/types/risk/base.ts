/**
 * Risk Base — Canonical Abstractions
 *
 * These are the ONLY risk types the Selva Runtime is allowed to
 * depend on.  Protocol-specific risk snapshots (Aave, Lido, Uniswap)
 * extend EvaluatableRisk to add protocol-specific fields, but the
 * runtime never sees those fields.
 *
 * Design rule:
 *   Runtime imports  →  base.ts  ONLY
 *   Protocols import →  base.ts  + their own bounded context
 */

// ── Protocol Enum ────────────────────────────────────────────────────

/** Protocols supported by the Aquarius Risk API. */
export type ProtocolId = "aave" | "lido" | "uniswap";

// ── Core Value Objects ───────────────────────────────────────────────

/** Metadata attached to every risk evaluation. */
export interface RiskMetadata {
  /** Which protocol produced this risk. */
  readonly protocol: ProtocolId;
  /** Numeric chain ID (1 = Ethereum, 137 = Polygon, etc.). */
  readonly chainId: number;
  /** Unix epoch ms when the risk was computed. */
  readonly timestamp: number;
}

/** Severity classification. */
export type RiskSeverity = "low" | "medium" | "high" | "critical";

/**
 * The universal risk contract.
 *
 * Every protocol adapter must normalize its data into this shape
 * before the runtime can evaluate it.  This is the boundary
 * between "protocol world" and "runtime world".
 *
 * Fields:
 *   metadata   — who / where / when
 *   riskScore  — 0–100 composite score
 *   severity   — human-readable bucket
 */
export interface EvaluatableRisk {
  readonly metadata: RiskMetadata;
  /** Composite risk score on a 0–100 scale. */
  readonly riskScore: number;
  /** Severity bucket derived from the score. */
  readonly severity: RiskSeverity;
}
