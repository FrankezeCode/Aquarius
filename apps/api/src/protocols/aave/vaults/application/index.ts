/**
 * Vault Application Layer — Barrel Export
 *
 * Bounded context: Aave / Vaults / Application
 */

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
} from "./services/index.js";

export type {
  BufferVaultPort,
  StakingPort,
  MitigationPort,
} from "./ports/index.js";
