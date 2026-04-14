/**
 * Default VaultIntentExecutor — Aave adapter with in-memory vault ports (simulated chain).
 *
 * Uses one shared InMemoryBufferVault per process so buffer-health metrics observe the same state as vault intents.
 */

import type { VaultIntentExecutor } from "../../application/ports/vault-intent-executor.port.js";
import type { BufferVaultPort } from "../../protocols/aave/vaults/application/ports/vault.port.js";
import { VaultService } from "../../protocols/aave/vaults/application/services/vault.service.js";
import {
  AaveVaultAdapter,
  InMemoryBufferVault,
  StubCREMitigationAdapter,
  StubStakingIntegration,
} from "../../protocols/aave/vaults/infrastructure/index.js";

let sharedBuffer: InMemoryBufferVault | null = null;

/** Shared buffer store (same instance as default Aave vault executor). */
export function getSharedInMemoryBufferVault(): InMemoryBufferVault {
  sharedBuffer ??= new InMemoryBufferVault();
  return sharedBuffer;
}

export function resetSharedInMemoryBufferVaultForTests(): void {
  sharedBuffer?.clear();
  sharedBuffer = null;
}

/** For metrics services that only need the port contract. */
export function getSharedBufferVaultPort(): BufferVaultPort {
  return getSharedInMemoryBufferVault();
}

export function createAaveVaultIntentExecutor(deps?: {
  buffer?: InMemoryBufferVault;
}): VaultIntentExecutor {
  const buffer = deps?.buffer ?? getSharedInMemoryBufferVault();
  const staking = new StubStakingIntegration();
  const mitigation = new StubCREMitigationAdapter();
  const vaultService = new VaultService(buffer, staking, mitigation);
  return new AaveVaultAdapter(vaultService);
}
