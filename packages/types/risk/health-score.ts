/**
 * Health Score — Shared Types
 *
 * Canonical types for the Aquarius Health Score system.
 * Used across backend services, API responses, SDK, and frontend.
 *
 * Two independent scores:
 *   - Protocol Health Score (e.g., Aave market-wide)
 *   - User Position Health Score (e.g., specific wallet on Aave)
 *
 * Score bands:
 *   80–100  →  STABLE     (green)
 *   50–79   →  WATCH      (yellow)
 *    0–49   →  HIGH_RISK   (red)
 */

// ── Category ────────────────────────────────────────────────────────

export type HealthCategory = "stable" | "watch" | "high_risk";

// ── Core Result ─────────────────────────────────────────────────────

export interface HealthScoreResult {
  /** Numeric score 0–100. Higher = healthier. */
  score: number;
  /** Discrete classification. */
  category: HealthCategory;
  /** AI-generated or deterministic explanation of the score. */
  reasoning: string;
}

// ── Risk Input Dimensions ───────────────────────────────────────────

export interface RiskInputs {
  /** Asset price volatility risk 0–100. */
  volatility: number;
  /** Liquidity depth / utilization risk 0–100. */
  liquidityRisk: number;
  /** Proximity to liquidation risk 0–100. */
  liquidationRisk: number;
  /** Smart contract / governance risk 0–100. */
  smartContractRisk: number;
}

// ── Protocol Health Score ───────────────────────────────────────────

export interface ProtocolHealthScore {
  /** Protocol identifier (e.g., "aave"). */
  protocol: string;
  /** Overall health score 0–100. */
  score: number;
  /** Discrete classification. */
  category: HealthCategory;
  /** Confidence in the score (0–1). */
  confidence: number;
  /** Per-dimension breakdown. */
  breakdown: HealthScoreBreakdown;
  /** Human-readable explanation. */
  reasoning: string;
  /** Detected market regime (from AI context layer). */
  regime?: MarketRegime;
  /** Primary risk vector identified by AI. */
  dominantRisk?: string;
  /** Score metadata. */
  metadata: HealthScoreMetadata;
}

export interface HealthScoreBreakdown {
  /** Liquidity health 0–100 (weight: 25%). */
  liquidity: number;
  /** Risk concentration 0–100 (weight: 25%). */
  riskConcentration: number;
  /** Liquidation risk 0–100 (weight: 30%). */
  liquidationRisk: number;
  /** Smart contract & governance stability 0–100 (weight: 20%). */
  smartContractRisk: number;
}

export interface HealthScoreMetadata {
  /** Block number at time of assessment. */
  block: number | null;
  /** ISO timestamp. */
  timestamp: string;
  /** Data sources used. */
  sources: string[];
}

// ── User Health Score ───────────────────────────────────────────────

export interface UserHealthScore {
  /** Wallet address. */
  user: string;
  /** Protocol this score applies to. */
  protocol: string;
  /** Overall health score 0–100. */
  score: number;
  /** Discrete classification. */
  category: HealthCategory;
  /** Confidence in the score (0–1). */
  confidence: number;
  /** Base score derived from health factor. */
  base: number;
  /** Penalties applied to the base. */
  penalties: UserHealthPenalties;
  /** Human-readable explanation. */
  reasoning: string;
  /** Detected market regime (from AI context layer). */
  regime?: MarketRegime;
  /** Primary risk vector identified by AI. */
  dominantRisk?: string;
  /** Score metadata. */
  metadata: HealthScoreMetadata;
}

export interface UserHealthPenalties {
  /** Penalty from asset volatility exposure. */
  volatility: number;
  /** Penalty from debt concentration. */
  concentration: number;
  /** Penalty from correlated collateral. */
  correlation: number;
}

// ── AI Context Layer (Layer 2) ──────────────────────────────────────

/** Market regime classification. */
export type MarketRegime = "normal" | "elevated" | "stressed";

/** Input to the AI Context Engine. */
export interface AIContextInput {
  /** Deterministic base score from Layer 1 (0–100). */
  baseScore: number;
  /** Liquidation risk 0–100. */
  liquidationRisk: number;
  /** Volatility risk 0–100. */
  volatilityRisk: number;
  /** Liquidity risk 0–100. */
  liquidityRisk: number;
  /** Systemic / smart contract risk 0–100. */
  systemicRisk: number;
  /** Optional stress simulation results. */
  stressSimulationResults?: string;
}

/** Validated output from the AI Context Engine. */
export interface AIContextResult {
  /** Adjusted score (within ±10 of baseScore, clamped 0–100). */
  score: number;
  /** Re-derived category from adjusted score. */
  category: HealthCategory;
  /** Detected market regime. */
  regime: MarketRegime;
  /** Primary risk vector identified by AI. */
  dominantRisk: string;
  /** AI confidence in the adjustment (0–1). */
  confidence: number;
  /** Concise explanation (max 25 words). */
  reasoning: string;
}
