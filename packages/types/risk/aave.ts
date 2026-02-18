/**
 * Risk / Aave — Bounded Context
 *
 * Aave-specific risk snapshot that extends the universal
 * EvaluatableRisk contract with Aave domain fields.
 *
 * The Selva Runtime NEVER imports this file.
 * Only the Aave protocol adapter and Aave-Selva SDK module do.
 */

import type { EvaluatableRisk } from "./base.js";

export interface AaveRiskSnapshot extends EvaluatableRisk {
  /** Aave health factor (< 1.0 = liquidatable). */
  readonly healthFactor: number;
  /** Liquidation threshold percentage. */
  readonly liquidationThreshold: number;
}
