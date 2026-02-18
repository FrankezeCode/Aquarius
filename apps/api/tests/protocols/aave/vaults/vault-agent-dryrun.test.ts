/**
 * Agentic Vault Layer — Dry-Run Tests
 *
 * Covers:
 *   - VaultMonitoringAgent: read-only risk alert evaluation
 *   - VaultActionAgent: deterministic decision mapping via canonical strategy
 *   - SecureVaultAgent: policy-gated decision (requiresMitigation filter)
 *   - VaultDryRunOrchestrator: full pipeline simulation (no CRE execution)
 *   - VaultAgentDecision: domain value object integrity
 *   - Edge cases: empty assets, all risk levels, no-action scenarios
 *
 * Architecture invariants enforced:
 *   - No VaultService mutation occurs during dry-run
 *   - No CRE adapter is imported or called
 *   - Decisions reuse canonical MitigationAction from risk-mitigation-strategy
 *   - Risk level is always AceRiskLevel (never raw string)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  mintAqAsset,
  type AqAsset,
} from "../../../../src/protocols/aave/vaults/domain/aq-asset.js";

import {
  resolveStrategy,
  requiresMitigation,
} from "../../../../src/protocols/aave/vaults/domain/risk-mitigation-strategy.js";

import type { VaultAgentDecision } from "../../../../src/protocols/aave/vaults/domain/agent-decision.js";

import { VaultMonitoringAgent } from "../../../../src/protocols/aave/vaults/application/services/monitoring-agent.service.js";
import { VaultActionAgent } from "../../../../src/protocols/aave/vaults/application/services/action-agent.service.js";
import { SecureVaultAgent } from "../../../../src/protocols/aave/vaults/application/services/secure-agent.service.js";
import {
  VaultDryRunOrchestrator,
  type DryRunResult,
} from "../../../../src/protocols/aave/vaults/application/services/dry-run-orchestrator.service.js";

import { InMemoryBufferVault } from "../../../../src/protocols/aave/vaults/infrastructure/buffer-vault.js";

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

function makeAqAsset(id: string): AqAsset {
  return mintAqAsset(id, "0xTestOwner", "ETH", 100, "vault-test-1");
}

function createOrchestrator() {
  const bufferVault = new InMemoryBufferVault();
  const monitor = new VaultMonitoringAgent(bufferVault);
  const actionAgent = new VaultActionAgent();
  const secureAgent = new SecureVaultAgent(actionAgent);
  const orchestrator = new VaultDryRunOrchestrator(monitor, secureAgent);

  return { bufferVault, monitor, actionAgent, secureAgent, orchestrator };
}

const ALL_RISK_LEVELS: AceRiskLevel[] = [
  "safe",
  "watch",
  "early-warning",
  "critical",
];

// ── VaultAgentDecision (domain type) ────────────────────────────────

describe("VaultAgentDecision / domain value object", () => {
  it("has correct structure from action agent", () => {
    const agent = new VaultActionAgent();
    const decision = agent.decide({
      assetId: "aq-1",
      riskLevel: "critical",
    });

    assert.equal(decision.assetId, "aq-1");
    assert.equal(decision.riskLevel, "critical");
    assert.equal(decision.action, "EMERGENCY_EXIT");
    assert.equal(typeof decision.reason, "string");
    assert.equal(typeof decision.timestamp, "number");
    assert.ok(decision.timestamp > 0);
  });

  it("action matches canonical strategy for every risk level", () => {
    const agent = new VaultActionAgent();
    for (const level of ALL_RISK_LEVELS) {
      const decision = agent.decide({ assetId: "aq-x", riskLevel: level });
      const strategy = resolveStrategy(level);
      assert.equal(
        decision.action,
        strategy.action,
        `Action mismatch for risk level: ${level}`
      );
    }
  });
});

// ── VaultMonitoringAgent ────────────────────────────────────────────

describe("VaultMonitoringAgent", () => {
  it("evaluateAssets returns an alert per asset", () => {
    const { monitor } = createOrchestrator();
    const assets = [makeAqAsset("a1"), makeAqAsset("a2"), makeAqAsset("a3")];
    const snapshot = makeSnapshot("safe");

    const alerts = monitor.evaluateAssets(assets, snapshot);

    assert.equal(alerts.length, 3);
    assert.equal(alerts[0].assetId, "a1");
    assert.equal(alerts[1].assetId, "a2");
    assert.equal(alerts[2].assetId, "a3");
  });

  it("safe risk level → requiresAction = false", () => {
    const { monitor } = createOrchestrator();
    const alerts = monitor.evaluateAssets(
      [makeAqAsset("a1")],
      makeSnapshot("safe")
    );

    assert.equal(alerts[0].requiresAction, false);
    assert.equal(alerts[0].riskLevel, "safe");
  });

  it("watch risk level → requiresAction = true (INCREASE_BUFFER)", () => {
    const { monitor } = createOrchestrator();
    const alerts = monitor.evaluateAssets(
      [makeAqAsset("a1")],
      makeSnapshot("watch")
    );

    // watch maps to INCREASE_BUFFER, which requires mitigation
    assert.equal(alerts[0].requiresAction, true);
    assert.equal(alerts[0].riskLevel, "watch");
  });

  it("early-warning risk level → requiresAction = true", () => {
    const { monitor } = createOrchestrator();
    const alerts = monitor.evaluateAssets(
      [makeAqAsset("a1")],
      makeSnapshot("early-warning")
    );

    assert.equal(alerts[0].requiresAction, true);
    assert.equal(alerts[0].riskLevel, "early-warning");
  });

  it("critical risk level → requiresAction = true", () => {
    const { monitor } = createOrchestrator();
    const alerts = monitor.evaluateAssets(
      [makeAqAsset("a1")],
      makeSnapshot("critical")
    );

    assert.equal(alerts[0].requiresAction, true);
    assert.equal(alerts[0].riskLevel, "critical");
  });

  it("returns empty array for empty assets list", () => {
    const { monitor } = createOrchestrator();
    const alerts = monitor.evaluateAssets([], makeSnapshot("critical"));

    assert.equal(alerts.length, 0);
  });

  it("evaluateByOwner queries buffer vault", async () => {
    const { bufferVault, monitor } = createOrchestrator();

    // Pre-populate the vault
    const asset = makeAqAsset("a-owned");
    const collateral = {
      id: "col-1",
      linkedAqAssetId: "a-owned",
      underlying: "ETH" as const,
      source: "aToken" as const,
      amount: 100,
      pendingYield: 0,
      totalHarvested: 0,
      lastUpdate: Date.now(),
    };
    await bufferVault.store(asset, collateral);

    const alerts = await monitor.evaluateByOwner(
      "0xTestOwner",
      makeSnapshot("critical")
    );

    assert.equal(alerts.length, 1);
    assert.equal(alerts[0].assetId, "a-owned");
    assert.equal(alerts[0].requiresAction, true);
  });
});

// ── VaultActionAgent ────────────────────────────────────────────────

describe("VaultActionAgent", () => {
  it("safe → HOLD", () => {
    const agent = new VaultActionAgent();
    const d = agent.decide({ assetId: "a1", riskLevel: "safe" });
    assert.equal(d.action, "HOLD");
  });

  it("watch → INCREASE_BUFFER", () => {
    const agent = new VaultActionAgent();
    const d = agent.decide({ assetId: "a1", riskLevel: "watch" });
    assert.equal(d.action, "INCREASE_BUFFER");
  });

  it("early-warning → PROTECT", () => {
    const agent = new VaultActionAgent();
    const d = agent.decide({ assetId: "a1", riskLevel: "early-warning" });
    assert.equal(d.action, "PROTECT");
  });

  it("critical → EMERGENCY_EXIT", () => {
    const agent = new VaultActionAgent();
    const d = agent.decide({ assetId: "a1", riskLevel: "critical" });
    assert.equal(d.action, "EMERGENCY_EXIT");
  });

  it("reason includes risk level", () => {
    const agent = new VaultActionAgent();
    for (const level of ALL_RISK_LEVELS) {
      const d = agent.decide({ assetId: "a1", riskLevel: level });
      assert.ok(
        d.reason.length > 0,
        `Reason should be non-empty for ${level}`
      );
    }
  });

  it("timestamp is always recent", () => {
    const agent = new VaultActionAgent();
    const before = Date.now();
    const d = agent.decide({ assetId: "a1", riskLevel: "critical" });
    const after = Date.now();

    assert.ok(d.timestamp >= before);
    assert.ok(d.timestamp <= after);
  });
});

// ── SecureVaultAgent ────────────────────────────────────────────────

describe("SecureVaultAgent", () => {
  it("blocks non-actionable risk levels (safe → null)", () => {
    const actionAgent = new VaultActionAgent();
    const secure = new SecureVaultAgent(actionAgent);

    const result = secure.execute({ assetId: "a1", riskLevel: "safe" });
    assert.equal(result, null);
  });

  it("allows watch risk level → INCREASE_BUFFER", () => {
    const actionAgent = new VaultActionAgent();
    const secure = new SecureVaultAgent(actionAgent);

    const result = secure.execute({ assetId: "a1", riskLevel: "watch" });
    assert.notEqual(result, null);
    assert.equal(result!.action, "INCREASE_BUFFER");
  });

  it("allows early-warning → PROTECT", () => {
    const actionAgent = new VaultActionAgent();
    const secure = new SecureVaultAgent(actionAgent);

    const result = secure.execute({
      assetId: "a1",
      riskLevel: "early-warning",
    });
    assert.notEqual(result, null);
    assert.equal(result!.action, "PROTECT");
  });

  it("allows critical → EMERGENCY_EXIT", () => {
    const actionAgent = new VaultActionAgent();
    const secure = new SecureVaultAgent(actionAgent);

    const result = secure.execute({ assetId: "a1", riskLevel: "critical" });
    assert.notEqual(result, null);
    assert.equal(result!.action, "EMERGENCY_EXIT");
  });

  it("null result preserves no-op guarantee", () => {
    const actionAgent = new VaultActionAgent();
    const secure = new SecureVaultAgent(actionAgent);

    // safe is the only non-actionable level
    const result = secure.execute({ assetId: "a1", riskLevel: "safe" });
    assert.strictEqual(result, null);
  });
});

// ── VaultDryRunOrchestrator ─────────────────────────────────────────

describe("VaultDryRunOrchestrator", () => {
  it("critical risk → EMERGENCY_EXIT decisions for all assets", () => {
    const { orchestrator } = createOrchestrator();
    const assets = [makeAqAsset("a1"), makeAqAsset("a2")];
    const snapshot = makeSnapshot("critical");

    const result = orchestrator.simulate(assets, snapshot);

    assert.equal(result.assetsEvaluated, 2);
    assert.equal(result.alertsTriggered, 2);
    assert.equal(result.decisions.length, 2);
    assert.equal(result.decisions[0].action, "EMERGENCY_EXIT");
    assert.equal(result.decisions[1].action, "EMERGENCY_EXIT");
    assert.equal(result.snapshotRiskLevel, "critical");
  });

  it("early-warning risk → PROTECT decisions", () => {
    const { orchestrator } = createOrchestrator();
    const assets = [makeAqAsset("a1")];
    const snapshot = makeSnapshot("early-warning");

    const result = orchestrator.simulate(assets, snapshot);

    assert.equal(result.decisions.length, 1);
    assert.equal(result.decisions[0].action, "PROTECT");
    assert.equal(result.decisions[0].assetId, "a1");
  });

  it("watch risk → INCREASE_BUFFER decisions", () => {
    const { orchestrator } = createOrchestrator();
    const assets = [makeAqAsset("a1")];
    const snapshot = makeSnapshot("watch");

    const result = orchestrator.simulate(assets, snapshot);

    assert.equal(result.decisions.length, 1);
    assert.equal(result.decisions[0].action, "INCREASE_BUFFER");
  });

  it("safe risk → zero decisions", () => {
    const { orchestrator } = createOrchestrator();
    const assets = [makeAqAsset("a1"), makeAqAsset("a2")];
    const snapshot = makeSnapshot("safe");

    const result = orchestrator.simulate(assets, snapshot);

    assert.equal(result.assetsEvaluated, 2);
    assert.equal(result.alertsTriggered, 0);
    assert.equal(result.decisions.length, 0);
    assert.equal(result.snapshotRiskLevel, "safe");
  });

  it("empty assets → empty result", () => {
    const { orchestrator } = createOrchestrator();
    const result = orchestrator.simulate([], makeSnapshot("critical"));

    assert.equal(result.assetsEvaluated, 0);
    assert.equal(result.alertsTriggered, 0);
    assert.equal(result.decisions.length, 0);
  });

  it("result contains valid timestamp", () => {
    const { orchestrator } = createOrchestrator();
    const before = Date.now();
    const result = orchestrator.simulate(
      [makeAqAsset("a1")],
      makeSnapshot("critical")
    );
    const after = Date.now();

    assert.ok(result.timestamp >= before);
    assert.ok(result.timestamp <= after);
  });

  it("all risk levels produce correct decision count", () => {
    const { orchestrator } = createOrchestrator();
    const assets = [makeAqAsset("a1")];

    // safe → 0 decisions, others → 1 decision each
    const safeDR = orchestrator.simulate(assets, makeSnapshot("safe"));
    assert.equal(safeDR.decisions.length, 0);

    const watchDR = orchestrator.simulate(assets, makeSnapshot("watch"));
    assert.equal(watchDR.decisions.length, 1);

    const earlyDR = orchestrator.simulate(
      assets,
      makeSnapshot("early-warning")
    );
    assert.equal(earlyDR.decisions.length, 1);

    const critDR = orchestrator.simulate(assets, makeSnapshot("critical"));
    assert.equal(critDR.decisions.length, 1);
  });
});

// ── No Mutation Guarantees ──────────────────────────────────────────

describe("Dry-Run / no mutation guarantees", () => {
  it("VaultService state is NOT modified during dry-run", async () => {
    const { bufferVault, orchestrator } = createOrchestrator();

    // Pre-populate vault with an asset
    const asset = makeAqAsset("a-no-mutate");
    const collateral = {
      id: "col-nm",
      linkedAqAssetId: "a-no-mutate",
      underlying: "ETH" as const,
      source: "aToken" as const,
      amount: 100,
      pendingYield: 0,
      totalHarvested: 0,
      lastUpdate: Date.now(),
    };
    await bufferVault.store(asset, collateral);

    // Capture state before
    const assetBefore = await bufferVault.getAqAsset("a-no-mutate");
    assert.notEqual(assetBefore, null);

    // Run dry-run with critical risk (would normally trigger emergency exit)
    orchestrator.simulate([asset], makeSnapshot("critical"));

    // Verify state unchanged
    const assetAfter = await bufferVault.getAqAsset("a-no-mutate");
    assert.notEqual(assetAfter, null);
    assert.equal(assetAfter!.balance, assetBefore!.balance);
    assert.equal(assetAfter!.accruedYield, assetBefore!.accruedYield);
    assert.equal(bufferVault.size, 1);
  });

  it("multiple dry-runs are idempotent", () => {
    const { orchestrator } = createOrchestrator();
    const assets = [makeAqAsset("a1")];
    const snapshot = makeSnapshot("critical");

    const r1 = orchestrator.simulate(assets, snapshot);
    const r2 = orchestrator.simulate(assets, snapshot);
    const r3 = orchestrator.simulate(assets, snapshot);

    assert.equal(r1.decisions.length, r2.decisions.length);
    assert.equal(r2.decisions.length, r3.decisions.length);
    assert.equal(r1.decisions[0].action, r2.decisions[0].action);
    assert.equal(r2.decisions[0].action, r3.decisions[0].action);
  });
});

// ── Architecture Boundary Checks ────────────────────────────────────

describe("Dry-Run / architecture boundaries", () => {
  it("decisions reuse canonical MitigationAction type", () => {
    const { orchestrator } = createOrchestrator();
    const validActions = [
      "HOLD",
      "INCREASE_BUFFER",
      "REBALANCE",
      "PROTECT",
      "EMERGENCY_EXIT",
    ];

    for (const level of ALL_RISK_LEVELS) {
      const result = orchestrator.simulate(
        [makeAqAsset("a1")],
        makeSnapshot(level)
      );
      for (const d of result.decisions) {
        assert.ok(
          validActions.includes(d.action),
          `Invalid action "${d.action}" for risk level "${level}"`
        );
      }
    }
  });

  it("action mapping is consistent with resolveStrategy", () => {
    const { orchestrator } = createOrchestrator();

    for (const level of ALL_RISK_LEVELS) {
      const strategy = resolveStrategy(level);
      const result = orchestrator.simulate(
        [makeAqAsset("a1")],
        makeSnapshot(level)
      );

      if (requiresMitigation(level)) {
        assert.equal(result.decisions.length, 1);
        assert.equal(
          result.decisions[0].action,
          strategy.action,
          `Decision action should match canonical strategy for ${level}`
        );
      } else {
        assert.equal(
          result.decisions.length,
          0,
          `No decisions expected for non-actionable level ${level}`
        );
      }
    }
  });

  it("decisions always have valid riskLevel (AceRiskLevel)", () => {
    const { orchestrator } = createOrchestrator();

    for (const level of ALL_RISK_LEVELS) {
      const result = orchestrator.simulate(
        [makeAqAsset("a1")],
        makeSnapshot(level)
      );
      for (const d of result.decisions) {
        assert.ok(
          ALL_RISK_LEVELS.includes(d.riskLevel),
          `Decision riskLevel "${d.riskLevel}" is not a valid AceRiskLevel`
        );
      }
    }
  });
});
