/**
 * Escalation Telemetry — Observational Layer
 *
 * Bounded context: Aave / Risk Intelligence
 *
 * Provides three additive, non-invasive telemetry features on top
 * of the deterministic escalation state machine:
 *
 *   1. AccumulatorRingBuffer — rolling window of accumulator snapshots
 *   2. deriveStability — pure function mapping velocity to stability label
 *   3. EscalationTimeline — append-only audit log of escalation events
 *
 * Design constraints:
 *   - Read-only telemetry. Never influences state transitions.
 *   - Memory-bounded (ring buffer: 60 entries, timeline: 20 entries).
 *   - No infrastructure imports. Pure domain logic.
 */
export type StageStability = "stable" | "transitioning" | "escalating";
export interface EscalationTimelineEvent {
    type: "ENTER_INFO" | "ENTER_CONFIRM" | "ENTER_INVALIDATE" | "ACTION_ATTEMPTED" | "ACTION_SUCCEEDED" | "ACTION_FAILED";
    timestamp: number;
    reason: string;
}
export declare class AccumulatorRingBuffer {
    private buffer;
    private head;
    private count;
    constructor();
    record(timestamp: number, accumulator: number): void;
    /**
     * Compute velocity: delta accumulator over the given time window.
     * Returns accumulator_now - accumulator_at(now - windowMs).
     */
    getVelocity(windowMs?: number): number;
    private getEntry;
}
/**
 * Derive stage stability from accumulator velocity.
 * Pure function — no state mutation.
 *
 * velocity < 2.0/min  → stable
 * velocity < 8.0/min  → transitioning
 * velocity >= 8.0/min → escalating
 */
export declare function deriveStability(velocity: number): StageStability;
export declare class EscalationTimeline {
    private events;
    append(event: EscalationTimelineEvent): void;
    getEvents(): EscalationTimelineEvent[];
}
//# sourceMappingURL=escalation-telemetry.d.ts.map