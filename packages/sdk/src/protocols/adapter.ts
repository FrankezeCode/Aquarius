/**
 * Protocol Risk Adapter — Interface Contract
 *
 * Every protocol bounded context (Aave, Lido, Uniswap) must
 * implement this interface to participate in the Selva Runtime.
 *
 * The adapter pattern enforces separation:
 *   - fetch()     lives in protocol land (HTTP, protocol-specific)
 *   - normalize() lives in protocol land (protocol-specific math)
 *   - Runtime receives only the normalized EvaluatableRisk
 *
 * TRaw is the protocol-specific raw snapshot type
 * (e.g. AaveRiskSnapshot, LidoRiskSnapshot).
 *
 * Usage:
 * ```ts
 * class AaveAdapter implements ProtocolRiskAdapter<AaveRiskSnapshot> {
 *   async fetch() { ... }      // HTTP to Aave API
 *   normalize(raw) { ... }     // Aave math → EvaluatableRisk
 * }
 * ```
 */

import type { EvaluatableRisk } from "../runtime/types.js";

export interface ProtocolRiskAdapter<TRaw = unknown> {
  /**
   * Fetch protocol-specific raw risk data.
   * This is the ONLY place HTTP calls are allowed.
   */
  fetch(): Promise<TRaw>;

  /**
   * Normalize protocol-specific data into EvaluatableRisk.
   * Pure function — no side effects, no HTTP.
   * This is where protocol-specific math lives.
   */
  normalize(raw: TRaw): EvaluatableRisk;
}
