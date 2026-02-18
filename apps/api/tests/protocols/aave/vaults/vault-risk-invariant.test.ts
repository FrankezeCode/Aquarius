/**
 * Risk Invariant Test — Vault Layer
 *
 * Verifies critical safety invariants for the vault's interaction
 * with the risk-intelligence pipeline:
 *
 *   1. riskLevel is always required — vault NEVER operates without one
 *   2. aqAsset can ONLY be minted when collateral is present
 *   3. No fallback defaults for riskLevel exist in vault code
 *   4. Buffer vault only stores collateral from aqAsset deposits
 *   5. Risk mitigation strategy covers all AceRiskLevel values
 *   6. Vault does NOT construct AaveRiskSnapshot objects
 *
 * These invariants exist because:
 *   - The vault layer must NEVER make risk decisions without scored data
 *   - aqAssets without backing collateral would be unbacked tokens
 *   - Silent fallbacks to "safe" would mask missing risk scores
 *   - The vault must trust the risk-intelligence pipeline as sole scorer
 *
 * If any test here fails, a safety invariant has been violated.
 * Fix by restoring the invariant — do NOT weaken the test.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

import {
  mintAqAsset,
  resolveStrategy,
  allStrategies,
} from "../../../../src/protocols/aave/vaults/domain/index.js";

import { InMemoryBufferVault } from "../../../../src/protocols/aave/vaults/infrastructure/buffer-vault.js";
import {
  createCollateralAsset,
} from "../../../../src/protocols/aave/vaults/domain/collateral-asset.js";

import type { AceRiskLevel } from "../../../../src/protocols/aave/risk-intelligence/scorer.js";

// ── Helpers ──────────────────────────────────────────────────────────

const VAULTS_ROOT = join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  "src",
  "protocols",
  "aave",
  "vaults"
);

/** Recursively collect all .ts files under a directory. */
function collectTsFiles(dir: string): string[] {
  const results: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collectTsFiles(full));
    } else if (full.endsWith(".ts")) {
      results.push(full);
    }
  }
  return results;
}

/** Non-comment, non-empty code lines. */
function codeLines(filePath: string): string[] {
  return readFileSync(filePath, "utf-8")
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      if (t === "") return false;
      if (t.startsWith("//")) return false;
      if (t.startsWith("*")) return false;
      if (t.startsWith("/*")) return false;
      return true;
    });
}

/** Relative path for readable error messages. */
function rel(filePath: string): string {
  return relative(VAULTS_ROOT, filePath).split(sep).join("/");
}

// ── Invariant 1: riskLevel is always required ────────────────────────

describe("Vault invariant: riskLevel is always required", () => {
  it("resolveStrategy throws for undefined riskLevel", () => {
    assert.throws(
      () => resolveStrategy(undefined as unknown as AceRiskLevel),
      /missing|unrecognized/i
    );
  });

  it("resolveStrategy throws for null riskLevel", () => {
    assert.throws(
      () => resolveStrategy(null as unknown as AceRiskLevel),
      /missing|unrecognized/i
    );
  });

  it("resolveStrategy throws for invalid string", () => {
    assert.throws(
      () => resolveStrategy("invalid" as AceRiskLevel),
      /missing|unrecognized/i
    );
  });

  it("resolveStrategy succeeds for all valid AceRiskLevels", () => {
    const levels: AceRiskLevel[] = ["safe", "watch", "early-warning", "critical"];
    for (const level of levels) {
      assert.doesNotThrow(() => resolveStrategy(level));
    }
  });
});

// ── Invariant 2: aqAsset only minted with collateral ─────────────────

describe("Vault invariant: aqAsset only minted if collateral present", () => {
  it("mintAqAsset requires positive amount (proxy for collateral deposit)", () => {
    assert.throws(
      () => mintAqAsset("aq1", "0xOwner", "ETH", 0, "vault-1"),
      /non-positive/
    );
  });

  it("mintAqAsset requires non-negative amount", () => {
    assert.throws(
      () => mintAqAsset("aq2", "0xOwner", "ETH", -10, "vault-1"),
      /non-positive/
    );
  });

  it("buffer vault stores both aqAsset and collateral atomically", async () => {
    const vault = new InMemoryBufferVault();
    const aqAsset = mintAqAsset("aq1", "0xOwner", "ETH", 10, "vault-1");
    const collateral = createCollateralAsset(
      "col1",
      "aq1",
      "ETH",
      "AAVE_ATOKEN",
      10
    );

    await vault.store(aqAsset, collateral);

    // Both must exist
    assert.ok(await vault.getAqAsset("aq1"));
    assert.ok(await vault.getCollateral("aq1"));
  });

  it("aqAsset must have linkedVault", () => {
    assert.throws(
      () => mintAqAsset("aq1", "0xOwner", "ETH", 10, ""),
      /required/
    );
  });

  it("aqAsset must have owner", () => {
    assert.throws(
      () => mintAqAsset("aq1", "", "ETH", 10, "vault-1"),
      /required/
    );
  });
});

// ── Invariant 3: No fallback defaults for riskLevel ──────────────────

