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
import { updateAccumulator, meetsConvergence, createInitialAccumulatorState, DEFAULT_ACCUMULATOR_CONFIG, } from "./risk-accumulator.js";
import { AccumulatorRingBuffer, EscalationTimeline, deriveStability, } from "./escalation-telemetry.js";
export const DEFAULT_ESCALATION_CONFIG = {
    t1: 40,
    t2: 70,
    hysteresis: 0.7,
    actionWindowMs: 60_000,
    minConvergence: 2,
    accumulator: DEFAULT_ACCUMULATOR_CONFIG,
};
export class EscalationStateMachine {
    stage = "info";
    accumulatorState;
    enteredAt;
    transitionReason = "Initial state";
    lastAction = null;
    config;
    ringBuffer;
    escalationTimeline;
    constructor(config) {
        this.config = { ...DEFAULT_ESCALATION_CONFIG, ...config };
        this.accumulatorState = createInitialAccumulatorState();
        this.enteredAt = Date.now();
        this.ringBuffer = new AccumulatorRingBuffer();
        this.escalationTimeline = new EscalationTimeline();
    }
    /**
     * Update the state machine with new risk data.
     * Called every CRE polling cycle.
     */
    update(composite, dimensions, now = Date.now()) {
        // Update accumulator (decay + accumulate)
        this.accumulatorState = updateAccumulator(this.accumulatorState, composite, dimensions, now, this.config.accumulator);
        const acc = this.accumulatorState.value;
        const convergent = this.accumulatorState.convergentDimensions;
        const hasConvergence = meetsConvergence(this.accumulatorState, this.config.minConvergence);
        let transition = null;
        this.ringBuffer.record(now, acc);
        const prevStage = this.stage;
        switch (this.stage) {
            case "info":
                if (acc >= this.config.t1 && hasConvergence) {
                    transition = this.transitionTo("confirm", now, `Accumulator ${acc.toFixed(1)} >= T1 (${this.config.t1}) with convergence: ${convergent.join(", ")}`);
                }
                break;
            case "confirm":
                // Escalate to INVALIDATE if:
                //   accumulator >= T2 AND (no action taken within window OR action failed)
                if (acc >= this.config.t2) {
                    const actionExpired = this.lastAction === null ||
                        (now - this.lastAction.timestamp > this.config.actionWindowMs);
                    const actionFailed = this.lastAction !== null && !this.lastAction.success;
                    if (actionExpired || actionFailed) {
                        const reason = actionFailed
                            ? `Mitigation action failed; accumulator ${acc.toFixed(1)} >= T2 (${this.config.t2})`
                            : `No successful action within ${this.config.actionWindowMs / 1000}s window; accumulator ${acc.toFixed(1)} >= T2 (${this.config.t2})`;
                        transition = this.transitionTo("invalidate", now, reason);
                    }
                }
                // De-escalate to INFO if action succeeded and accumulator dropped
                if (this.lastAction?.success &&
                    acc < this.config.t1 * this.config.hysteresis) {
                    transition = this.transitionTo("info", now, `Action succeeded; accumulator ${acc.toFixed(1)} < de-escalation threshold (${(this.config.t1 * this.config.hysteresis).toFixed(1)})`);
                }
                break;
            case "invalidate":
                // De-escalate to CONFIRM if emergency action partially succeeded
                if (this.lastAction?.success && acc < this.config.t2 * this.config.hysteresis) {
                    transition = this.transitionTo("confirm", now, `Emergency action succeeded; accumulator ${acc.toFixed(1)} < de-escalation threshold`);
                }
                // Full stabilization → INFO
                if (acc < this.config.t1 * 0.5) {
                    transition = this.transitionTo("info", now, `Full stabilization; accumulator ${acc.toFixed(1)} < ${(this.config.t1 * 0.5).toFixed(1)}`);
                }
                break;
        }
        const actionRequired = this.deriveActionRequired();
        return {
            state: this.getState(),
            transition,
            actionRequired,
        };
    }
    /**
     * Report the result of a dispatched action back to the state machine.
     * Enables CONFIRM → INVALIDATE transition on failure.
     */
    reportActionResult(type, success, timestamp = Date.now()) {
        this.lastAction = { type, success, timestamp };
        this.escalationTimeline.append({
            type: success ? "ACTION_SUCCEEDED" : "ACTION_FAILED",
            timestamp,
            reason: `${type} ${success ? "succeeded" : "failed"}`,
        });
    }
    getState() {
        const velocity = this.ringBuffer.getVelocity();
        return {
            stage: this.stage,
            accumulator: this.accumulatorState.value,
            enteredAt: this.enteredAt,
            convergenceSignals: [...this.accumulatorState.convergentDimensions],
            transitionReason: this.transitionReason,
            lastAction: this.lastAction ? { ...this.lastAction } : null,
            velocity,
            stageStability: deriveStability(velocity),
            timeline: this.escalationTimeline.getEvents(),
        };
    }
    getStage() {
        return this.stage;
    }
    transitionTo(newStage, now, reason) {
        const from = this.stage;
        this.stage = newStage;
        this.enteredAt = now;
        this.transitionReason = reason;
        const stageLabel = newStage.toUpperCase();
        this.escalationTimeline.append({
            type: `ENTER_${stageLabel}`,
            timestamp: now,
            reason,
        });
        console.info(`[selva-fsm] ${from.toUpperCase()} → ${stageLabel} | ${reason}`);
        return {
            from,
            to: newStage,
            reason,
            timestamp: now,
            accumulatorValue: this.accumulatorState.value,
        };
    }
    deriveActionRequired() {
        switch (this.stage) {
            case "info": return "none";
            case "confirm": return "protect";
            case "invalidate": return "escalate";
        }
    }
}
