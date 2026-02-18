/**
 * Architecture Invariant Test — AaveRiskSnapshot Safety
 *
 * Verifies critical safety invariants for the canonical AaveRiskSnapshot DTO:
 *
 *   1. riskLevel is REQUIRED (never optional, never nullable)
 *   2. No silent fallback to "safe" exists anywhere in the codebase
 *   3. Snapshot construction happens ONLY inside risk-intelligence/
 *
 * These invariants exist because:
 *   - An optional riskLevel would allow unscored snapshots to flow through
 *     the system, bypassing the risk-intelligence pipeline entirely.
 *   - A fallback like `riskLevel ?? "safe"` would mask missing scoring,
 *     making the system silently treat unscored data as safe.
 *   - Constructing snapshots outside risk-intelligence would allow
 *     layers to fabricate risk data without going through scoring.
 *
 * If any test here fails, a safety invariant has been violated.
 * Fix by restoring the invariant — do NOT weaken the test.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

// ── Helpers ──────────────────────────────────────────────────────────

const PROTOCOLS_ROOT = join(
  import.meta.dirname,
  "..",
  "..",
  "src",
  "protocols"
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

/** Read file content as string. */
function read(filePath: string): string {
  return readFileSync(filePath, "utf-8");
}

/** Non-comment, non-empty code lines. */
function codeLines(filePath: string): string[] {
  return read(filePath)
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
  return relative(PROTOCOLS_ROOT, filePath).split(sep).join("/");
}

// ── Invariant 1: riskLevel is REQUIRED ──────────────────────────────

describe("Safety invariant: riskLevel is required on AaveRiskSnapshot", () => {
  const snapshotFile = join(
    PROTOCOLS_ROOT,
    "aave",
    "domain",
    "aave-risk-snapshot.ts"
  );

  it("should exist", () => {
    const content = read(snapshotFile);
    assert.ok(content.length > 0, "aave-risk-snapshot.ts is empty");
  });

  it("should declare riskLevel as a required field (no ? marker)", () => {
    const content = read(snapshotFile);

    // riskLevel must appear as "riskLevel:" (required) not "riskLevel?:" (optional)
    assert.ok(
      /riskLevel\s*:/.test(content),
      "riskLevel field not found in AaveRiskSnapshot"
    );
    assert.ok(
      !/riskLevel\s*\?\s*:/.test(content),
      "riskLevel is marked as OPTIONAL (?) — must be required"
    );
  });

  it("should not union riskLevel with undefined or null", () => {
    const content = read(snapshotFile);
    const lines = content.split("\n");

    for (const line of lines) {
      if (line.includes("riskLevel") && /\|\s*(undefined|null)/.test(line)) {
        assert.fail(
          `riskLevel is unioned with undefined/null: ${line.trim()}`
        );
      }
    }
  });
});

// ── Invariant 2: No silent fallback to "safe" ──────────────────────

describe("Safety invariant: no silent fallback to 'safe' for riskLevel", () => {
  const allSrcFiles = collectTsFiles(PROTOCOLS_ROOT);

  it("should find source files to scan", () => {
    assert.ok(allSrcFiles.length > 0, "No .ts source files found");
  });

  it("should contain zero riskLevel ?? 'safe' fallbacks", () => {
    const violations: string[] = [];

    for (const file of allSrcFiles) {
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

  it("should contain zero riskLevel || 'safe' fallbacks", () => {
    const violations: string[] = [];

    for (const file of allSrcFiles) {
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

  it("should contain zero 'if (!snapshot.riskLevel)' guards", () => {
    const violations: string[] = [];

    for (const file of allSrcFiles) {
      const lines = codeLines(file);
      for (const line of lines) {
        if (/if\s*\(\s*!\s*snapshot\.riskLevel\s*\)/.test(line)) {
          violations.push(`${rel(file)}: ${line.trim()}`);
        }
      }
    }

    assert.equal(
      violations.length,
      0,
      `Found falsy riskLevel guard(s) (implies riskLevel can be missing):\n${violations.join("\n")}`
    );
  });
});

// ── Invariant 3: Snapshot construction only inside risk-intelligence ─

describe("Safety invariant: AaveRiskSnapshot constructed only in risk-intelligence", () => {
  // Files that are allowed to create snapshot object literals
  const ALLOWED_DIR = join(PROTOCOLS_ROOT, "aave", "risk-intelligence");

  // Scan everything OUTSIDE risk-intelligence for snapshot construction
  const aaveRoot = join(PROTOCOLS_ROOT, "aave");
  const agentSecurityRoot = join(PROTOCOLS_ROOT, "agent-security");

  const aaveFiles = collectTsFiles(aaveRoot).filter(
    (f) => !f.startsWith(ALLOWED_DIR)
  );
  const agentSecurityFiles = collectTsFiles(agentSecurityRoot);
  const filesToScan = [...aaveFiles, ...agentSecurityFiles];

  it("should not construct AaveRiskSnapshot object literals outside risk-intelligence", () => {
    // Pattern: ": AaveRiskSnapshot = {" or "as AaveRiskSnapshot = {"
    // This catches explicit typed construction.
    const constructionPattern = /:\s*AaveRiskSnapshot\s*=\s*\{/;

    const violations: string[] = [];

    for (const file of filesToScan) {
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
      `Found snapshot construction outside risk-intelligence:\n${violations.join("\n")}`
    );
  });

  it("should not have factory functions for AaveRiskSnapshot outside risk-intelligence", () => {
    // Pattern: functions returning AaveRiskSnapshot
    const factoryPattern = /\)\s*:\s*AaveRiskSnapshot\s*\{/;

    const violations: string[] = [];

    for (const file of filesToScan) {
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
      `Found factory function(s) for AaveRiskSnapshot outside risk-intelligence:\n${violations.join("\n")}`
    );
  });
});
