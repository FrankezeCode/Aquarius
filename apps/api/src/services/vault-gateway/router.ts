import type { IntegrationMaturity, RoutingRecommendation, StrategyKind, VaultSleeve } from "./types.js";

const DISCLAIMER =
  "Advisory routing only. Availability, APY, lockups, and slashing depend on on-chain contracts and governance. Not financial advice.";

const KNOWN_EVM_CHAINS = new Set(["ethereum", "polygon", "arbitrum"]);
const OG_ALIASES = new Set(["0g", "og", "galileo", "og_chain", "zerog"]);

function normalizeChain(raw: string): string {
  const c = raw.trim().toLowerCase();
  if (OG_ALIASES.has(c)) return "og_chain";
  return c;
}

function normalizeAsset(raw: string): string {
  return raw.trim().toUpperCase();
}

function sleeveBlock(
  sleeve: VaultSleeve,
  kinds: StrategyKind[],
  maturity: IntegrationMaturity,
  notes: string
) {
  return { sleeve, strategyKinds: kinds, maturity, notes };
}

/**
 * Resolve where capital *would* be steered by product policy (no I/O).
 * Used for UX and agent planning; on-chain vaults enforce real allowlists.
 */
export function resolveVaultRouting(
  chainRaw: string,
  assetRaw: string
): RoutingRecommendation {
  const chain = normalizeChain(chainRaw);
  const asset = normalizeAsset(assetRaw);

  if (!asset || asset.length > 32) {
    throw new Error("Invalid asset symbol");
  }

  if (chain === "og_chain") {
    return {
      chain,
      asset,
      sleeves: [
        sleeveBlock(
          "buffer_insurance",
          ["native_validator_delegation"],
          "advisory_schema_only",
          "Buffer sleeve on 0G: policy-gated liquidity; delegation subject to unbonding and slashing risk."
        ),
        sleeveBlock(
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
          "buffer_insurance",
          ["lending_market"],
          "demo_simulation",
          "Buffer sleeve: stable lending venues (e.g. Aave-class) with conservative caps in production vaults."
        ),
        sleeveBlock(
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
          "buffer_insurance",
          ["lending_market", "liquid_staking_token"],
          "demo_simulation",
          "Buffer sleeve: prefer liquid staking / lending with liquidity and depeg monitoring."
        ),
        sleeveBlock(
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
        "buffer_insurance",
        ["lending_market"],
        "demo_simulation",
        "Generic buffer: prefer audited lending or stable strategies until asset-specific risk review."
      ),
      sleeveBlock(
        "yield_seeker",
        ["lending_market", "amm_liquidity", "protocol_incentives"],
        "advisory_schema_only",
        "Generic yield: requires explicit allowlist per asset before production execution."
      ),
    ],
    disclaimer: DISCLAIMER,
  };
}
