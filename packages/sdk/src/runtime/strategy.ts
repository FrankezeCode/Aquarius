/**
 * Selva Runtime — Strategy Engine
 *
 * Composes a RiskPolicy and an optional ExecutionLimiter into a
 * unified evaluation pipeline.  This is the core guardrail
 * primitive for all Selva automation.
 *
 * Two entry points:
 *
 *   evaluate(risk)          — Pure.  No I/O.  CRE / LLM can inject
 *                              a snapshot directly.
 *
 *   guard(key, fetcher)     — Convenience.  Calls fetcher(), then
 *                              evaluate().  Decouples fetch from eval
 *                              so runtime has ZERO HTTP dependency.
 *
 * The runtime NEVER imports protocol-specific types.
 * It only operates on EvaluatableRisk.
 */

import type { EvaluatableRisk } from "./types.js";
import { RiskPolicy } from "./policy.js";
import { ExecutionLimiter } from "./limiter.js";

export class SelvaStrategy {
  private readonly policy: RiskPolicy;
  private readonly limiter: ExecutionLimiter | undefined;

  constructor(policy: RiskPolicy, limiter?: ExecutionLimiter) {
    this.policy = policy;
    this.limiter = limiter;
  }

  // ── Pure evaluation (no I/O) ─────────────────────────────────────

  /**
   * Evaluate a risk against the strategy's guardrails.
   *
   * This is a pure function.  It performs:
   *   1. Risk policy threshold check
   *   2. Returns the risk unchanged if safe
   *
   * No cooldown is applied — cooldown requires a key and is
   * enforced in guard().
   *
   * @throws SelvaPolicyViolation if a risk threshold is exceeded
   */
  evaluate(risk: EvaluatableRisk): EvaluatableRisk {
    this.policy.evaluate(risk);
    return risk;
  }

  // ── Convenience: fetch + evaluate ────────────────────────────────

  /**
   * Guard an automation step by fetching risk and evaluating it.
   *
   * Flow:
   *   1. Check cooldown (if limiter provided)
   *   2. Call fetcher() to obtain EvaluatableRisk
   *   3. Evaluate risk against policy
   *   4. Return risk if safe
   *
   * The fetcher is caller-supplied — the runtime has ZERO knowledge
   * of HTTP, protocols, or data sources.
   *
   * @param key     Execution key for cooldown (e.g. "aave:1")
   * @param fetcher Async function that returns EvaluatableRisk
   * @throws SelvaExecutionBlocked if cooldown is active
   * @throws SelvaPolicyViolation if risk thresholds exceeded
   */
  async guard(
    key: string,
    fetcher: () => Promise<EvaluatableRisk>
  ): Promise<EvaluatableRisk> {
    // 1. Cooldown gate (async — store may be Redis, etc.)
    if (this.limiter) {
      await this.limiter.assertCanExecute(key);
    }

    // 2. Fetch risk (caller-supplied — we don't know how)
    const risk = await fetcher();

    // 3. Policy gate (pure)
    this.policy.evaluate(risk);

    // 4. Safe
    return risk;
  }
}
