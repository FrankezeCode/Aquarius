/**
 * Scheduler — Circuit Breaker
 *
 * Monitors system health and triggers mode transitions
 * when anomalies are detected.
 *
 * States:
 *   CLOSED   → normal operation
 *   OPEN     → observe-only (anomalies detected)
 *   HALF_OPEN → recovering (checking if anomalies cleared)
 *
 * Transitions are logged for audit.
 * Non-blocking — check runs on a timer.
 */

import type { AnomalyCheckInput, AnomalyResult } from "./anomaly-check.js";
import { checkAnomalies } from "./anomaly-check.js";

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerConfig {
  checkIntervalMs: number;
  recoveryCheckMs: number;
  maxConsecutiveAnomalies: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  checkIntervalMs: 10_000,
  recoveryCheckMs: 30_000,
  maxConsecutiveAnomalies: 3,
};

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private consecutiveAnomalies = 0;
  private config: CircuitBreakerConfig;
  private timer: ReturnType<typeof setInterval> | null = null;
  private onStateChange: ((state: CircuitState) => void) | null = null;
  private inputProvider: (() => AnomalyCheckInput) | null = null;
  private lastResult: AnomalyResult | null = null;

  constructor(config?: Partial<CircuitBreakerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Set the callback that fires when state changes.
   * Used to toggle global risk state (observe-only mode).
   */
  setStateChangeHandler(handler: (state: CircuitState) => void): void {
    this.onStateChange = handler;
  }

  /**
   * Set the provider function that returns current system metrics.
   */
  setInputProvider(provider: () => AnomalyCheckInput): void {
    this.inputProvider = provider;
  }

  /**
   * Start periodic anomaly checking.
   */
  start(): void {
    if (this.timer) return;

    this.timer = setInterval(() => {
      this.check();
    }, this.config.checkIntervalMs);

    console.info(
      `[circuit-breaker] Started (interval=${this.config.checkIntervalMs}ms)`
    );
  }

  /**
   * Stop the circuit breaker.
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Run a single anomaly check cycle.
   */
  check(): CircuitState {
    if (!this.inputProvider) return this.state;

    const input = this.inputProvider();
    const result = checkAnomalies(input);
    this.lastResult = result;

    switch (this.state) {
      case "CLOSED":
        if (result.severity === "critical") {
          this.consecutiveAnomalies++;
          if (this.consecutiveAnomalies >= this.config.maxConsecutiveAnomalies) {
            this.transition("OPEN");
          }
        } else {
          this.consecutiveAnomalies = 0;
        }
        break;

      case "OPEN":
        // Stay open until recovery check interval passes
        if (!result.isAnomaly) {
          this.transition("HALF_OPEN");
        }
        break;

      case "HALF_OPEN":
        if (result.isAnomaly) {
          this.transition("OPEN");
        } else {
          this.consecutiveAnomalies = 0;
          this.transition("CLOSED");
        }
        break;
    }

    return this.state;
  }

  private transition(newState: CircuitState): void {
    if (this.state === newState) return;

    console.info(`[circuit-breaker] ${this.state} → ${newState}`);
    this.state = newState;
    this.onStateChange?.(newState);
  }

  getState(): CircuitState {
    return this.state;
  }

  getLastResult(): AnomalyResult | null {
    return this.lastResult;
  }
}
