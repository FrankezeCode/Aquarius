import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { CREWorkflowResult } from "../../../../packages/domain/cre/run-cre-workflow.js";
import {
  CreOrchestrationAdapter,
  type CreWorkflowRunner,
} from "../../src/infrastructure/orchestration/cre-orchestration.adapter.js";
import { createAaveVaultIntentExecutor } from "../../src/infrastructure/orchestration/vault-intent-executor.factory.js";
import { MemoryOrchestrationJobStore } from "../../src/infrastructure/orchestration/memory-orchestration-job-store.js";
import type { OrchestrationPort } from "../../src/application/ports/orchestration.port.js";

function fakeResult(): CREWorkflowResult {
  return {
    protocolStatus: "stable",
    riskScore: {
      composite: 0,
      level: "safe",
      summary: "test",
      dimensions: [],
      sampleSize: 0,
    },
    riskFactors: [],
    riskProgression: {
      stage: "info",
      accumulator: 0,
      convergenceSignals: [],
      enteredAt: Date.now(),
      transitionReason: "test",
      lastAction: null,
      actionRequired: "none",
    },
    agentDecision: {
      decision: "hold",
      confidence: 0.9,
      actionsRequested: [],
      blackSwanDetected: false,
    },
    actionDispatch: { dispatched: [] },
    latencies: { risk: 0, agent: 0, action: 0, total: 0 },
    events: [],
    timestamp: Date.now(),
  };
}

const testVaultExecutor = createAaveVaultIntentExecutor();

describe("CreOrchestrationAdapter", () => {
  it("submitIntent stores completed result and getJobStatus returns it", async () => {
    const runner: CreWorkflowRunner = async () => fakeResult();
    const adapter = new CreOrchestrationAdapter({
      runWorkflow: runner,
      vaultIntentExecutor: testVaultExecutor,
    });
    const { jobId, status } = await adapter.submitIntent({
      type: "cre.workflow",
      options: {},
    });
    assert.equal(status, "completed");
    const stored = await adapter.getJobStatus(jobId);
    assert.ok(stored);
    assert.equal(stored.status, "completed");
    assert.ok(stored.result);
  });

  it("submitIntent records failed when runner throws", async () => {
    const adapter = new CreOrchestrationAdapter({
      runWorkflow: async () => {
        throw new Error("boom");
      },
    });
    const { jobId, status } = await adapter.submitIntent({
      type: "cre.workflow",
      options: {},
    });
    assert.equal(status, "failed");
    const stored = await adapter.getJobStatus(jobId);
    assert.ok(stored);
    assert.equal(stored.status, "failed");
    assert.ok(stored.error);
  });

  it("submitIntent vault.intent uses chain in mock mode without calling runner", async () => {
    let called = false;
    const adapter = new CreOrchestrationAdapter({
      executionMode: "mock",
      runWorkflow: async () => {
        called = true;
        return fakeResult();
      },
      vaultIntentExecutor: testVaultExecutor,
    });
    const { jobId, status } = await adapter.submitIntent({
      type: "vault.intent",
      envelope: {
        intentType: "cre.workflow",
        chain: "ethereum",
        asset: "USDC",
        amount: "1",
        idempotencyKey: "k",
        correlationId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        creChainId: "ethereum",
        normalizedAsset: "USDC",
      },
    });
    assert.equal(status, "completed");
    assert.equal(called, false);
    assert.ok((await adapter.getJobStatus(jobId))?.result?.riskScore.summary?.includes("mock"));
  });

  it("getJobStatus returns null for unknown job id", async () => {
    const adapter = new CreOrchestrationAdapter({
      runWorkflow: async () => fakeResult(),
      jobStore: new MemoryOrchestrationJobStore(),
      vaultIntentExecutor: testVaultExecutor,
    });
    const out = await adapter.getJobStatus("00000000-0000-0000-0000-000000000000");
    assert.equal(out, null);
  });

  it("submitIntent pos.delegate mock completes with pos_delegate trace", async () => {
    const adapter = new CreOrchestrationAdapter({
      executionMode: "mock",
      jobStore: new MemoryOrchestrationJobStore(),
      vaultIntentExecutor: testVaultExecutor,
    });
    const { jobId, status, workflowDefinitionId } = await adapter.submitIntent({
      type: "vault.intent",
      envelope: {
        intentType: "pos.delegate",
        chain: "sepolia",
        asset: "ETH",
        amount: "0",
        idempotencyKey: "pos-k1",
        correlationId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
        creChainId: "sepolia",
        normalizedAsset: "ETH",
        validatorAddress: "0x2222222222222222222222222222222222222222",
      },
    });
    assert.equal(status, "completed");
    assert.equal(workflowDefinitionId, "pos-partner-delegate");
    const done = await adapter.getJobStatus(jobId);
    assert.equal(done?.result?.vaultTrace?.command, "pos_delegate");
  });

  it("vault.intent live returns running then completes asynchronously", async () => {
    const store = new MemoryOrchestrationJobStore();
    const adapter = new CreOrchestrationAdapter({
      executionMode: "live",
      jobStore: store,
      runWorkflow: async () => {
        await new Promise((r) => setTimeout(r, 15));
        return fakeResult();
      },
      vaultIntentExecutor: testVaultExecutor,
    });
    const r = await adapter.submitIntent({
      type: "vault.intent",
      envelope: {
        intentType: "cre.workflow",
        chain: "ethereum",
        asset: "USDC",
        amount: "1",
        idempotencyKey: "k2",
        correlationId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        creChainId: "ethereum",
        normalizedAsset: "USDC",
      },
    });
    assert.equal(r.status, "running");
    assert.equal(r.workflowDefinitionId, "aave-risk-monitor");
    await new Promise((r) => setTimeout(r, 50));
    const done = await adapter.getJobStatus(r.jobId);
    assert.equal(done?.status, "completed");
    assert.ok(done?.result);
  });
});

describe("OrchestrationPort mock", () => {
  it("can be implemented as a test double for route tests", async () => {
    const mock: OrchestrationPort = {
      async submitIntent() {
        return {
          jobId: "test-job",
          status: "completed",
          result: fakeResult(),
        };
      },
      async getJobStatus(id) {
        if (id === "test-job") {
          return {
            jobId: id,
            status: "completed",
            result: fakeResult(),
          };
        }
        return null;
      },
    };
    const r = await mock.submitIntent({ type: "cre.workflow", options: {} });
    assert.equal(r.jobId, "test-job");
    assert.equal((await mock.getJobStatus("test-job"))?.status, "completed");
  });
});
