import { afterEach, describe, it } from "node:test";
import assert from "node:assert";
import { buildApp } from "../src/app.js";

const ENV_KEYS = [
  "PHASE_B_POLICY_BINDING",
  "AAVE_VALIDATION_REQUIRE_TENDERLY",
  "DATA_PROVIDER_MODE",
  "POLICY_BINDING_CONTRACT_ETHEREUM",
  "POLICY_BINDING_CONTRACT_POLYGON",
] as const;

const ENV_SNAPSHOT = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]])
) as Record<(typeof ENV_KEYS)[number], string | undefined>;

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (ENV_SNAPSHOT[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = ENV_SNAPSHOT[key];
    }
  }
});

describe("agent-enrollment phase B", () => {
  it("returns PHASE_B_DISABLED when feature flag is off", async () => {
    process.env.PHASE_B_POLICY_BINDING = "0";
    process.env.DATA_PROVIDER_MODE = "tenderly";
    process.env.AAVE_VALIDATION_REQUIRE_TENDERLY = "1";
    process.env.POLICY_BINDING_CONTRACT_ETHEREUM =
      "0x0000000000000000000000000000000000000001";

    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/agent-enrollment/bind-intent",
      payload: {
        walletAddress: "0x1111111111111111111111111111111111111111",
        chain: "ethereum",
        chainId: 1,
        idempotencyKey: "k-1",
      },
    });
    assert.strictEqual(res.statusCode, 503);
    const body = res.json() as { error: string };
    assert.strictEqual(body.error, "PHASE_B_DISABLED");
    await app.close();
  });

  it("enforces tenderly validation flag and mode gates", async () => {
    process.env.PHASE_B_POLICY_BINDING = "1";
    process.env.DATA_PROVIDER_MODE = "tenderly";
    process.env.AAVE_VALIDATION_REQUIRE_TENDERLY = "0";
    process.env.POLICY_BINDING_CONTRACT_ETHEREUM =
      "0x0000000000000000000000000000000000000001";

    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/agent-enrollment/bind-intent",
      payload: {
        walletAddress: "0x1111111111111111111111111111111111111111",
        chain: "ethereum",
        chainId: 1,
        idempotencyKey: "k-2",
      },
    });
    assert.strictEqual(res.statusCode, 503);
    const body = res.json() as { error: string };
    assert.strictEqual(body.error, "BINDING_VALIDATION_FLAG_REQUIRED");
    await app.close();
  });

  it("returns explicit error when data provider mode is not tenderly", async () => {
    process.env.PHASE_B_POLICY_BINDING = "1";
    process.env.DATA_PROVIDER_MODE = "mock";
    process.env.AAVE_VALIDATION_REQUIRE_TENDERLY = "1";
    process.env.POLICY_BINDING_CONTRACT_ETHEREUM =
      "0x0000000000000000000000000000000000000001";

    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/agent-enrollment/bind-intent",
      payload: {
        walletAddress: "0x1111111111111111111111111111111111111111",
        chain: "ethereum",
        chainId: 1,
        idempotencyKey: "k-2b",
      },
    });
    assert.strictEqual(res.statusCode, 503);
    const body = res.json() as { error: string; dataProviderMode?: string };
    assert.strictEqual(body.error, "AAVE_VALIDATION_MODE_BLOCKED");
    assert.strictEqual(body.dataProviderMode, "mock");
    await app.close();
  });

  it("runs draft -> bind-intent -> confirm-bind lifecycle", async () => {
    process.env.PHASE_B_POLICY_BINDING = "1";
    process.env.DATA_PROVIDER_MODE = "tenderly";
    process.env.AAVE_VALIDATION_REQUIRE_TENDERLY = "1";
    process.env.POLICY_BINDING_CONTRACT_ETHEREUM =
      "0x0000000000000000000000000000000000000001";

    const app = await buildApp();
    const wallet = "0x1111111111111111111111111111111111111111";

    const draftRes = await app.inject({
      method: "POST",
      url: "/api/v1/agent-enrollment",
      payload: {
        walletAddress: wallet,
        chain: "ethereum",
        mode: "alert_only",
        telegram: "risk_ops",
      },
    });
    assert.strictEqual(draftRes.statusCode, 200);

    const bindIntentRes = await app.inject({
      method: "POST",
      url: "/api/v1/agent-enrollment/bind-intent",
      payload: {
        walletAddress: wallet,
        chain: "ethereum",
        chainId: 1,
        idempotencyKey: "k-3",
      },
    });
    assert.strictEqual(bindIntentRes.statusCode, 200);
    const bindIntentBody = bindIntentRes.json() as {
      contractAddress: string;
      record: { policyBindingStatus: string };
    };
    assert.strictEqual(
      bindIntentBody.contractAddress,
      "0x0000000000000000000000000000000000000001"
    );
    assert.strictEqual(bindIntentBody.record.policyBindingStatus, "signing_requested");

    const confirmRes = await app.inject({
      method: "POST",
      url: "/api/v1/agent-enrollment/confirm-bind",
      payload: {
        walletAddress: wallet,
        chain: "ethereum",
        chainId: 1,
        idempotencyKey: "k-3",
        txHash:
          "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        finalStatus: "bound_onchain",
      },
    });
    assert.strictEqual(confirmRes.statusCode, 200);
    const confirmBody = confirmRes.json() as {
      policyBindingStatus: string;
      policyBindingRef: string | null;
      bindingChainId: number | null;
    };
    assert.strictEqual(confirmBody.policyBindingStatus, "bound_onchain");
    assert.strictEqual(
      confirmBody.policyBindingRef,
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    );
    assert.strictEqual(confirmBody.bindingChainId, 1);

    await app.close();
  });

  it("supports hard-fail flow: bind-intent can create draft when payload includes policy fields", async () => {
    process.env.PHASE_B_POLICY_BINDING = "1";
    process.env.DATA_PROVIDER_MODE = "tenderly";
    process.env.AAVE_VALIDATION_REQUIRE_TENDERLY = "1";
    process.env.POLICY_BINDING_CONTRACT_ETHEREUM =
      "0x0000000000000000000000000000000000000001";

    const app = await buildApp();
    const wallet = "0x2222222222222222222222222222222222222222";

    const bindIntentRes = await app.inject({
      method: "POST",
      url: "/api/v1/agent-enrollment/bind-intent",
      payload: {
        walletAddress: wallet,
        chain: "ethereum",
        chainId: 1,
        idempotencyKey: "k-4",
        mode: "mitigate_agent",
        telegram: "risk_ops",
        webhook: "https://example.com/webhook",
      },
    });
    assert.strictEqual(bindIntentRes.statusCode, 200);
    const bindIntentBody = bindIntentRes.json() as {
      record: { status: string; policyBindingStatus: string };
    };
    assert.strictEqual(bindIntentBody.record.status, "inactive");
    assert.strictEqual(bindIntentBody.record.policyBindingStatus, "signing_requested");
    await app.close();
  });

  it("runs deactivate-intent -> confirm-deactivate lifecycle to full disable", async () => {
    process.env.PHASE_B_POLICY_BINDING = "1";
    process.env.DATA_PROVIDER_MODE = "tenderly";
    process.env.AAVE_VALIDATION_REQUIRE_TENDERLY = "1";
    process.env.POLICY_BINDING_CONTRACT_ETHEREUM =
      "0x0000000000000000000000000000000000000001";

    const app = await buildApp();
    const wallet = "0x3333333333333333333333333333333333333333";

    const bindIntentRes = await app.inject({
      method: "POST",
      url: "/api/v1/agent-enrollment/bind-intent",
      payload: {
        walletAddress: wallet,
        chain: "ethereum",
        chainId: 1,
        idempotencyKey: "k-5",
        mode: "alert_only",
        telegram: "risk_ops",
      },
    });
    assert.strictEqual(bindIntentRes.statusCode, 200);

    const confirmBindRes = await app.inject({
      method: "POST",
      url: "/api/v1/agent-enrollment/confirm-bind",
      payload: {
        walletAddress: wallet,
        chain: "ethereum",
        chainId: 1,
        idempotencyKey: "k-5",
        txHash:
          "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        finalStatus: "bound_onchain",
      },
    });
    assert.strictEqual(confirmBindRes.statusCode, 200);

    const deactivateIntentRes = await app.inject({
      method: "POST",
      url: "/api/v1/agent-enrollment/deactivate-intent",
      payload: {
        walletAddress: wallet,
        chain: "ethereum",
        chainId: 1,
        idempotencyKey: "k-6",
      },
    });
    assert.strictEqual(deactivateIntentRes.statusCode, 200);

    const confirmDeactivateRes = await app.inject({
      method: "POST",
      url: "/api/v1/agent-enrollment/confirm-deactivate",
      payload: {
        walletAddress: wallet,
        chain: "ethereum",
        chainId: 1,
        idempotencyKey: "k-6",
        txHash:
          "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
      },
    });
    assert.strictEqual(confirmDeactivateRes.statusCode, 200);
    const body = confirmDeactivateRes.json() as {
      status: string;
      deactivationTxRef: string | null;
    };
    assert.strictEqual(body.status, "inactive");
    assert.strictEqual(
      body.deactivationTxRef,
      "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"
    );
    await app.close();
  });
});
