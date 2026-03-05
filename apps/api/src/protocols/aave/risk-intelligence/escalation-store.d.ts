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
export declare function getEscalationMachine(chainId: string, config?: Partial<EscalationConfig>): EscalationStateMachine;
export declare function resetEscalationMachine(chainId: string): void;
export declare function resetAllEscalationMachines(): void;
//# sourceMappingURL=escalation-store.d.ts.map