import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { encodeFunctionResult } from "viem";

import { buildApp } from "../../../src/app.js";
import { AAVE_POOL_ABI, AAVE_ORACLE_ABI } from "../../../src/infrastructure/aave/abis.js";
import { ExecutionRouter } from "../../../src/infrastructure/execution/execution-router.js";

interface JsonRpcRequest {
  id: number;
  method: string;
  params?: unknown[];
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number;
  result?: unknown;
  error?: { code: number; message: string };
}

interface RpcState {
  accountReads: number;
  transactionCount: number;
  forceDelayMs: number;
}

function buildUserAccountDataResult(hf: bigint) {
  return encodeFunctionResult({
    abi: AAVE_POOL_ABI,
    functionName: "getUserAccountData",
    result: [
      250_000_000_000n, // totalCollateralBase (2500 USD @ 8dp)
      190_000_000_000n, // totalDebtBase (1900 USD @ 8dp)
      0n, // availableBorrowsBase
      8_000n, // currentLiquidationThreshold (80%)
      7_000n, // ltv (70%)
      hf,
    ],
  });
}

function buildAssetPriceResult() {
  return encodeFunctionResult({
    abi: AAVE_ORACLE_ABI,
    functionName: "getAssetPrice",
    result: 3_000_00000000n, // 3000 USD @ 8dp
  });
}

function createMockTenderlyRpcServer(state: RpcState) {
  return createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    await new Promise((resolve) => req.on("end", resolve));

    const payload = JSON.parse(Buffer.concat(chunks).toString("utf8")) as JsonRpcRequest;
    const method = payload.method;
    const params = payload.params ?? [];

    const response: JsonRpcResponse = {
      jsonrpc: "2.0",
      id: payload.id,
      result: null,
    };

    if (state.forceDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, state.forceDelayMs));
    }

    if (method === "eth_call") {
      const call = (params[0] ?? {}) as { data?: string };
      const selector = call.data?.slice(0, 10)?.toLowerCase();

      // getUserAccountData(address)
      if (selector === "0xbf92857c") {
        state.accountReads += 1;
        // First read = pre mitigation HF (unsafe), second read = post mitigation HF (improved)
        const hf = state.accountReads === 1 ? 1_020000000000000000n : 1_360000000000000000n;
        response.result = buildUserAccountDataResult(hf);
      } else if (selector === "0xb3596f07") {
        // getAssetPrice(address)
        response.result = buildAssetPriceResult();
      } else {
        response.error = { code: -32602, message: `Unsupported eth_call selector: ${selector}` };
      }
    } else if (
      method === "eth_sendTransaction" ||
      method === "tenderly_setBalance" ||
      method === "tenderly_setErc20Balance" ||
      method === "tenderly_setStorageAt" ||
      method === "evm_snapshot" ||
      method === "evm_revert"
    ) {
      if (method === "eth_sendTransaction") {
        state.transactionCount += 1;
        response.result = `0x${state.transactionCount.toString(16).padStart(64, "0")}`;
      } else if (method === "evm_snapshot") {
        response.result = "0x1";
      } else if (method === "evm_revert") {
        response.result = true;
      } else {
        response.result = true;
      }
    } else {
      response.error = { code: -32601, message: `Unsupported method: ${method}` };
    }

    res.statusCode = 200;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(response));
  });
}

async function postCallback(
  app: Awaited<ReturnType<typeof buildApp>>,
  correlationId: string,
  timestamp = Date.now()
) {
  return app.inject({
    method: "POST",
    url: "/api/internal/ingest/cre-webhook",
    payload: {
      workflowId: "aave-risk-confidential-http",
      timestamp,
      chainId: "ethereum",
      data: {
        confidential: true,
        source: "confidential-http",
        correlationId,
        agentId: "local-don-test-agent",
        actionType: "ESCALATE",
        composite: 0.92,
        metadata: {
          user: "0x1111111111111111111111111111111111111111",
          protocol: "aave",
        },
      },
    },
  });
}

