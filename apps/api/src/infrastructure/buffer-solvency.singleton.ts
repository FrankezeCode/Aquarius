import { loadConfig } from "../config/index.js";
import { BufferSolvencyService } from "../protocols/aave/vaults/application/services/buffer-solvency.service.js";
import { getSharedBufferVaultPort } from "./orchestration/vault-intent-executor.factory.js";

let service: BufferSolvencyService | null = null;

export function getBufferSolvencyService(): BufferSolvencyService {
  service ??= new BufferSolvencyService(
    getSharedBufferVaultPort(),
    loadConfig
  );
  return service;
}

export function resetBufferSolvencyServiceForTests(): void {
  service?.resetLastTvlForTests();
  service = null;
}
