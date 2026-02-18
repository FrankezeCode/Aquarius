/**
 * Architecture Boundary Test — Aave DDD Enforcement
 *
 * Verifies strict DDD boundaries between:
 *   - protocols/aave/ (risk-intelligence, ai-agents, domain)
 *   - protocols/agent-security/
 *
 * These tests scan source files at the filesystem level.
 * They prevent architectural drift by catching:
 *   1. Reverse imports (aave → agent-security)
 *   2. Duplicate AaveRiskSnapshot definitions
 *   3. Numeric risk constants inside agent-security
 *   4. Threshold constants inside ai-agents (parallel risk classification)
 *
 * If any test here fails, a DDD boundary has been violated.
 * Fix by removing the violation — do NOT weaken the test.
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
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collectTsFiles(full));
    } else if (full.endsWith(".ts")) {
      results.push(full);
    }
  }
  return results;
}

/** Read a file and return non-comment, non-empty lines. */
function codeLines(filePath: string): string[] {
  return readFileSync(filePath, "utf-8")
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      // Skip empty lines, single-line comments, JSDoc comment markers
      if (trimmed === "") return false;
      if (trimmed.startsWith("//")) return false;
      if (trimmed.startsWith("*")) return false;
      if (trimmed.startsWith("/*")) return false;
      return true;
    });
}

/** Get relative path for readable error messages. */
function rel(filePath: string): string {
  return relative(PROTOCOLS_ROOT, filePath).split(sep).join("/");
}

// ── Test: No reverse imports (aave → agent-security) ─────────────────

describe("DDD boundary: aave must NOT import from agent-security", () => {
  const aaveRoot = join(PROTOCOLS_ROOT, "aave");
  const aaveFiles = collectTsFiles(aaveRoot);

  it("should have Aave source files to scan", () => {
    assert.ok(aaveFiles.length > 0, "No .ts files found under protocols/aave/");
  });

  it("should contain zero import statements referencing agent-security", () => {
    const violations: string[] = [];

    for (const file of aaveFiles) {
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
      `Found ${violations.length} reverse import(s) from aave → agent-security:\n` +
        violations.join("\n")
    );
  });
});

// ── Test: AaveRiskSnapshot defined once ──────────────────────────────

describe("DDD boundary: AaveRiskSnapshot defined in exactly one place", () => {
  const allFiles = collectTsFiles(PROTOCOLS_ROOT);

  it("should define 'interface AaveRiskSnapshot' in exactly one file", () => {
    const definitions: string[] = [];

    for (const file of allFiles) {
      const content = readFileSync(file, "utf-8");
      if (/export\s+interface\s+AaveRiskSnapshot\b/.test(content)) {
        definitions.push(rel(file));
      }
    }

    assert.equal(
      definitions.length,
      1,
      `Expected exactly 1 definition of AaveRiskSnapshot, found ${definitions.length}:\n` +
        definitions.join("\n")
    );

    assert.ok(
      definitions[0]!.includes("aave/domain/aave-risk-snapshot"),
      `AaveRiskSnapshot must be defined in aave/domain/aave-risk-snapshot.ts, ` +
        `but found in: ${definitions[0]}`
    );
  });

  it("should NOT define 'type AaveRiskSnapshot =' anywhere (only interface)", () => {
    const violations: string[] = [];

    for (const file of allFiles) {
      const content = readFileSync(file, "utf-8");
      // Match "type AaveRiskSnapshot = ..." but NOT "type { AaveRiskSnapshot }" re-exports
      if (/(?<![\{,]\s*)type\s+AaveRiskSnapshot\s*=/.test(content)) {
        violations.push(rel(file));
      }
    }

    assert.equal(
      violations.length,
      0,
      `Found type alias definition(s) for AaveRiskSnapshot (must use canonical interface):\n` +
        violations.join("\n")
    );
  });
});

// ── Test: agent-security contains zero risk scoring constants ────────

describe("DDD boundary: agent-security contains zero risk scoring logic", () => {
  const agentSecurityRoot = join(PROTOCOLS_ROOT, "agent-security");
  const agentSecurityFiles = collectTsFiles(agentSecurityRoot);

  it("should have agent-security source files to scan", () => {
    assert.ok(
      agentSecurityFiles.length > 0,
      "No .ts files found under protocols/agent-security/"
    );
  });

  it("should contain zero numeric threshold constants", () => {
    const forbiddenPatterns = [
      /CRITICAL_HF/,
      /HIGH_HF/,
      /HF_THRESHOLD/,
      /VOLATILITY.*THRESHOLD/,
      /liquidationThreshold/,
      /RISK_THRESHOLD/,
    ];

    const violations: string[] = [];

    for (const file of agentSecurityFiles) {
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
      `Found ${violations.length} threshold constant(s) in agent-security (scoring belongs in risk-intelligence):\n` +
        violations.join("\n")
    );
  });

  it("should contain zero Math.* scoring computations", () => {
    const violations: string[] = [];

    for (const file of agentSecurityFiles) {
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
      `Found ${violations.length} Math computation(s) in agent-security (scoring belongs in risk-intelligence):\n` +
        violations.join("\n")
    );
  });
});

// ── Test: ai-agents contains zero hardcoded risk thresholds ──────────

describe("DDD boundary: ai-agents contains zero hardcoded risk thresholds", () => {
  const aiAgentsRoot = join(PROTOCOLS_ROOT, "aave", "ai-agents");
  const aiAgentsFiles = collectTsFiles(aiAgentsRoot);

  it("should have ai-agents source files to scan", () => {
    assert.ok(
      aiAgentsFiles.length > 0,
      "No .ts files found under protocols/aave/ai-agents/"
    );
  });

  it("should contain zero threshold constants for risk scoring", () => {
    const forbiddenPatterns = [
      /CRITICAL_HF/,
      /HIGH_HF/,
      /HF_THRESHOLD/,
      /HF_PROTECT/,
      /VOLATILITY.*THRESHOLD/,
      /AGENT_HF/,
      /AGENT_VOLATILITY/,
    ];

    const violations: string[] = [];

    for (const file of aiAgentsFiles) {
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
      `Found ${violations.length} threshold constant(s) in ai-agents (risk classification belongs in risk-intelligence):\n` +
        violations.join("\n")
    );
  });

  it("should not compare healthFactor against numeric literals", () => {
    const violations: string[] = [];

    for (const file of aiAgentsFiles) {
      const lines = codeLines(file);
      for (const line of lines) {
        // Match: healthFactor < 1.2, healthFactor > 0.5, etc.
        if (/healthFactor\s*[<>]=?\s*\d/.test(line)) {
          violations.push(`${rel(file)}: ${line.trim()}`);
        }
        // Match: volatilityScore > 0.7, volatilityScore < 0.3, etc.
        if (/volatilityScore\s*[<>]=?\s*\d/.test(line)) {
          violations.push(`${rel(file)}: ${line.trim()}`);
        }
      }
    }

    assert.equal(
      violations.length,
      0,
      `Found ${violations.length} raw metric comparison(s) in ai-agents ` +
        `(agent must use snapshot.riskLevel only):\n` +
        violations.join("\n")
    );
  });
});
