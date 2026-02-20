/**
 * Execution Layer — Mitigation Registry
 *
 * Maps risk types to action templates for automated mitigation.
 * Registry-driven approach replaces hardcoded mitigation logic.
 *
 * Infrastructure layer only — domain emits MitigationIntent,
 * this registry helps determine HOW to execute it.
 */

import type { MitigationType } from "../../domain/events/MitigationIntent.js";

export interface ActionTemplate {
  type: MitigationType;
  asset: "collateral_primary" | "debt_primary" | "specific";
  specificAsset?: string;
  amountStrategy: "fixed" | "percentage" | "to_target_hf";
  amountValue: number;
  confidential: boolean;
  priority: number;
}

export type RiskType =
  | "PRE_LIQUIDATION"
  | "EXTREME_VOLATILITY"
  | "ORACLE_DIVERGENCE"
  | "SYSTEMIC_STRESS"
  | "POSITION_DECAY";

const REGISTRY: Record<RiskType, ActionTemplate[]> = {
  PRE_LIQUIDATION: [
    {
      type: "ADD_COLLATERAL",
      asset: "collateral_primary",
      amountStrategy: "to_target_hf",
      amountValue: 1.5,
      confidential: true,
      priority: 1,
    },
    {
      type: "REPAY_DEBT",
      asset: "debt_primary",
      amountStrategy: "percentage",
      amountValue: 25,
      confidential: true,
      priority: 2,
    },
  ],
  EXTREME_VOLATILITY: [
    {
      type: "ADD_COLLATERAL",
      asset: "collateral_primary",
      amountStrategy: "percentage",
      amountValue: 15,
      confidential: true,
      priority: 1,
    },
  ],
  ORACLE_DIVERGENCE: [
    {
      type: "ADD_COLLATERAL",
      asset: "collateral_primary",
      amountStrategy: "percentage",
      amountValue: 10,
      confidential: false,
      priority: 1,
    },
  ],
  SYSTEMIC_STRESS: [
    {
      type: "REPAY_DEBT",
      asset: "debt_primary",
      amountStrategy: "percentage",
      amountValue: 50,
      confidential: true,
      priority: 1,
    },
    {
      type: "EMERGENCY_EXIT",
      asset: "collateral_primary",
      amountStrategy: "percentage",
      amountValue: 100,
      confidential: true,
      priority: 2,
    },
  ],
  POSITION_DECAY: [
    {
      type: "ADD_COLLATERAL",
      asset: "collateral_primary",
      amountStrategy: "to_target_hf",
      amountValue: 2.0,
      confidential: false,
      priority: 1,
    },
  ],
};

/**
 * Resolve the action templates for a given risk type.
 * Returns templates sorted by priority (lower = higher priority).
 */
export function resolveTemplates(riskType: RiskType): ActionTemplate[] {
  const templates = REGISTRY[riskType];
  if (!templates) {
    console.warn(`[mitigation-registry] No templates for risk type: ${riskType}`);
    return [];
  }
  return [...templates].sort((a, b) => a.priority - b.priority);
}

/**
 * Classify a risk signal into a RiskType for registry lookup.
 */
export function classifyRiskType(
  hf: number,
  projectedHF: number,
  isAccelerating: boolean,
  liquidationProb: number
): RiskType {
  if (hf < 1.05 || projectedHF < 1.0) return "PRE_LIQUIDATION";
  if (liquidationProb > 0.7) return "EXTREME_VOLATILITY";
  if (isAccelerating && hf < 1.25) return "POSITION_DECAY";
  if (liquidationProb > 0.5) return "SYSTEMIC_STRESS";
  return "POSITION_DECAY";
}

/**
 * Get all registered risk types (for diagnostics).
 */
export function allRiskTypes(): RiskType[] {
  return Object.keys(REGISTRY) as RiskType[];
}
