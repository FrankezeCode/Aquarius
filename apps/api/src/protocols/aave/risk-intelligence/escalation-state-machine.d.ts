/**
 * SELVA Escalation State Machine
 *
 * Bounded context: Aave / Risk Intelligence
 *
 * Deterministic finite-state machine controlling risk escalation:
 *
 *   INFO       → Signals accumulating, observe only
 *   CONFIRM    → Action threshold crossed, backend triggers mitigation
 *   INVALIDATE → Mitigation failed or system breach, emergency escalation
 *
 * Each stage has entry conditions, exit conditions, and mapped backend behavior.
 * State persists across CRE polling cycles via escalation-store.
 *
 * Design:
 *   - Hysteresis prevents stage flapping
 *   - Convergence requirement prevents single-metric spikes from triggering CONFIRM
 *   - Action window tracking enables CONFIRM→INVALIDATE on mitigation failure
 *   - De-escalation ensures system doesn't lock in red
 */
import { type AccumulatorConfig } from "./risk-accumulator.js";
import { type StageStability, type EscalationTimelineEvent } from "./escalation-telemetry.js";
export type { StageStability, EscalationTimelineEvent } from "./escalation-telemetry.js";
export type Stage = "info" | "confirm" | "invalidate";
export type ActionRequired = "none" | "protect" | "escalate";
export interface EscalationConfig {
    /** Accumulator threshold for INFO → CONFIRM. */
    t1: number;
    /** Accumulator threshold for CONFIRM → INVALIDATE. */
    t2: number;
    /** Hysteresis factor for de-escalation (demote at T * hysteresis). */
    hysteresis: number;
    /** Milliseconds allowed for action to succeed before INVALIDATE. */
    actionWindowMs: number;
    /** Minimum convergent dimensions required for CONFIRM. */
    minConvergence: number;
    /** Accumulator config. */
    accumulator: AccumulatorConfig;
}
export declare const DEFAULT_ESCALATION_CONFIG: EscalationConfig;
export interface LastAction {
    type: string;
    success: boolean;
    timestamp: number;
}
export interface EscalationState {
    stage: Stage;
    accumulator: number;
    enteredAt: number;
    convergenceSignals: string[];
    transitionReason: string;
    lastAction: LastAction | null;
    velocity?: number;
    stageStability?: StageStability;
    timeline?: EscalationTimelineEvent[];
}
export interface StageTransition {
    from: Stage;
    to: Stage;
    reason: string;
    timestamp: number;
    accumulatorValue: number;
}
export interface TransitionResult {
    state: EscalationState;
    transition: StageTransition | null;
    actionRequired: ActionRequired;
}
export declare class EscalationStateMachine {
    private stage;
    private accumulatorState;
    private enteredAt;
    private transitionReason;
    private lastAction;
    private config;
    private ringBuffer;
    private escalationTimeline;
    constructor(config?: Partial<EscalationConfig>);
    /**
     * Update the state machine with new risk data.
     * Called every CRE polling cycle.
     */
    update(composite: number, dimensions: ReadonlyArray<{
        label: string;
        value: number;
        weight: number;
    }>, now?: number): TransitionResult;
    /**
     * Report the result of a dispatched action back to the state machine.
     * Enables CONFIRM → INVALIDATE transition on failure.
     */
    reportActionResult(type: string, success: boolean, timestamp?: number): void;
    getState(): EscalationState;
    getStage(): Stage;
    private transitionTo;
    private deriveActionRequired;
}
//# sourceMappingURL=escalation-state-machine.d.ts.map