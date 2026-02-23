/**
 * Health Engine — Mock Risk Inputs
 *
 * Deterministic mock data for protocols and users.
 * Used when live on-chain data is unavailable (demo / judging mode).
 */

import type { RiskInputs } from "@aquarius/types";

// ── Protocol Mocks ──────────────────────────────────────────────────

export const MOCK_PROTOCOL_RISKS: Record<string, RiskInputs> = {
  aave: {
    volatility: 22,
    liquidityRisk: 18,
    liquidationRisk: 30,
    smartContractRisk: 8,
  },
  compound: {
    volatility: 28,
    liquidityRisk: 25,
    liquidationRisk: 22,
    smartContractRisk: 12,
  },
  uniswap: {
    volatility: 35,
    liquidityRisk: 15,
    liquidationRisk: 10,
    smartContractRisk: 10,
  },
};

// ── User Mocks ──────────────────────────────────────────────────────

export const MOCK_USER_POSITIONS: Record<string, {
  healthFactor: number;
  totalCollateralUsd: number;
  totalDebtUsd: number;
  largestCollateralShare: number;
  hasCorrelatedCollateral: boolean;
  hfSlope: number;
}> = {
  "0x742d35Cc6634C0532925a3b844Bc9e7595f3aB2d": {
    healthFactor: 1.82,
    totalCollateralUsd: 48_500,
    totalDebtUsd: 22_300,
    largestCollateralShare: 0.65,
    hasCorrelatedCollateral: false,
    hfSlope: -0.02,
  },
  "0x1234567890abcdef1234567890abcdef12345678": {
    healthFactor: 1.25,
    totalCollateralUsd: 15_000,
    totalDebtUsd: 10_800,
    largestCollateralShare: 0.85,
    hasCorrelatedCollateral: true,
    hfSlope: -0.15,
  },
  "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd": {
    healthFactor: 2.50,
    totalCollateralUsd: 120_000,
    totalDebtUsd: 35_000,
    largestCollateralShare: 0.4,
    hasCorrelatedCollateral: false,
    hfSlope: 0.05,
  },
};

/**
 * Get mock position data for a user, falling back to a moderate-risk default.
 */
export function getMockUserPosition(address: string) {
  return (
    MOCK_USER_POSITIONS[address] ?? {
      healthFactor: 1.65,
      totalCollateralUsd: 25_000,
      totalDebtUsd: 13_000,
      largestCollateralShare: 0.55,
      hasCorrelatedCollateral: false,
      hfSlope: -0.03,
    }
  );
}
