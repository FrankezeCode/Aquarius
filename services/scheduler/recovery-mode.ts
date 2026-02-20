/**
 * Scheduler — Recovery Mode
 *
 * Manages system recovery after circuit breaker opens.
 * When the circuit moves to HALF_OPEN, this module
 * coordinates the recovery process:
 *
 *   1. Verify WSS connectivity
 *   2. Verify oracle freshness
 *   3. Verify position graph consistency
 *   4. Gradually restore execution capabilities
 *
 * Recovery is conservative — prefer staying in observe-only
 * over a premature return to full execution.
 */

export type RecoveryPhase = "not_recovering" | "verifying" | "warming" | "restored";

export interface RecoveryStatus {
  phase: RecoveryPhase;
  wssHealthy: boolean;
  oracleHealthy: boolean;
  graphHealthy: boolean;
  startedAt: number | null;
  completedAt: number | null;
}

export class RecoveryManager {
  private status: RecoveryStatus = {
    phase: "not_recovering",
    wssHealthy: false,
    oracleHealthy: false,
    graphHealthy: false,
    startedAt: null,
    completedAt: null,
  };

  /**
   * Begin recovery process.
   */
  startRecovery(): void {
    this.status = {
      phase: "verifying",
      wssHealthy: false,
      oracleHealthy: false,
      graphHealthy: false,
      startedAt: Date.now(),
      completedAt: null,
    };
    console.info("[recovery] Recovery started — verifying subsystems");
  }

  /**
   * Report subsystem health.
   * When all subsystems healthy, transitions to warming.
   */
  reportHealth(subsystem: "wss" | "oracle" | "graph", healthy: boolean): void {
    switch (subsystem) {
      case "wss":
        this.status.wssHealthy = healthy;
        break;
      case "oracle":
        this.status.oracleHealthy = healthy;
        break;
      case "graph":
        this.status.graphHealthy = healthy;
        break;
    }

    if (this.status.phase === "verifying" && this.allHealthy()) {
      this.status.phase = "warming";
      console.info("[recovery] All subsystems healthy — warming up");
    }
  }

  /**
   * Confirm recovery is complete and system can return to normal.
   * Called after a warm-up period in HALF_OPEN state.
   */
  confirmRecovery(): boolean {
    if (!this.allHealthy()) {
      console.warn("[recovery] Cannot confirm — subsystems not all healthy");
      return false;
    }

    this.status.phase = "restored";
    this.status.completedAt = Date.now();
    console.info("[recovery] Recovery complete — system restored");
    return true;
  }

  /**
   * Abort recovery (circuit breaker re-opened).
   */
  abort(): void {
    this.status.phase = "not_recovering";
    console.warn("[recovery] Recovery aborted — returning to observe-only");
  }

  getStatus(): RecoveryStatus {
    return { ...this.status };
  }

  private allHealthy(): boolean {
    return (
      this.status.wssHealthy &&
      this.status.oracleHealthy &&
      this.status.graphHealthy
    );
  }
}
