/**
 * Shared Protocol Context Types
 *
 * Bounded context: Shared / Types
 *
 * Protocol identification types used across bounded contexts.
 * These are protocol-agnostic — no concrete protocol logic.
 *
 * DDD role: Shared Kernel (types only, no logic).
 */

// ── Types ────────────────────────────────────────────────────────────

/** Protocols supported by Aquarius. */
export type SupportedProtocol = "AAVE" | "UNISWAP" | "LIDO";

/**
 * Protocol context passed alongside agent execution requests.
 * The `snapshot` field carries protocol-specific risk data (narrowed
 * inside each protocol's bounded context).
 */
export interface ProtocolContext {
  /** Which protocol this context belongs to. */
  protocol: SupportedProtocol;
  /** Protocol-specific risk snapshot — opaque at shared level. */
  snapshot: unknown;
}
