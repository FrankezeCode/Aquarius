/**
 * Unit Tests — aqAsset + CollateralAsset + VaultService
 *
 * Covers:
 *   - aqAsset minting correctness and invariant validation
 *   - aqAsset burn (withdrawal) via VaultService
 *   - Balance and yield accrual checks
 *   - CollateralAsset creation and yield harvesting
 *   - RiskMitigationStrategy resolution
 *   - VaultService deposit → withdraw round-trip
 *   - VaultService risk mitigation trigger
 *   - Edge cases: zero amounts, negative amounts, missing fields
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  mintAqAsset,
  accrueYield,
  redeemableValue,
  validateAqAsset,
  toAqSymbol,
  type AqAsset,
  type UnderlyingAsset,
} from "../../../../src/protocols/aave/vaults/domain/aq-asset.js";

import {
  createCollateralAsset,
  recordYield,
  harvestYield,
  validateCollateral,
} from "../../../../src/protocols/aave/vaults/domain/collateral-asset.js";

import {
  resolveStrategy,
  requiresMitigation,
  allStrategies,
} from "../../../../src/protocols/aave/vaults/domain/risk-mitigation-strategy.js";

import { VaultService } from "../../../../src/protocols/aave/vaults/application/services/vault.service.js";
import { InMemoryBufferVault } from "../../../../src/protocols/aave/vaults/infrastructure/buffer-vault.js";
import { StubStakingIntegration } from "../../../../src/protocols/aave/vaults/infrastructure/staking-integration.js";
import { StubCREMitigationAdapter } from "../../../../src/protocols/aave/vaults/infrastructure/cre-adapter.js";

import type { AceRiskLevel } from "../../../../src/protocols/aave/risk-intelligence/scorer.js";
import type { AaveRiskSnapshot } from "../../../../src/protocols/aave/domain/aave-risk-snapshot.js";

// ── Helpers ──────────────────────────────────────────────────────────

function makeSnapshot(riskLevel: AceRiskLevel): AaveRiskSnapshot {
  return {
    healthFactor: 1.5,
    debtRatio: 0.4,
    liquidityIndex: 0.02,
    volatilityScore: 0.3,
    riskLevel,
    timestamp: Date.now(),
  };
}

function createVaultService() {
  const bufferVault = new InMemoryBufferVault();
  const staking = new StubStakingIntegration();
  const mitigation = new StubCREMitigationAdapter();
  return {
    service: new VaultService(bufferVault, staking, mitigation),
    bufferVault,
  };
}

// ── aqAsset minting ──────────────────────────────────────────────────

describe("aqAsset / minting", () => {
  it("mints with correct fields", () => {
    const asset = mintAqAsset("aq1", "0xOwner", "ETH", 10, "vault-1");
    assert.equal(asset.id, "aq1");
    assert.equal(asset.owner, "0xOwner");
    assert.equal(asset.underlyingAsset, "ETH");
    assert.equal(asset.balance, 10);
    assert.equal(asset.accruedYield, 0);
    assert.equal(asset.linkedVault, "vault-1");
    assert.equal(typeof asset.lastUpdate, "number");
  });

  it("rejects zero amount", () => {
    assert.throws(
      () => mintAqAsset("aq2", "0xOwner", "ETH", 0, "vault-1"),
      /non-positive/
    );
  });

  it("rejects negative amount", () => {
    assert.throws(
      () => mintAqAsset("aq3", "0xOwner", "POL", -5, "vault-1"),
      /non-positive/
    );
  });

  it("rejects empty id", () => {
    assert.throws(
      () => mintAqAsset("", "0xOwner", "ETH", 10, "vault-1"),
      /required/
    );
  });

  it("rejects empty owner", () => {
    assert.throws(
      () => mintAqAsset("aq4", "", "ETH", 10, "vault-1"),
      /required/
    );
  });

  it("rejects empty linkedVault", () => {
    assert.throws(
      () => mintAqAsset("aq5", "0xOwner", "ETH", 10, ""),
      /required/
    );
  });
});

// ── aqAsset yield accrual ────────────────────────────────────────────

describe("aqAsset / yield", () => {
  it("accrues yield correctly", () => {
    const asset = mintAqAsset("aq1", "0xOwner", "WETH", 100, "vault-1");
    const updated = accrueYield(asset, 5);
    assert.equal(updated.accruedYield, 5);
    assert.equal(updated.balance, 100);
  });

  it("accumulates multiple yield accruals", () => {
    let asset = mintAqAsset("aq1", "0xOwner", "WETH", 100, "vault-1");
    asset = accrueYield(asset, 3);
    asset = accrueYield(asset, 7);
    assert.equal(asset.accruedYield, 10);
  });

  it("rejects negative yield", () => {
    const asset = mintAqAsset("aq1", "0xOwner", "WETH", 100, "vault-1");
    assert.throws(() => accrueYield(asset, -1), /negative/);
  });

  it("computes redeemable value = balance + yield", () => {
    let asset = mintAqAsset("aq1", "0xOwner", "ETH", 50, "vault-1");
    asset = accrueYield(asset, 2.5);
    assert.equal(redeemableValue(asset), 52.5);
  });
});

// ── aqAsset validation ───────────────────────────────────────────────

describe("aqAsset / validation", () => {
  it("passes for valid asset", () => {
    const asset = mintAqAsset("aq1", "0xOwner", "ETH", 10, "vault-1");
    assert.doesNotThrow(() => validateAqAsset(asset));
  });

  it("fails for negative balance", () => {
    const asset = mintAqAsset("aq1", "0xOwner", "ETH", 10, "vault-1");
    (asset as { balance: number }).balance = -1;
    assert.throws(() => validateAqAsset(asset), /negative/);
  });

  it("fails for negative accruedYield", () => {
    const asset = mintAqAsset("aq1", "0xOwner", "ETH", 10, "vault-1");
    (asset as { accruedYield: number }).accruedYield = -1;
    assert.throws(() => validateAqAsset(asset), /negative/);
  });
});

// ── aqAsset symbol mapping ───────────────────────────────────────────

describe("aqAsset / symbol", () => {
  const cases: [UnderlyingAsset, string][] = [
    ["ETH", "aqETH"],
    ["WETH", "aqWETH"],
    ["POL", "aqPOL"],
    ["USDC", "aqUSDC"],
    ["WBTC", "aqWBTC"],
  ];

  for (const [underlying, expected] of cases) {
    it(`${underlying} → ${expected}`, () => {
      assert.equal(toAqSymbol(underlying), expected);
    });
  }
});

// ── CollateralAsset ──────────────────────────────────────────────────

describe("CollateralAsset / creation", () => {
  it("creates with correct fields", () => {
    const col = createCollateralAsset("col1", "aq1", "ETH", "AAVE_ATOKEN", 10);
    assert.equal(col.id, "col1");
    assert.equal(col.linkedAqAssetId, "aq1");
    assert.equal(col.underlying, "ETH");
    assert.equal(col.source, "AAVE_ATOKEN");
    assert.equal(col.amount, 10);
    assert.equal(col.pendingYield, 0);
  });

  it("rejects zero amount", () => {
    assert.throws(
      () => createCollateralAsset("col2", "aq1", "ETH", "AAVE_ATOKEN", 0),
      /non-positive/
    );
  });

  it("rejects negative amount", () => {
    assert.throws(
      () => createCollateralAsset("col3", "aq1", "ETH", "AAVE_ATOKEN", -5),
      /non-positive/
    );
  });
});

describe("CollateralAsset / yield", () => {
  it("records yield correctly", () => {
    const col = createCollateralAsset("col1", "aq1", "ETH", "AAVE_ATOKEN", 10);
    const updated = recordYield(col, 0.5);
    assert.equal(updated.pendingYield, 0.5);
  });

  it("harvests pending yield and resets to 0", () => {
    let col = createCollateralAsset("col1", "aq1", "ETH", "AAVE_ATOKEN", 10);
    col = recordYield(col, 2.5);
    const { collateral, harvested } = harvestYield(col);
    assert.equal(harvested, 2.5);
    assert.equal(collateral.pendingYield, 0);
  });

  it("harvests zero when no pending yield", () => {
    const col = createCollateralAsset("col1", "aq1", "ETH", "AAVE_ATOKEN", 10);
    const { harvested } = harvestYield(col);
    assert.equal(harvested, 0);
  });

  it("rejects negative yield", () => {
    const col = createCollateralAsset("col1", "aq1", "ETH", "AAVE_ATOKEN", 10);
    assert.throws(() => recordYield(col, -1), /negative/);
  });
});

// ── RiskMitigationStrategy ───────────────────────────────────────────

describe("RiskMitigationStrategy / resolution", () => {
  const cases: [AceRiskLevel, string, boolean][] = [
    ["safe", "HOLD", false],
    ["watch", "INCREASE_BUFFER", false],
    ["early-warning", "PROTECT", true],
    ["critical", "EMERGENCY_EXIT", true],
  ];

  for (const [level, expectedAction, expectedConfidential] of cases) {
    it(`${level} → ${expectedAction} (confidential=${expectedConfidential})`, () => {
      const strategy = resolveStrategy(level);
      assert.equal(strategy.action, expectedAction);
      assert.equal(strategy.riskLevel, level);
      assert.equal(strategy.requiresConfidentiality, expectedConfidential);
      assert.equal(typeof strategy.description, "string");
    });
  }
});

describe("RiskMitigationStrategy / requiresMitigation", () => {
  it("safe → no mitigation", () => {
    assert.equal(requiresMitigation("safe"), false);
  });

  it("watch → mitigation required", () => {
    assert.equal(requiresMitigation("watch"), true);
  });

  it("early-warning → mitigation required", () => {
    assert.equal(requiresMitigation("early-warning"), true);
  });

  it("critical → mitigation required", () => {
    assert.equal(requiresMitigation("critical"), true);
  });
});

describe("RiskMitigationStrategy / allStrategies", () => {
  it("returns all 4 strategies", () => {
    const strategies = allStrategies();
    assert.equal(strategies.length, 4);
  });
});

// ── VaultService / deposit + withdraw ────────────────────────────────

describe("VaultService / deposit", () => {
  it("deposits and returns correct result", async () => {
    const { service } = createVaultService();
    const result = await service.deposit("0xOwner", "ETH", 10, "vault-1");

    assert.ok(result.aqAsset.id.startsWith("aq_"));
    assert.equal(result.aqAsset.owner, "0xOwner");
    assert.equal(result.aqAsset.underlyingAsset, "ETH");
    assert.equal(result.aqAsset.balance, 10);
    assert.equal(result.aqAsset.accruedYield, 0);
    assert.ok(result.collateralId.startsWith("col_"));
    assert.ok(result.txHash.startsWith("0xstub_deposit_"));
  });

  it("rejects zero amount deposit", async () => {
    const { service } = createVaultService();
    await assert.rejects(
      () => service.deposit("0xOwner", "ETH", 0, "vault-1"),
      /non-positive/
    );
  });
});

describe("VaultService / withdraw", () => {
  it("deposit then withdraw returns correct amounts", async () => {
    const { service } = createVaultService();
    const deposit = await service.deposit("0xOwner", "WETH", 25, "vault-1");
    const withdrawal = await service.withdraw(deposit.aqAsset.id);

    assert.equal(withdrawal.redeemedAmount, 25);
    assert.equal(typeof withdrawal.yieldAmount, "number");
    assert.ok(withdrawal.totalReturned >= 25);
    assert.ok(withdrawal.txHash.startsWith("0xstub_withdraw_"));
  });

  it("rejects withdrawal for non-existent aqAsset", async () => {
    const { service } = createVaultService();
    await assert.rejects(
      () => service.withdraw("non-existent-id"),
      /not found/
    );
  });
});

// ── VaultService / risk mitigation ───────────────────────────────────

describe("VaultService / evaluateAndMitigate", () => {
  it("HOLD for safe risk level (no trigger)", async () => {
    const { service } = createVaultService();
    const deposit = await service.deposit("0xOwner", "ETH", 10, "vault-1");
    const result = await service.evaluateAndMitigate(
      deposit.aqAsset.id,
      makeSnapshot("safe")
    );

    assert.equal(result.action, "HOLD");
    assert.equal(result.triggered, false);
    assert.equal(result.riskLevel, "safe");
  });

  it("triggers INCREASE_BUFFER for watch risk level", async () => {
    const { service } = createVaultService();
    const deposit = await service.deposit("0xOwner", "ETH", 10, "vault-1");
    const result = await service.evaluateAndMitigate(
      deposit.aqAsset.id,
      makeSnapshot("watch")
    );

    assert.equal(result.action, "INCREASE_BUFFER");
    assert.equal(result.triggered, true);
    assert.equal(result.riskLevel, "watch");
  });

  it("triggers PROTECT for early-warning risk level", async () => {
    const { service } = createVaultService();
    const deposit = await service.deposit("0xOwner", "ETH", 10, "vault-1");
    const result = await service.evaluateAndMitigate(
      deposit.aqAsset.id,
      makeSnapshot("early-warning")
    );

    assert.equal(result.action, "PROTECT");
    assert.equal(result.triggered, true);
    assert.equal(result.riskLevel, "early-warning");
  });

  it("triggers EMERGENCY_EXIT for critical risk level", async () => {
    const { service } = createVaultService();
    const deposit = await service.deposit("0xOwner", "ETH", 10, "vault-1");
    const result = await service.evaluateAndMitigate(
      deposit.aqAsset.id,
      makeSnapshot("critical")
    );

    assert.equal(result.action, "EMERGENCY_EXIT");
    assert.equal(result.triggered, true);
    assert.equal(result.riskLevel, "critical");
  });
});

// ── InMemoryBufferVault ──────────────────────────────────────────────

describe("InMemoryBufferVault", () => {
  it("stores and retrieves aqAsset", async () => {
    const vault = new InMemoryBufferVault();
    const aqAsset = mintAqAsset("aq1", "0xOwner", "ETH", 10, "vault-1");
    const collateral = createCollateralAsset(
      "col1", "aq1", "ETH", "AAVE_ATOKEN", 10
    );

    await vault.store(aqAsset, collateral);
    const retrieved = await vault.getAqAsset("aq1");
    assert.deepEqual(retrieved, aqAsset);
  });

  it("returns null for non-existent aqAsset", async () => {
    const vault = new InMemoryBufferVault();
    const result = await vault.getAqAsset("nonexistent");
    assert.equal(result, null);
  });

  it("removes aqAsset and collateral", async () => {
    const vault = new InMemoryBufferVault();
    const aqAsset = mintAqAsset("aq1", "0xOwner", "ETH", 10, "vault-1");
    const collateral = createCollateralAsset(
      "col1", "aq1", "ETH", "AAVE_ATOKEN", 10
    );

    await vault.store(aqAsset, collateral);
    await vault.remove("aq1");

    assert.equal(await vault.getAqAsset("aq1"), null);
    assert.equal(await vault.getCollateral("aq1"), null);
  });

  it("lists aqAssets by owner", async () => {
    const vault = new InMemoryBufferVault();
    const aq1 = mintAqAsset("aq1", "0xAlice", "ETH", 10, "vault-1");
    const col1 = createCollateralAsset("col1", "aq1", "ETH", "AAVE_ATOKEN", 10);
    const aq2 = mintAqAsset("aq2", "0xAlice", "WETH", 20, "vault-1");
    const col2 = createCollateralAsset("col2", "aq2", "WETH", "AAVE_ATOKEN", 20);
    const aq3 = mintAqAsset("aq3", "0xBob", "POL", 5, "vault-1");
    const col3 = createCollateralAsset("col3", "aq3", "POL", "AAVE_ATOKEN", 5);

    await vault.store(aq1, col1);
    await vault.store(aq2, col2);
    await vault.store(aq3, col3);

    const aliceAssets = await vault.listByOwner("0xAlice");
    assert.equal(aliceAssets.length, 2);

    const bobAssets = await vault.listByOwner("0xBob");
    assert.equal(bobAssets.length, 1);
  });

  it("rejects duplicate store", async () => {
    const vault = new InMemoryBufferVault();
    const aqAsset = mintAqAsset("aq1", "0xOwner", "ETH", 10, "vault-1");
    const collateral = createCollateralAsset(
      "col1", "aq1", "ETH", "AAVE_ATOKEN", 10
    );

    await vault.store(aqAsset, collateral);
    await assert.rejects(
      () => vault.store(aqAsset, collateral),
      /already exists/
    );
  });
});
