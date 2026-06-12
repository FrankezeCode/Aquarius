import {
  createMarketDataProvider,
  resolveDataProviderMode,
  type DataProviderMode,
} from "../../adapters/providerFactory.js";
import type { PositionSnapshot } from "../../domain/models/PositionSnapshot.js";
import {
  AaveContractReader,
  type ParsedAccountData,
} from "../../infrastructure/aave/AaveContractReader.js";
import {
  resolveOnchainRpcUrl,
  resolveTenderlyRpcUrl,
} from "../../infrastructure/aave/chain-rpc.js";

const DEFAULT_CHAIN = "ethereum";
const DEFAULT_SNAPSHOT_LIMIT = 50;

function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

function computeLiquidationProximity(healthFactor: number): number {
  if (!Number.isFinite(healthFactor) || healthFactor <= 1) return 0;
  return Math.round(((healthFactor - 1) / healthFactor) * 10000) / 100;
}

export function resolveRpcUrlForMode(
  mode: DataProviderMode,
  chainId: string = DEFAULT_CHAIN
): string | null {
  if (mode === "tenderly") return resolveTenderlyRpcUrl(chainId);
  if (mode === "onchain") return resolveOnchainRpcUrl(chainId);
  return null;
}

export function getActiveDataMode(): DataProviderMode {
  return resolveDataProviderMode();
}

export function getActiveRpcUrl(chainId: string = DEFAULT_CHAIN): string | null {
  return resolveRpcUrlForMode(getActiveDataMode(), chainId);
}

export async function fetchUserAccountData(
  user: string,
  chainId: string = DEFAULT_CHAIN
): Promise<ParsedAccountData | null> {
  const rpcUrl = getActiveRpcUrl(chainId);
  if (!rpcUrl) return null;

  const reader = new AaveContractReader(rpcUrl, chainId);
  const raw = await reader.getUserAccountData(user);
  const parsed = reader.parseAccountData(raw);
  return parsed.totalCollateralUsd <= 0 && parsed.totalDebtUsd <= 0
    ? null
    : parsed;
}

export async function fetchAaveSnapshots(
  chainId: string = DEFAULT_CHAIN,
  limit: number = DEFAULT_SNAPSHOT_LIMIT,
): Promise<PositionSnapshot[]> {
  const mode = getActiveDataMode();
  console.info(
    `[health-engine] provider=${mode} fetch snapshots chain=${chainId} limit=${limit}`
  );
  const provider = createMarketDataProvider();
  return provider.fetchPositionSnapshots(chainId, limit);
}

/**
 * Resolve a user position from provider snapshots first, then
 * via direct account read (Tenderly/onchain RPC) when needed.
 */
export async function fetchUserSnapshot(
  user: string,
  chainId: string = DEFAULT_CHAIN,
): Promise<PositionSnapshot | null> {
  const normalizedUser = normalizeAddress(user);
  const provider = createMarketDataProvider();
  const mode = getActiveDataMode();
  console.info(
    `[health-engine] provider=${mode} resolve user snapshot chain=${chainId} user=${user}`
  );

  const snapshots = await provider.fetchPositionSnapshots(chainId, 200);
  const found = snapshots.find((p) => normalizeAddress(p.owner) === normalizedUser);
  if (found) return found;

  if (mode === "tenderly" || mode === "onchain") {
    console.warn(
      `[health-engine] user ${user} not found in provider snapshot batch; falling back to direct account read`
    );
  }

  const parsed = await fetchUserAccountData(user, chainId);
  if (!parsed) return null;

  return {
    owner: parsed.user,
    chainId,
    protocol: "aave",
    healthFactor: parsed.healthFactor,
    collateralUsd: parsed.totalCollateralUsd,
    debtUsd: parsed.totalDebtUsd,
    liquidationProximity: computeLiquidationProximity(parsed.healthFactor),
    timestamp: Date.now(),
  };
}
