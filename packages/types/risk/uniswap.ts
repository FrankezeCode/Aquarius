/**
 * Risk / Uniswap — Bounded Context
 *
 * Uniswap-specific risk snapshot that extends the universal
 * EvaluatableRisk contract with Uniswap LP domain fields.
 *
 * The Selva Runtime NEVER imports this file.
 * Only the Uniswap protocol adapter and Uniswap-Selva SDK module do.
 */

import type { EvaluatableRisk } from "./base.js";

export interface UniswapRiskSnapshot extends EvaluatableRisk {
  /** Impermanent loss percentage (0–100). */
  readonly impermanentLoss: number;
  /** Liquidity skew metric (0–100, 50 = balanced). */
  readonly liquiditySkew: number;
}
