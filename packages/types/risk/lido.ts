/**
 * Risk / Lido — Bounded Context
 *
 * Lido-specific risk snapshot that extends the universal
 * EvaluatableRisk contract with Lido staking domain fields.
 *
 * The Selva Runtime NEVER imports this file.
 * Only the Lido protocol adapter and Lido-Selva SDK module do.
 */

import type { EvaluatableRisk } from "./base.js";

export interface LidoRiskSnapshot extends EvaluatableRisk {
  /** Validator concentration exposure (0–100). */
  readonly validatorExposure: number;
  /** Slashing risk score (0–100). */
  readonly slashingRisk: number;
}