describe("Vault invariant: no riskLevel fallback defaults in vault code", () => {
  const vaultFiles = collectTsFiles(VAULTS_ROOT);

  it("should have vault source files to scan", () => {
    assert.ok(vaultFiles.length > 0, "No .ts files found under vaults/");
  });

  it("should contain zero riskLevel ?? 'safe' patterns", () => {
    const violations: string[] = [];
    for (const file of vaultFiles) {
      const lines = codeLines(file);
      for (const line of lines) {
        if (/riskLevel\s*\?\?\s*["']safe["']/.test(line)) {
          violations.push(`${rel(file)}: ${line.trim()}`);
        }
      }
    }
    assert.equal(
      violations.length,
      0,
      `Found nullish coalescing fallback(s) to "safe":\n${violations.join("\n")}`
    );
  });

  it("should contain zero riskLevel || 'safe' patterns", () => {
    const violations: string[] = [];
    for (const file of vaultFiles) {
      const lines = codeLines(file);
      for (const line of lines) {
        if (/riskLevel\s*\|\|\s*["']safe["']/.test(line)) {
          violations.push(`${rel(file)}: ${line.trim()}`);
        }
      }
    }
    assert.equal(
      violations.length,
      0,
      `Found logical-or fallback(s) to "safe":\n${violations.join("\n")}`
    );
  });

  it("should contain zero default: 'safe' in switch statements", () => {
    const violations: string[] = [];
    for (const file of vaultFiles) {
      const lines = codeLines(file);
      for (const line of lines) {
        if (/default:\s*["']safe["']/.test(line)) {
          violations.push(`${rel(file)}: ${line.trim()}`);
        }
      }
    }
    assert.equal(
      violations.length,
      0,
      `Found default "safe" in switch:\n${violations.join("\n")}`
    );
  });
});

// ── Invariant 4: Buffer vault only stores from aqAsset deposits ──────

describe("Vault invariant: buffer vault only stores collateral from aqAsset deposits", () => {
  it("collateral must be linked to an aqAsset", () => {
    assert.throws(
      () => createCollateralAsset("col1", "", "ETH", "AAVE_ATOKEN", 10),
      /required/
    );
  });

  it("collateral amount must be positive", () => {
    assert.throws(
      () => createCollateralAsset("col1", "aq1", "ETH", "AAVE_ATOKEN", 0),
      /non-positive/
    );
  });

  it("removing aqAsset also removes its collateral from vault", async () => {
    const vault = new InMemoryBufferVault();
    const aqAsset = mintAqAsset("aq1", "0xOwner", "ETH", 10, "vault-1");
    const collateral = createCollateralAsset(
      "col1",
      "aq1",
      "ETH",
      "AAVE_ATOKEN",
      10
    );

    await vault.store(aqAsset, collateral);
    await vault.remove("aq1");

    assert.equal(await vault.getAqAsset("aq1"), null);
    assert.equal(await vault.getCollateral("aq1"), null);
  });
});

// ── Invariant 5: Strategy covers all AceRiskLevels ───────────────────

describe("Vault invariant: risk mitigation strategy covers all levels", () => {
  it("allStrategies returns exactly 4 strategies", () => {
    assert.equal(allStrategies().length, 4);
  });

  it("every AceRiskLevel has a defined strategy", () => {
    const levels: AceRiskLevel[] = [
      "safe",
      "watch",
      "early-warning",
      "critical",
    ];
    for (const level of levels) {
      const strategy = resolveStrategy(level);
      assert.equal(strategy.riskLevel, level);
      assert.ok(strategy.action, `Missing action for level: ${level}`);
      assert.ok(
        strategy.description,
        `Missing description for level: ${level}`
      );
    }
  });
});

// ── Invariant 6: Vault does NOT construct AaveRiskSnapshot ───────────

describe("Vault invariant: vault does NOT construct AaveRiskSnapshot objects", () => {
  const vaultFiles = collectTsFiles(VAULTS_ROOT);

  it("should not contain AaveRiskSnapshot object literals", () => {
    const constructionPattern = /:\s*AaveRiskSnapshot\s*=\s*\{/;
    const violations: string[] = [];

    for (const file of vaultFiles) {
      const lines = codeLines(file);
      for (const line of lines) {
        if (constructionPattern.test(line)) {
          violations.push(`${rel(file)}: ${line.trim()}`);
        }
      }
    }

    assert.equal(
      violations.length,
      0,
      `Found snapshot construction in vault layer (must come from risk-intelligence):\n${violations.join("\n")}`
    );
  });

  it("should not have factory functions returning AaveRiskSnapshot", () => {
    const factoryPattern = /\)\s*:\s*AaveRiskSnapshot\s*\{/;
    const violations: string[] = [];

    for (const file of vaultFiles) {
      const lines = codeLines(file);
      for (const line of lines) {
        if (factoryPattern.test(line)) {
          violations.push(`${rel(file)}: ${line.trim()}`);
        }
      }
    }

    assert.equal(
      violations.length,
      0,
      `Found factory function(s) for AaveRiskSnapshot in vault layer:\n${violations.join("\n")}`
    );
  });
});
