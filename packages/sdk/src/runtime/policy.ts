/**
 * Selva Runtime — Risk Policy
 *
 * Declarative risk guardrails that evaluate an EvaluatableRisk
 * against caller-defined thresholds.
 *
 * The policy is protocol-agnostic — it only sees riskScore and
 * severity.  Protocol-specific fields are invisible here.
 *
 * Usage:
 * ```ts
 * const policy = new RiskPolicy({ maxRiskScore: 60 });
 * policy.evaluate(risk); // throws if riskScore > 60
 * ```
 */

import type { EvaluatableRisk, RiskSeverity } from "./types.js";
import { SelvaPolicyViolation } from "./errors.js";

// ── Config ───────────────────────────────────────────────────────────

export interface RiskPolicyConfig {
  /** Max allowed riskScore (0–100).  Exceeding throws. */
  maxRiskScore?: number;
  /** Block if severity is at or above this level. */
  blockSeverity?: RiskSeverity;
}

/** Severity ordering for comparison. */
const SEVERITY_RANK: Record<RiskSeverity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

// ── Policy ───────────────────────────────────────────────────────────

export class RiskPolicy {
  private readonly config: RiskPolicyConfig;

  constructor(config: RiskPolicyConfig) {
    this.config = config;
  }

  /**
   * Evaluate risk against configured thresholds.
   * Throws SelvaPolicyViolation if any limit is exceeded.
   * Pure function — no side effects.
   */
  evaluate(risk: EvaluatableRisk): void {
    if (
      this.config.maxRiskScore !== undefined &&
      risk.riskScore > this.config.maxRiskScore
    ) {
      throw new SelvaPolicyViolation(
        `Risk score ${risk.riskScore} exceeds allowed max ${this.config.maxRiskScore}`
      );
    }

    if (this.config.blockSeverity !== undefined) {
      const threshold = SEVERITY_RANK[this.config.blockSeverity];
      const actual = SEVERITY_RANK[risk.severity];
      if (actual >= threshold) {
        throw new SelvaPolicyViolation(
          `Severity "${risk.severity}" meets or exceeds block threshold "${this.config.blockSeverity}"`
        );
      }
    }
  }
}
