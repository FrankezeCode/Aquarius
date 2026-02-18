/**
 * Boundary Test — Vault Layer
 *
 * Ensures architectural boundaries for the vault layer:
 *
 *   1. Deposits cannot exist without collateral (aqAsset ↔ collateral 1:1)
 *   2. Vault layer does NOT import from agent-security
 *   3. Vault layer does NOT duplicate risk scoring logic
 *   4. Vault layer does NOT define its own AaveRiskSnapshot
 *   5. Vault layer does NOT contain hardcoded risk thresholds
 *   6. Vault layer only reads riskLevel — never computes it
 *
 * If any test here fails, a boundary has been violated.
 * Fix by removing the violation — do NOT weaken the test.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

import {
  mintAqAsset,
  createCollateralAsset,
} from "../../../../src/protocols/aave/vaults/domain/index.js";

import { InMemoryBufferVault } from "../../../../src/protocols/aave/vaults/infrastructure/buffer-vault.js";

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

// ── Boundary 1: Deposits require collateral ──────────────────────────

describe("Vault boundary: deposits cannot exist without collateral", () => {
  it("buffer vault requires both aqAsset and collateral on store", async () => {
    const vault = new InMemoryBufferVault();
    const aqAsset = mintAqAsset("aq1", "0xOwner", "ETH", 10, "vault-1");

    // Store requires both aqAsset AND collateral
    const collateral = createCollateralAsset(
      "col1",
      "aq1",
      "ETH",
      "AAVE_ATOKEN",
      10
    );

    // This should succeed
    await vault.store(aqAsset, collateral);

    // Verify both are stored
    const retrievedAq = await vault.getAqAsset("aq1");
    const retrievedCol = await vault.getCollateral("aq1");
    assert.ok(retrievedAq, "aqAsset must exist after deposit");
    assert.ok(retrievedCol, "Collateral must exist after deposit");
  });

  it("removing aqAsset also removes collateral", async () => {
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

  it("cannot mint aqAsset with zero amount (no free tokens)", () => {
    assert.throws(
      () => mintAqAsset("aq1", "0xOwner", "ETH", 0, "vault-1"),
      /non-positive/
    );
  });

  it("cannot create collateral with zero amount", () => {
    assert.throws(
      () => createCollateralAsset("col1", "aq1", "ETH", "AAVE_ATOKEN", 0),
      /non-positive/
    );
  });
});

// ── Boundary 2: Vault does NOT import from agent-security ────────────

describe("Vault boundary: vault does NOT import from agent-security", () => {
  const vaultFiles = collectTsFiles(VAULTS_ROOT);

  it("should have vault source files to scan", () => {
    assert.ok(vaultFiles.length > 0, "No .ts files found under vaults/");
  });

  it("should contain zero imports from agent-security", () => {
    const violations: string[] = [];

    for (const file of vaultFiles) {
      const lines = codeLines(file);
      for (const line of lines) {
        if (line.includes("from") && line.includes("agent-security")) {
          violations.push(`${rel(file)}: ${line.trim()}`);
        }
      }
    }

    assert.equal(
      violations.length,
      0,
      `Found import(s) from agent-security in vault layer:\n${violations.join("\n")}`
    );
  });
});

// ── Boundary 3: Vault does NOT duplicate AaveRiskSnapshot ────────────

describe("Vault boundary: vault does NOT define AaveRiskSnapshot", () => {
  const vaultFiles = collectTsFiles(VAULTS_ROOT);

  it("should not define interface AaveRiskSnapshot", () => {
    const violations: string[] = [];

    for (const file of vaultFiles) {
      const content = readFileSync(file, "utf-8");
      if (/export\s+interface\s+AaveRiskSnapshot\b/.test(content)) {
        violations.push(rel(file));
      }
    }

    assert.equal(
      violations.length,
      0,
      `Vault layer must NOT define AaveRiskSnapshot (import from domain):\n${violations.join("\n")}`
    );
  });
});

// ── Boundary 4: Vault contains zero risk scoring logic ───────────────

describe("Vault boundary: vault contains zero risk scoring logic", () => {
  const vaultFiles = collectTsFiles(VAULTS_ROOT);

  it("should contain zero threshold constants", () => {
    const forbiddenPatterns = [
      /CRITICAL_HF/,
      /HIGH_HF/,
      /HF_THRESHOLD/,
      /VOLATILITY.*THRESHOLD/,
      /liquidationThreshold/,
      /RISK_THRESHOLD/,
    ];

    const violations: string[] = [];

    for (const file of vaultFiles) {
      const lines = codeLines(file);
      for (const line of lines) {
        for (const pattern of forbiddenPatterns) {
          if (pattern.test(line)) {
            violations.push(`${rel(file)}: ${line.trim()}`);
          }
        }
      }
    }

    assert.equal(
      violations.length,
      0,
      `Found threshold constant(s) in vault layer (scoring belongs in risk-intelligence):\n${violations.join("\n")}`
    );
  });

  it("should not compare healthFactor against numeric literals", () => {
    const violations: string[] = [];

    for (const file of vaultFiles) {
      const lines = codeLines(file);
      for (const line of lines) {
        if (/healthFactor\s*[<>]=?\s*\d/.test(line)) {
          violations.push(`${rel(file)}: ${line.trim()}`);
        }
        if (/volatilityScore\s*[<>]=?\s*\d/.test(line)) {
          violations.push(`${rel(file)}: ${line.trim()}`);
        }
      }
    }

    assert.equal(
      violations.length,
      0,
      `Found raw metric comparison(s) in vault layer:\n${violations.join("\n")}`
    );
  });

  it("should contain zero Math.* scoring computations", () => {
    const violations: string[] = [];

    for (const file of vaultFiles) {
      const lines = codeLines(file);
      for (const line of lines) {
        if (/Math\.(max|min|round|floor|ceil)\s*\(/.test(line)) {
          violations.push(`${rel(file)}: ${line.trim()}`);
        }
      }
    }

    assert.equal(
      violations.length,
      0,
      `Found Math computation(s) in vault layer:\n${violations.join("\n")}`
    );
  });
});

// ── Boundary 5: Vault only reads riskLevel via resolveStrategy ───────

describe("Vault boundary: vault only consumes riskLevel, never computes", () => {
  const vaultFiles = collectTsFiles(VAULTS_ROOT);

  it("should not contain riskLevel ?? or riskLevel || fallbacks", () => {
    const violations: string[] = [];

    for (const file of vaultFiles) {
      const lines = codeLines(file);
      for (const line of lines) {
        if (/riskLevel\s*\?\?\s*["']/.test(line)) {
          violations.push(`${rel(file)}: ${line.trim()}`);
        }
        if (/riskLevel\s*\|\|\s*["']/.test(line)) {
          violations.push(`${rel(file)}: ${line.trim()}`);
        }
      }
    }

    assert.equal(
      violations.length,
      0,
      `Found riskLevel fallback(s) in vault layer:\n${violations.join("\n")}`
    );
  });

  it("should not contain if (!snapshot.riskLevel) guards", () => {
    const violations: string[] = [];

    for (const file of vaultFiles) {
      const lines = codeLines(file);
      for (const line of lines) {
        // Match: if (!snapshot.riskLevel) — direct falsy check on the field
        // Do NOT match: if (!requiresMitigation(snapshot.riskLevel)) — valid function call
        if (/if\s*\(\s*!\s*\w+\.riskLevel\s*\)/.test(line)) {
          violations.push(`${rel(file)}: ${line.trim()}`);
        }
      }
    }

    assert.equal(
      violations.length,
      0,
      `Found falsy riskLevel guard(s) in vault layer:\n${violations.join("\n")}`
    );
  });
});
