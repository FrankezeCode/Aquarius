import { loadConfig } from "../../config/index.js";
import { normalizeVaultAsset, normalizeVaultChain } from "./chain-normalize.js";

/** Chains the CRE / Aave risk rail can execute against today (not advisory-only e.g. og_chain). */
const CRE_EXECUTABLE_CHAINS = new Set(["ethereum", "polygon", "arbitrum"]);

export type VaultExecutionEligibility =
  | {
      ok: true;
      /** Normalized chain id passed to `runCREWorkflow` / monitor (lowercase). */
      creChainId: string;
      normalizedAsset: string;
    }
  | {
      ok: false;
      reasonCode:
        | "CHAIN_NOT_EXECUTABLE"
        | "UNSUPPORTED_CHAIN"
        | "INVALID_ASSET"
        | "DELEGATION_NOT_ENABLED";
      message: string;
    };

/**
 * Pure policy check: vault-gateway execution must not invoke CRE for advisory-only chains.
 */
export function evaluateVaultExecutionEligibility(
  chainRaw: string,
  assetRaw: string
): VaultExecutionEligibility {
  const normalizedChain = normalizeVaultChain(chainRaw);
  const normalizedAsset = normalizeVaultAsset(assetRaw);

  if (!normalizedAsset || normalizedAsset.length > 32) {
    return {
      ok: false,
      reasonCode: "INVALID_ASSET",
      message: "Invalid asset symbol",
    };
  }

  if (normalizedChain === "og_chain") {
    return {
      ok: false,
      reasonCode: "CHAIN_NOT_EXECUTABLE",
      message:
        "Execution is not available for this chain via the CRE rail; advisory routing only.",
    };
  }

  if (!CRE_EXECUTABLE_CHAINS.has(normalizedChain)) {
    return {
      ok: false,
      reasonCode: "UNSUPPORTED_CHAIN",
      message: `Chain is not supported for execution: ${chainRaw}`,
    };
  }

  return {
    ok: true,
    creChainId: normalizedChain,
    normalizedAsset,
  };
}

/**
 * PoS / curated delegation — separate allowlist from generic CRE execution (`POS_DELEGATION_ENABLED_CHAINS`).
 */
export function evaluatePosDelegationEligibility(
  chainRaw: string,
  assetRaw: string
): VaultExecutionEligibility {
  const normalizedChain = normalizeVaultChain(chainRaw);
  const normalizedAsset = normalizeVaultAsset(assetRaw);
  const enabled = loadConfig().posDelegationEnabledChains;

  if (!normalizedAsset || normalizedAsset.length > 32) {
    return {
      ok: false,
      reasonCode: "INVALID_ASSET",
      message: "Invalid asset symbol",
    };
  }

  if (normalizedChain === "og_chain") {
    return {
      ok: false,
      reasonCode: "CHAIN_NOT_EXECUTABLE",
      message:
        "Native delegation for this logical chain is not executed via the EVM delegation rail.",
    };
  }

  if (!enabled.has(normalizedChain)) {
    return {
      ok: false,
      reasonCode: "DELEGATION_NOT_ENABLED",
      message: `PoS delegation is not enabled for chain "${chainRaw}" in this deployment.`,
    };
  }

  return {
    ok: true,
    creChainId: normalizedChain,
    normalizedAsset,
  };
}
