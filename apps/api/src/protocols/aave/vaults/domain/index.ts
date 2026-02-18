/**
 * Vaults Domain — Barrel Export
 *
 * Bounded context: Aave / Vaults / Domain
 *
 * Re-exports all vault domain types, entities, and functions.
 */

export {
  type UnderlyingAsset,
  type AqAsset,
  toAqSymbol,
  mintAqAsset,
  accrueYield,
  redeemableValue,
  validateAqAsset,
} from "./aq-asset.js";

export {
  type CollateralSource,
  type CollateralAsset,
  createCollateralAsset,
  recordYield,
  harvestYield,
  validateCollateral,
} from "./collateral-asset.js";

export {
  type MitigationAction,
  type RiskMitigationStrategy,
  resolveStrategy,
  requiresMitigation,
  allStrategies,
} from "./risk-mitigation-strategy.js";

export type {
  VaultAgentDecision,
  VaultRiskAlert,
} from "./agent-decision.js";
