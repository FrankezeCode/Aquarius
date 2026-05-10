/**
 * Kamino repay write policy (pure).
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertRepayDryRunAllowed,
  KaminoWritePolicyError,
} from "../../src/protocols/kamino-solana/policy/kamino-repay-policy.js";
import type { Config } from "../../src/config/index.js";

function cfg(over: Partial<Config> = {}): Config {
  return {
    port: 3001,
    nodeEnv: "test",
    rateLimitEnabled: false,
    rateLimitPublicMax: 180,
    rateLimitCopilotMax: 24,
    rateLimitInternalWebhookMax: 480,
    rateLimitCreMax: 30,
    rateLimitKaminoWriteMax: 24,
    solanaRpcUrl: "https://example.com",
    solanaRpcFallbackUrl: undefined,
    solanaCluster: "devnet",
    kaminoDefaultMarketPubkey: undefined,
    kaminoReadEnabled: true,
    kaminoRpcTimeoutMs: 10_000,
    kaminoCircuitFailureThreshold: 5,
    kaminoCircuitOpenMs: 30_000,
    kaminoRecentSlotMs: 400,
    kaminoMarketLoadCacheTtlMs: 60_000,
    kaminoCreStaleSnapshotEnabled: false,
    kaminoStaleSnapshotMaxAgeMs: 300_000,
    kaminoCreBackgroundRefreshEnabled: false,
    kaminoWriteEnabled: true,
    kaminoRepaySimulateTimeoutMs: 20_000,
    kaminoMaxRepayUi: "100",
    kaminoAllowedRepayMints: null,
    ...over,
  };
}

describe("assertRepayDryRunAllowed", () => {
  it("rejects when write enabled but Solana RPC missing", () => {
    assert.throws(
      () =>
        assertRepayDryRunAllowed(
          cfg({ kaminoWriteEnabled: true, solanaRpcUrl: undefined }),
          {
            amountUi: "1",
            repayMint: "So11111111111111111111111111111111111111112",
          }
        ),
      (e) =>
        e instanceof KaminoWritePolicyError && e.code === "RPC_NOT_CONFIGURED"
    );
  });

  it("rejects when write disabled", () => {
    assert.throws(
      () =>
        assertRepayDryRunAllowed(cfg({ kaminoWriteEnabled: false }), {
          amountUi: "1",
          repayMint: "So11111111111111111111111111111111111111112",
        }),
      (e) => e instanceof KaminoWritePolicyError && e.code === "WRITE_DISABLED"
    );
  });

  it("rejects amount above max", () => {
    assert.throws(
      () =>
        assertRepayDryRunAllowed(cfg({ kaminoMaxRepayUi: "10" }), {
          amountUi: "11",
          repayMint: "So11111111111111111111111111111111111111112",
        }),
      (e) => e instanceof KaminoWritePolicyError && e.code === "AMOUNT_EXCEEDS_MAX"
    );
  });

  it("rejects mint not in allowlist", () => {
    const allow = new Set(["Mint111111111111111111111111111111111111111"]);
    assert.throws(
      () =>
        assertRepayDryRunAllowed(
          cfg({ kaminoAllowedRepayMints: allow }),
          {
            amountUi: "1",
            repayMint: "Mint222222222222222222222222222222222222222",
          }
        ),
      (e) => e instanceof KaminoWritePolicyError && e.code === "MINT_NOT_ALLOWED"
    );
  });

  it("allows valid request", () => {
    assertRepayDryRunAllowed(cfg(), {
      amountUi: "1.5",
      repayMint: "So11111111111111111111111111111111111111112",
    });
  });
});
