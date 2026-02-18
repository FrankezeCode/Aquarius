/**
 * Vaults Module — Barrel Export
 *
 * Bounded context: Aave / Vaults
 *
 * Automated Risk Mitigation & Yield Vault for Aave borrowers.
 * Collateral is deposited as aqAsset tokens (aqETH, aqPOL, aqWETH)
 * that accrue yield and enable automated risk mitigation.
 *
 * Architecture:
 *   Domain         — aqAsset entity, CollateralAsset, RiskMitigationStrategy
 *   Application    — VaultService orchestration + ports
 *   Infrastructure — BufferVault, StakingIntegration, CRE adapter
 */

// ── Domain ───────────────────────────────────────────────────────────
export {
  type UnderlyingAsset,
  type AqAsset,
  type CollateralSource,
  type CollateralAsset,
  type MitigationAction,
  type RiskMitigationStrategy,
  type VaultAgentDecision,
  type VaultRiskAlert,
  toAqSymbol,
  mintAqAsset,
  accrueYield,
  redeemableValue,
  validateAqAsset,
  createCollateralAsset,
  recordYield,
  harvestYield,
  validateCollateral,
  resolveStrategy,
  requiresMitigation,
  allStrategies,
} from "./domain/index.js";

// ── Application ──────────────────────────────────────────────────────
export {
  VaultService,
  type DepositResult,
  type WithdrawResult,
  type MitigationResult,
  VaultMonitoringAgent,
  VaultActionAgent,
  SecureVaultAgent,
  VaultDryRunOrchestrator,
  type DryRunResult,
  type BufferVaultPort,
  type StakingPort,
  type MitigationPort,
} from "./application/index.js";

// ── Infrastructure ───────────────────────────────────────────────────
export {
  InMemoryBufferVault,
  StubStakingIntegration,
  StubCREMitigationAdapter,
} from "./infrastructure/index.js";
