/**
 * Escalation Store — Per-Chain Singleton Registry
 *
 * Maintains persistent EscalationStateMachine instances across CRE
 * polling cycles. Each chain gets its own machine so risk state
 * accumulates over time rather than resetting every poll.
 *
 * In-memory only. Resets on process restart.
 */

import { EscalationStateMachine, type EscalationConfig } from "./escalation-state-machine.js";

const machines = new Map<string, EscalationStateMachine>();

export function getEscalationMachine(
  chainId: string,
  config?: Partial<EscalationConfig>,
): EscalationStateMachine {
  let machine = machines.get(chainId);
  if (!machine) {
    machine = new EscalationStateMachine(config);
    machines.set(chainId, machine);
  }
  return machine;
}

export function resetEscalationMachine(chainId: string): void {
  machines.delete(chainId);
}

export function resetAllEscalationMachines(): void {
  machines.clear();
}
