/**
 * Kamino → CRE webhook: synthetic payload + local_don_ccc correlation (no Solana RPC).
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../../src/app.js";

const syntheticSnapshot = {
  metadata: {
    protocol: "kamino" as const,
    chainId: 0 as const,
    timestamp: 1_700_000_000_000,
    solanaCluster: "devnet" as const,
  },
  wallet: "11111111111111111111111111111112",
  marketPubkey: "So11111111111111111111111111111111111111112",
  loanToValuePct: 55,
  reserveLabels: ["SOL", "USDC"],
  riskScore: 55,
  severity: "medium" as const,
};

const syntheticIntelligence = {
  domain: "kamino-solana" as const,
  stage: "confirm" as const,
  composite01: 0.55,
  headline: "Test headline",
  summary: "Test summary",
  events: [
    {
      id: "e1",
      timestamp: new Date(1_700_000_000_000).toISOString(),
      message: "evt",
      severity: "warning" as const,
    },
  ],
};

async function postKaminoCallback(
  app: Awaited<ReturnType<typeof buildApp>>,
  correlationId: string,
  timestamp = Date.now()
) {
  return app.inject({
    method: "POST",
    url: "/api/internal/ingest/cre-webhook",
    payload: {
      workflowId: "kamino-risk-confidential-http",
      timestamp,
      chainId: "solana-devnet",
      data: {
        synthetic: true,
        confidential: true,
        correlationId,
        agentId: "kamino-local-don-test",
        snapshot: syntheticSnapshot,
        intelligence: syntheticIntelligence,
      },
    },
  });
}

describe("Kamino CRE webhook (synthetic + local_don_ccc)", () => {
  it("executes mitigation and rejects replay for same correlationId", async () => {
    const previousEnv = {
      mode: process.env.EXECUTION_MODE,
      maxAge: process.env.LOCAL_DON_CCC_CALLBACK_MAX_AGE_MS,
      replayTtl: process.env.LOCAL_DON_CCC_REPLAY_TTL_MS,
      timeout: process.env.LOCAL_DON_CCC_EXECUTION_TIMEOUT_MS,
    };

    process.env.EXECUTION_MODE = "local_don_ccc";
    process.env.LOCAL_DON_CCC_CALLBACK_MAX_AGE_MS = "60000";
    process.env.LOCAL_DON_CCC_REPLAY_TTL_MS = "600000";
    process.env.LOCAL_DON_CCC_EXECUTION_TIMEOUT_MS = "3000";

    const app = await buildApp();
    const correlationId = `kamino-corr-${Date.now()}`;

    try {
      const first = await postKaminoCallback(app, correlationId);
      assert.equal(first.statusCode, 200);
      const firstBody = first.json() as Record<string, unknown>;
      assert.equal(firstBody.status, "processed");
      assert.equal(firstBody.domain, "kamino-solana");
      assert.deepEqual(firstBody.localDonExecution, {
        status: "executed",
        mode: "local_don_ccc",
      });
      const esc = firstBody.escalation as { stage: string };
      assert.equal(esc.stage, "confirm");
      assert.deepEqual(firstBody.snapshotFreshness, { live: true });

      const second = await postKaminoCallback(app, correlationId);
      assert.equal(second.statusCode, 200);
      const secondBody = second.json() as Record<string, unknown>;
      assert.deepEqual(secondBody.localDonExecution, {
        status: "replay-rejected",
        mode: "local_don_ccc",
      });
    } finally {
      process.env.EXECUTION_MODE = previousEnv.mode;
      process.env.LOCAL_DON_CCC_CALLBACK_MAX_AGE_MS = previousEnv.maxAge;
      process.env.LOCAL_DON_CCC_REPLAY_TTL_MS = previousEnv.replayTtl;
      process.env.LOCAL_DON_CCC_EXECUTION_TIMEOUT_MS = previousEnv.timeout;
    }
  });
});