describe("local_don_ccc callback → router → adapter integration", () => {
  it("executes callback handoff and rejects replay for same correlationId", async () => {
    const previousEnv = {
      mode: process.env.EXECUTION_MODE,
      rpc: process.env.TENDERLY_RPC_URL,
      maxAge: process.env.LOCAL_DON_CCC_CALLBACK_MAX_AGE_MS,
      replayTtl: process.env.LOCAL_DON_CCC_REPLAY_TTL_MS,
      timeout: process.env.LOCAL_DON_CCC_EXECUTION_TIMEOUT_MS,
      dataProvider: process.env.DATA_PROVIDER_MODE,
    };

    const rpcState: RpcState = { accountReads: 0, transactionCount: 0, forceDelayMs: 0 };
    const rpcServer = createMockTenderlyRpcServer(rpcState);

    await new Promise<void>((resolve) => rpcServer.listen(0, "127.0.0.1", () => resolve()));
    const rpcAddr = rpcServer.address() as AddressInfo;

    process.env.EXECUTION_MODE = "local_don_ccc";
    process.env.TENDERLY_RPC_URL = `http://127.0.0.1:${rpcAddr.port}`;
    process.env.LOCAL_DON_CCC_CALLBACK_MAX_AGE_MS = "60000";
    process.env.LOCAL_DON_CCC_REPLAY_TTL_MS = "600000";
    process.env.LOCAL_DON_CCC_EXECUTION_TIMEOUT_MS = "3000";
    process.env.DATA_PROVIDER_MODE = "mock";

    const app = await buildApp();
    const correlationId = `local-don-corr-${Date.now()}`;

    try {
      const first = await postCallback(app, correlationId);
      assert.equal(first.statusCode, 200);
      const firstBody = first.json() as Record<string, unknown>;
      assert.equal(firstBody.ingestionMode, "confidential-http");
      assert.equal(firstBody.correlationId, correlationId);
      assert.deepEqual(firstBody.localDonExecution, {
        status: "executed",
        mode: "local_don_ccc",
      });
      assert.ok(rpcState.transactionCount >= 2, "expected tx simulation calls through mock RPC");

      const replay = await postCallback(app, correlationId);
      assert.equal(replay.statusCode, 200);
      const replayBody = replay.json() as Record<string, unknown>;
      assert.deepEqual(replayBody.localDonExecution, {
        status: "replay-rejected",
        mode: "local_don_ccc",
      });
    } finally {
      await app.close();
      rpcServer.close();
      process.env.EXECUTION_MODE = previousEnv.mode;
      process.env.TENDERLY_RPC_URL = previousEnv.rpc;
      process.env.LOCAL_DON_CCC_CALLBACK_MAX_AGE_MS = previousEnv.maxAge;
      process.env.LOCAL_DON_CCC_REPLAY_TTL_MS = previousEnv.replayTtl;
      process.env.LOCAL_DON_CCC_EXECUTION_TIMEOUT_MS = previousEnv.timeout;
      process.env.DATA_PROVIDER_MODE = previousEnv.dataProvider;
    }
  });

  it("returns timeout status when execution exceeds local_don_ccc timeout", async () => {
    const previousEnv = {
      mode: process.env.EXECUTION_MODE,
      rpc: process.env.TENDERLY_RPC_URL,
      timeout: process.env.LOCAL_DON_CCC_EXECUTION_TIMEOUT_MS,
      dataProvider: process.env.DATA_PROVIDER_MODE,
    };
    const originalExecute = ExecutionRouter.prototype.execute;

    process.env.EXECUTION_MODE = "local_don_ccc";
    process.env.TENDERLY_RPC_URL = "http://127.0.0.1:65530";
    process.env.LOCAL_DON_CCC_EXECUTION_TIMEOUT_MS = "1";
    process.env.DATA_PROVIDER_MODE = "mock";

    ExecutionRouter.prototype.execute = async function delayedExecute() {
      await new Promise((resolve) => setTimeout(resolve, 30));
    };

    const app = await buildApp();

    try {
      const timedOut = await postCallback(app, `local-don-timeout-${Date.now()}`);
      assert.equal(timedOut.statusCode, 504);
      const body = timedOut.json() as Record<string, unknown>;
      assert.equal(body.error, "local_don_ccc execution timed out");
      assert.equal(body.executionMode, "local_don_ccc");
    } finally {
      ExecutionRouter.prototype.execute = originalExecute;
      await app.close();
      process.env.EXECUTION_MODE = previousEnv.mode;
      process.env.TENDERLY_RPC_URL = previousEnv.rpc;
      process.env.LOCAL_DON_CCC_EXECUTION_TIMEOUT_MS = previousEnv.timeout;
      process.env.DATA_PROVIDER_MODE = previousEnv.dataProvider;
    }
  });
});
