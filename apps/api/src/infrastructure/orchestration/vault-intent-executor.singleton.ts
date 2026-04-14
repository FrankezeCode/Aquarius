import type { VaultIntentExecutor } from "../../application/ports/vault-intent-executor.port.js";
import {
  createAaveVaultIntentExecutor,
  resetSharedInMemoryBufferVaultForTests,
} from "./vault-intent-executor.factory.js";

let shared: VaultIntentExecutor | null = null;

export function getVaultIntentExecutor(): VaultIntentExecutor {
  shared ??= createAaveVaultIntentExecutor();
  return shared;
}

/** Tests: next `getVaultIntentExecutor()` builds a fresh Aave stack and buffer store. */
export function resetVaultIntentExecutorForTests(): void {
  shared = null;
  resetSharedInMemoryBufferVaultForTests();
}
