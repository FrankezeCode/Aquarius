/**
 * Vault Services — Barrel Export
 *
 * Bounded context: Aave / Vaults / Application / Services
 */

export {
  VaultService,
  type DepositResult,
  type WithdrawResult,
  type MitigationResult,
} from "./vault.service.js";

export { VaultMonitoringAgent } from "./monitoring-agent.service.js";
export { VaultActionAgent } from "./action-agent.service.js";
export { SecureVaultAgent } from "./secure-agent.service.js";
export {
  VaultDryRunOrchestrator,
  type DryRunResult,
} from "./dry-run-orchestrator.service.js";

export {
  BufferSolvencyService,
  type BufferHealthResponseDto,
} from "./buffer-solvency.service.js";
