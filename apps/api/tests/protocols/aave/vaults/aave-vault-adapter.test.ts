/**
 * Protocol tests — AaveVaultAdapter (buffer + protect simulated paths)
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { VaultService } from "../../../../src/protocols/aave/vaults/application/services/vault.service.js";
import {
  AaveVaultAdapter,
  InMemoryBufferVault,
  StubCREMitigationAdapter,
  StubStakingIntegration,
} from "../../../../src/protocols/aave/vaults/infrastructure/index.js";

function makeAdapter(): AaveVaultAdapter {
  const buffer = new InMemoryBufferVault();
  const staking = new StubStakingIntegration();
  const mitigation = new StubCREMitigationAdapter();
  const vault = new VaultService(buffer, staking, mitigation);
  return new AaveVaultAdapter(vault);
}

describe("AaveVaultAdapter", () => {
  it("executeBufferTopUp mints trace with simulated tx hash", async () => {
    const adapter = makeAdapter();
    const result = await adapter.executeBufferTopUp({
      creChainId: "ethereum",
      normalizedAsset: "USDC",
      amountDecimal: "100",
      simulatedOwner: "0xtestowner000000000000000000000000000001",
    });
    assert.equal(result.vaultTrace?.command, "buffer_top_up");
    assert.equal(result.vaultTrace?.simulated, true);
    assert.ok(result.vaultTrace?.txHashes?.[0]?.startsWith("0xstub_deposit_"));
    assert.ok(result.actionDispatch.dispatched.includes("buffer.store"));
  });

  it("executeBufferTopUp rejects unsupported asset", async () => {
    const adapter = makeAdapter();
    await assert.rejects(
      () =>
        adapter.executeBufferTopUp({
          creChainId: "ethereum",
          normalizedAsset: "XYZ",
          amountDecimal: "1",
          simulatedOwner: "0xowner",
        }),
      /UNSUPPORTED_ASSET/
    );
  });

  it("executeProtectPath skips mitigation for safe risk level", async () => {
    const adapter = makeAdapter();
    const result = await adapter.executeProtectPath({
      creChainId: "ethereum",
      aqAssetId: "aq-missing-ok",
      riskLevel: "safe",
    });
    assert.equal(result.vaultTrace?.command, "vault_protect");
    assert.ok(result.vaultTrace?.steps?.includes("mitigation.skipped"));
  });

  it("executeProtectPath dispatches for early-warning level", async () => {
    const adapter = makeAdapter();
    const result = await adapter.executeProtectPath({
      creChainId: "polygon",
      aqAssetId: "aq-1",
      riskLevel: "early-warning",
    });
    assert.equal(result.vaultTrace?.command, "vault_protect");
    assert.ok(result.vaultTrace?.steps?.includes("vault.evaluateAndMitigate"));
  });
});
