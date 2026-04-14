import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PartnerDelegationAdapter } from "../../src/protocols/pos/partner-delegation.adapter.js";
import type { Config } from "../../src/config/index.js";

function mockConfig(overrides: Partial<Config> = {}): Config {
  const base = {
    posDelegationExecutionMode: "mock" as const,
    posDelegationEnabledChains: new Set<string>(),
    posDelegationRpcUrl: "https://example.invalid",
    posDelegationChainId: 11_155_111,
    posDelegationRouterAddress: undefined,
    posDelegationOperatorPrivateKey: undefined,
  };
  return { ...base, ...overrides } as Config;
}

describe("PartnerDelegationAdapter", () => {
  it("mock mode returns synthetic tx hash and pos_delegate trace", async () => {
    const adapter = new PartnerDelegationAdapter({
      getConfig: () => mockConfig(),
      mode: "mock",
    });
    const r = await adapter.executePartnerDelegation({
      creChainId: "sepolia",
      normalizedAsset: "ETH",
      amountDecimal: "1.5",
      validatorAddress: "0x1111111111111111111111111111111111111111",
    });
    assert.equal(r.vaultTrace?.command, "pos_delegate");
    assert.equal(r.vaultTrace?.simulated, true);
    assert.ok(r.vaultTrace?.txHashes?.[0]?.startsWith("0xmock_delegate_"));
  });
});
