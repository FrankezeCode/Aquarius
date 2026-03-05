/**
 * Risk-Intelligence — Scorer (ACE Stack)
 *
 * Bounded context: Aave / Risk Intelligence
 *
 * Transforms a CorrelatedRiskAssessment into a discrete risk score
 * compatible with the Aquarius Classification Engine (ACE) taxonomy.
 *
 * Score bands:
 *   safe           0.00 – 0.25
 *   watch          0.25 – 0.50
 *   early-warning  0.50 – 0.75
 *   critical       0.75 – 1.00
 *
 * Design:
 *   - Pure function, no side-effects
 *   - Deterministic: same assessment → same score
 */
import type { CorrelatedRiskAssessment } from "./correlator.js";
/** ACE risk level — mirrors SDK AaveRiskLevel for cross-layer alignment. */
export type AceRiskLevel = "safe" | "watch" | "early-warning" | "critical";
/** Fully scored risk result ready for monitoring / API consumption. */
export interface RiskScore {
    /** Chain this score applies to. */
    chainId: string;
    /** Numeric composite score 0..1 (from correlator). */
    composite: number;
    /** Discrete classification. */
    level: AceRiskLevel;
    /** Human-readable summary for dashboards & alerts. */
    summary: string;
    /** The correlated dimensions that fed into this score. */
    dimensions: CorrelatedRiskAssessment["dimensions"];
    /** Positions sampled. */
    sampleSize: number;
    /** Unix ms. */
    timestamp: number;
}
/**
 * Score a correlated risk assessment using ACE classification bands.
 */
export declare function scoreRisk(assessment: CorrelatedRiskAssessment): RiskScore;
//# sourceMappingURL=scorer.d.ts.map