/**
 * Phase 7 — optional testnet smoke: one `recordDelegationIntent` tx via PartnerDelegationAdapter.
 *
 * Requires: POS_DELEGATION_EXECUTION_MODE=testnet, RPC, router, operator key (see `.env.example`).
 * Usage: `pnpm exec tsx scripts/delegate-testnet-smoke.ts`
 */
import "dotenv/config";
import { loadConfig } from "../apps/api/src/config/index.js";
import { PartnerDelegationAdapter } from "../apps/api/src/protocols/pos/partner-delegation.adapter.js";

async function main(): Promise<void> {
  const cfg = loadConfig();
  if (cfg.posDelegationExecutionMode !== "testnet") {
    console.error(
      "Set POS_DELEGATION_EXECUTION_MODE=testnet and required RPC/router/key env vars."
    );
    process.exit(1);
  }

  const validatorRaw =
    process.env.SMOKE_DELEGATION_VALIDATOR?.trim() ||
    "0x0000000000000000000000000000000000000001";
  if (!/^0x[a-fA-F0-9]{40}$/.test(validatorRaw)) {
    console.error("SMOKE_DELEGATION_VALIDATOR must be a 20-byte 0x address.");
    process.exit(1);
  }

  const adapter = new PartnerDelegationAdapter({
    getConfig: loadConfig,
    mode: "testnet",
  });

  const result = await adapter.executePartnerDelegation({
    creChainId: "sepolia",
    normalizedAsset: "ETH",
    amountDecimal: process.env.SMOKE_DELEGATION_AMOUNT_WEI_ETH?.trim() || "0",
    validatorAddress: validatorRaw.toLowerCase() as `0x${string}`,
    partnerId: "smoke-script",
  });

  console.log(JSON.stringify(result.vaultTrace ?? result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
