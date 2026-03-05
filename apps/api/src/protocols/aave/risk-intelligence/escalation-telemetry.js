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
const RING_BUFFER_MAX = 60;
export class AccumulatorRingBuffer {
    buffer = [];
    head = 0;
    count = 0;
    constructor() {
        this.buffer = new Array(RING_BUFFER_MAX);
    }
    record(timestamp, accumulator) {
        this.buffer[this.head] = { timestamp, accumulator };
        this.head = (this.head + 1) % RING_BUFFER_MAX;
        if (this.count < RING_BUFFER_MAX)
            this.count++;
    }
    /**
     * Compute velocity: delta accumulator over the given time window.
     * Returns accumulator_now - accumulator_at(now - windowMs).
     */
    getVelocity(windowMs = 60_000) {
        if (this.count < 2)
            return 0;
        const latest = this.getEntry(this.count - 1);
        if (!latest)
            return 0;
        const cutoff = latest.timestamp - windowMs;
        let oldest = null;
        for (let i = 0; i < this.count; i++) {
            const entry = this.getEntry(i);
            if (entry && entry.timestamp <= cutoff) {
                oldest = entry;
            }
        }
        if (!oldest) {
            const first = this.getEntry(0);
            if (!first)
                return 0;
            oldest = first;
        }
        return Math.round((latest.accumulator - oldest.accumulator) * 100) / 100;
    }
    getEntry(index) {
        if (index < 0 || index >= this.count)
            return null;
        const actualIndex = (this.head - this.count + index + RING_BUFFER_MAX) % RING_BUFFER_MAX;
        return this.buffer[actualIndex] ?? null;
    }
}
// ── Stage Stability ──────────────────────────────────────────────────
const STABLE_THRESHOLD = 2.0;
const TRANSITIONING_THRESHOLD = 8.0;
/**
 * Derive stage stability from accumulator velocity.
 * Pure function — no state mutation.
 *
 * velocity < 2.0/min  → stable
 * velocity < 8.0/min  → transitioning
 * velocity >= 8.0/min → escalating
 */
export function deriveStability(velocity) {
    const absVelocity = Math.abs(velocity);
    if (absVelocity < STABLE_THRESHOLD)
        return "stable";
    if (absVelocity < TRANSITIONING_THRESHOLD)
        return "transitioning";
    return "escalating";
}
// ── Escalation Timeline ──────────────────────────────────────────────
const TIMELINE_MAX = 20;
export class EscalationTimeline {
    events = [];
    append(event) {
        this.events.push(event);
        if (this.events.length > TIMELINE_MAX) {
            this.events.shift();
        }
    }
    getEvents() {
        return [...this.events];
    }
}
