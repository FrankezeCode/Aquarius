/**
 * Aave V3 — Domain Model Mapper (Infrastructure Only)
 *
 * Transforms ParsedAccountData from AaveContractReader
 * into the domain PositionSnapshot model.
 *
 * This is the ONLY translation layer between Aave contract
 * structures and the domain. Domain never sees ParsedAccountData.
 */

import type { PositionSnapshot } from "../../domain/models/PositionSnapshot.js";
import type { ParsedAccountData } from "./AaveContractReader.js";

export function toPositionSnapshot(
  data: ParsedAccountData,
  chainId: string
): PositionSnapshot {
  const hf = data.healthFactor;
  const liquidationProximity =
    hf > 0 && hf < 999
      ? Math.round(((hf - 1) / hf) * 10000) / 100
      : hf >= 999
        ? 100
        : 0;

  return {
    owner: data.user,
    chainId,
    protocol: "aave-v3",
    healthFactor: data.healthFactor,
    collateralUsd: data.totalCollateralUsd,
    debtUsd: data.totalDebtUsd,
    liquidationProximity,
    timestamp: Date.now(),
  };
}

export function toPositionSnapshots(
  data: ParsedAccountData[],
  chainId: string
): PositionSnapshot[] {
  return data.map((d) => toPositionSnapshot(d, chainId));
}
