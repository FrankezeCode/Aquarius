import type {
  DelegationExecution,
  IntegrationMaturity,
  RoutingRecommendation,
  StrategyKind,
  VaultSleeve,
} from "./types.js";
import { normalizeVaultAsset, normalizeVaultChain } from "./chain-normalize.js";
import { loadConfig } from "../../config/index.js";

const DISCLAIMER =
  "Advisory routing only. Availability, APY, lockups, and slashing depend on on-chain contracts and governance. Not financial advice.";

const KNOWN_EVM_CHAINS = new Set([
  "ethereum",
  "polygon",
  "arbitrum",
  "sepolia",
]);

function delegationFlagForChain(chain: string): DelegationExecution {
  const cfg = loadConfig();
  if (chain === "og_chain") return "unavailable";
  if (cfg.posDelegationEnabledChains.has(chain)) return "live_staged";
  return "advisory";
}

function sleeveBlock(
  chain: string,
  sleeve: VaultSleeve,
  kinds: StrategyKind[],
  maturity: IntegrationMaturity,
  notes: string
) {
  const hasDelegation = kinds.includes("native_validator_delegation");
  return {
    sleeve,
    strategyKinds: kinds,
    maturity,
    notes,
    ...(hasDelegation
      ? { delegationExecution: delegationFlagForChain(chain) }
      : {}),
  };
}

/**
 * Resolve where capital *would* be steered by product policy (no I/O).
 * Used for UX and agent planning; on-chain vaults enforce real allowlists.
 */
export function resolveVaultRouting(
  chainRaw: string,
  assetRaw: string
): RoutingRecommendation {
  const chain = normalizeVaultChain(chainRaw);
  const asset = normalizeVaultAsset(assetRaw);

  if (!asset || asset.length > 32) {
    throw new Error("Invalid asset symbol");
  }

  if (chain === "og_chain") {
    return {
      chain,
      asset,
      sleeves: [
        sleeveBlock(
          chain,
          "buffer_insurance",
          ["native_validator_delegation"],
          "advisory_schema_only",
          "Buffer sleeve on 0G: policy-gated liquidity; delegation subject to unbonding and slashing risk."
        ),
        sleeveBlock(
          chain,
          "yield_seeker",
          ["native_validator_delegation", "protocol_incentives"],
          "advisory_schema_only",
          "Yield sleeve: 0G delegation / emissions per network parameters; bridge and FX risk if assets are not native 0G."
        ),
      ],
      disclaimer: DISCLAIMER,
    };
  }

  if (!KNOWN_EVM_CHAINS.has(chain)) {
    throw new Error(`Unsupported chain "${chainRaw}"`);
  }

  const stable = asset === "USDC" || asset === "USDT" || asset === "DAI";
  const ethLike = asset === "WETH" || asset === "ETH";

  if (stable) {
    return {
      chain,
      asset,
      sleeves: [
        sleeveBlock(
          chain,
          "buffer_insurance",
          ["lending_market"],
          "demo_simulation",
          "Buffer sleeve: stable lending venues (e.g. Aave-class) with conservative caps in production vaults."
        ),
        sleeveBlock(
          chain,
          "yield_seeker",
          ["lending_market", "amm_liquidity", "protocol_incentives"],
          chain === "ethereum" ? "production_integrated" : "demo_simulation",
          "Yield sleeve: lending + optional LP/incentives; IL and protocol risk increase vs pure lending."
        ),
      ],
      disclaimer: DISCLAIMER,
    };
  }

  if (ethLike) {
    return {
      chain,
      asset,
      sleeves: [
        sleeveBlock(
          chain,
          "buffer_insurance",
          ["lending_market", "liquid_staking_token"],
          "demo_simulation",
          "Buffer sleeve: prefer liquid staking / lending with liquidity and depeg monitoring."
        ),
        sleeveBlock(
          chain,
          "yield_seeker",
          [
            "liquid_staking_token",
            "lending_market",
            "native_validator_delegation",
            "protocol_incentives",
          ],
          "demo_simulation",
          "Yield sleeve: LST and delegation paths carry slashing and bridge/L2 risk where applicable."
        ),
      ],
      disclaimer: DISCLAIMER,
    };
  }

  return {
    chain,
    asset,
    sleeves: [
      sleeveBlock(
        chain,
        "buffer_insurance",
        ["lending_market"],
        "demo_simulation",
        "Generic buffer: prefer audited lending or stable strategies until asset-specific risk review."
      ),
      sleeveBlock(
        chain,
        "yield_seeker",
        ["lending_market", "amm_liquidity", "protocol_incentives"],
        "advisory_schema_only",
        "Generic yield: requires explicit allowlist per asset before production execution."
      ),
    ],
    disclaimer: DISCLAIMER,
  };
}
