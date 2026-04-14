/**
 * Optional: run with POS_DELEGATION_EXECUTION_MODE=testnet and full env — skipped by default in CI.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadConfig } from "../../src/config/index.js";
import { PartnerDelegationAdapter } from "../../src/protocols/pos/partner-delegation.adapter.js";

const shouldRun =
  process.env.POS_DELEGATION_INTEGRATION_TEST === "1" &&
  process.env.POS_DELEGATION_EXECUTION_MODE === "testnet" &&
  Boolean(process.env.POS_DELEGATION_ROUTER_ADDRESS?.trim()) &&
  Boolean(process.env.POS_DELEGATION_OPERATOR_PRIVATE_KEY?.trim());

describe("PartnerDelegationAdapter testnet (opt-in)", () => {
  it(
    "sends recordDelegationIntent when env is complete",
    { skip: !shouldRun },
    async () => {
      const v = process.env.SMOKE_DELEGATION_VALIDATOR?.trim();
      assert.ok(v && /^0x[a-fA-F0-9]{40}$/.test(v), "set SMOKE_DELEGATION_VALIDATOR");

      const adapter = new PartnerDelegationAdapter({
        getConfig: loadConfig,
        mode: "testnet",
      });
      const r = await adapter.executePartnerDelegation({
        creChainId: "sepolia",
        normalizedAsset: "ETH",
        amountDecimal: "0",
        validatorAddress: v!.toLowerCase() as `0x${string}`,
        partnerId: "integration-test",
      });
      assert.equal(r.vaultTrace?.simulated, false);
      assert.ok(r.vaultTrace?.txHashes?.[0]?.startsWith("0x"));
      assert.ok((r.vaultTrace?.txHashes?.[0]?.length ?? 0) > 10);
    }
  );
});
