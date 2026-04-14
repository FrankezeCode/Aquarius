import { loadConfig } from "../config/index.js";
import { PartnerDelegationAdapter } from "../protocols/pos/partner-delegation.adapter.js";
import type { PosDelegationExecutor } from "../application/ports/pos-delegation-executor.port.js";

let shared: PosDelegationExecutor | null = null;

export function getPosDelegationExecutor(): PosDelegationExecutor {
  shared ??= new PartnerDelegationAdapter({ getConfig: loadConfig });
  return shared;
}

export function resetPosDelegationExecutorForTests(): void {
  shared = null;
}
