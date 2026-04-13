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

import {
  updateAccumulator,
  meetsConvergence,
  createInitialAccumulatorState,
  type AccumulatorState,
  type AccumulatorConfig,
  DEFAULT_ACCUMULATOR_CONFIG,
} from "./risk-accumulator.js";
import type { CreEscalationStage } from "@aquarius/types";
import {
  AccumulatorRingBuffer,
  EscalationTimeline,
  deriveStability,
  type StageStability,
  type EscalationTimelineEvent,
} from "./escalation-telemetry.js";

export type { StageStability, EscalationTimelineEvent } from "./escalation-telemetry.js";

/** @deprecated Prefer importing {@link CreEscalationStage} from `@aquarius/types` in cross-domain code. */
export type Stage = CreEscalationStage;

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

export const DEFAULT_ESCALATION_CONFIG: EscalationConfig = {
  t1: 40,
  t2: 70,
  hysteresis: 0.7,
  actionWindowMs: 60_000,
  minConvergence: 2,
  accumulator: DEFAULT_ACCUMULATOR_CONFIG,
};

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

export class EscalationStateMachine {
  private stage: Stage = "info";
  private accumulatorState: AccumulatorState;
  private enteredAt: number;
  private transitionReason = "Initial state";
  private lastAction: LastAction | null = null;
  private config: EscalationConfig;
  private ringBuffer: AccumulatorRingBuffer;
  private escalationTimeline: EscalationTimeline;

  constructor(config?: Partial<EscalationConfig>) {
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
  update(
    composite: number,
    dimensions: ReadonlyArray<{ label: string; value: number; weight: number }>,
    now: number = Date.now(),
  ): TransitionResult {
    // Update accumulator (decay + accumulate)
    this.accumulatorState = updateAccumulator(
      this.accumulatorState,
      composite,
      dimensions,
      now,
      this.config.accumulator,
    );

    const acc = this.accumulatorState.value;
    const convergent = this.accumulatorState.convergentDimensions;
    const hasConvergence = meetsConvergence(this.accumulatorState, this.config.minConvergence);
    let transition: StageTransition | null = null;

    this.ringBuffer.record(now, acc);

    const prevStage = this.stage;

    switch (this.stage) {
      case "info":
        if (acc >= this.config.t1 && hasConvergence) {
          transition = this.transitionTo("confirm", now,
            `Accumulator ${acc.toFixed(1)} >= T1 (${this.config.t1}) with convergence: ${convergent.join(", ")}`);
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
        if (
          this.lastAction?.success &&
          acc < this.config.t1 * this.config.hysteresis
        ) {
          transition = this.transitionTo("info", now,
            `Action succeeded; accumulator ${acc.toFixed(1)} < de-escalation threshold (${(this.config.t1 * this.config.hysteresis).toFixed(1)})`);
        }
        break;

      case "invalidate":
        // De-escalate to CONFIRM if emergency action partially succeeded
        if (this.lastAction?.success && acc < this.config.t2 * this.config.hysteresis) {
          transition = this.transitionTo("confirm", now,
            `Emergency action succeeded; accumulator ${acc.toFixed(1)} < de-escalation threshold`);
        }

        // Full stabilization → INFO
        if (acc < this.config.t1 * 0.5) {
          transition = this.transitionTo("info", now,
            `Full stabilization; accumulator ${acc.toFixed(1)} < ${(this.config.t1 * 0.5).toFixed(1)}`);
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
  reportActionResult(type: string, success: boolean, timestamp: number = Date.now()): void {
    this.lastAction = { type, success, timestamp };
    this.escalationTimeline.append({
      type: success ? "ACTION_SUCCEEDED" : "ACTION_FAILED",
      timestamp,
      reason: `${type} ${success ? "succeeded" : "failed"}`,
    });
  }

  getState(): EscalationState {
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

  getStage(): Stage {
    return this.stage;
  }

  private transitionTo(newStage: Stage, now: number, reason: string): StageTransition {
    const from = this.stage;
    this.stage = newStage;
    this.enteredAt = now;
    this.transitionReason = reason;

    const stageLabel = newStage.toUpperCase() as "INFO" | "CONFIRM" | "INVALIDATE";
    this.escalationTimeline.append({
      type: `ENTER_${stageLabel}` as EscalationTimelineEvent["type"],
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

  private deriveActionRequired(): ActionRequired {
    switch (this.stage) {
      case "info": return "none";
      case "confirm": return "protect";
      case "invalidate": return "escalate";
    }
  }
}
