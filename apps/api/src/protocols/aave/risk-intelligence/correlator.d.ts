/**
 * Risk-Intelligence — Signal Correlator
 *
 * Bounded context: Aave / Risk Intelligence
 *
 * Correlates multiple risk signals (health-factor pressure, liquidation
 * proximity, market-wide stress) into a single correlated risk assessment.
 *
 * Design:
 *   - Pure functions, no I/O
 *   - Deterministic given the same inputs
 *   - Weights are tunable constants (move to config when going to prod)
 */
import type { AavePositionSnapshot, AaveChainMetrics } from "./signals.js";
/** Individual signal dimension used by the correlator. */
export interface SignalDimension {
    /** Human-readable label. */
    label: string;
    /** Normalised value 0..1 where 1 = maximum risk. */
    value: number;
    /** Weight applied during correlation. */
    weight: number;
}
/** Output of the correlation step. */
export interface CorrelatedRiskAssessment {
    /** Composite score 0..1. */
    compositeScore: number;
    /** Breakdown per dimension. */
    dimensions: SignalDimension[];
    /** Number of positions that contributed. */
    sampleSize: number;
    /** Chain this assessment belongs to. */
    chainId: string;
    timestamp: number;
}
/**
 * Correlate a set of position snapshots + chain metrics into a single
 * composite risk assessment.
 */
export declare function correlateSignals(chainId: string, positions: AavePositionSnapshot[], metrics: AaveChainMetrics): CorrelatedRiskAssessment;
//# sourceMappingURL=correlator.d.ts.map