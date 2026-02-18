/**
 * CCIP — Global Risk State (Infrastructure Layer)
 *
 * Ultra-lightweight in-memory singleton that tracks the system-wide
 * operating mode. Toggled by the CCIP receiver when a critical
 * cross-chain risk signal arrives.
 *
 * Design constraints:
 *   - Zero dependencies
 *   - Synchronous reads/writes only
 *   - Single process scope (future: shared via Redis / KV for multi-instance)
 */

// ── Types ────────────────────────────────────────────────────────────

export type SystemMode = "normal" | "observe-only";

// ── State ────────────────────────────────────────────────────────────

let currentMode: SystemMode = "normal";

// ── Public API ───────────────────────────────────────────────────────

/**
 * Switch the system to observe-only mode.
 * All risk actions should be demoted to logging only.
 */
export function activateObserveOnlyMode(): void {
  currentMode = "observe-only";
  console.info("[global-risk-state] Mode changed → observe-only");
}

/**
 * Restore normal operating mode.
 */
export function restoreNormalMode(): void {
  currentMode = "normal";
  console.info("[global-risk-state] Mode changed → normal");
}

/**
 * Read the current system operating mode. Synchronous, zero-cost.
 */
export function getSystemMode(): SystemMode {
  return currentMode;
}
