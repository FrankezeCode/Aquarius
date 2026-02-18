/**
 * Selva Runtime — Error Types
 *
 * Typed errors for guardrail enforcement.
 * Consumers can catch these by class to distinguish policy
 * violations from cooldown blocks.
 */

/**
 * Thrown when a risk policy threshold is exceeded.
 * The snapshot was fetched successfully but the current risk
 * state violates the caller's configured limits.
 */
export class SelvaPolicyViolation extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SelvaPolicyViolation";
  }
}

/**
 * Thrown when execution is blocked by the cooldown limiter.
 * The caller is invoking too frequently — back off and retry
 * after the cooldown window expires.
 */
export class SelvaExecutionBlocked extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SelvaExecutionBlocked";
  }
}
