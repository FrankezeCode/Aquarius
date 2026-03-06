import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

import { buildApp } from "../../../src/app.js";
import { requestAction } from "../../../src/protocols/aave/action-layer/escalation.service.js";

interface DispatchBody {
  workflowId: string;
  chainId: string;
  timestamp: number;
  data: {
    correlationId: string;
    callbackUrl?: string;
  };
}

async function waitFor(predicate: () => boolean, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Timed out after ${timeoutMs}ms`);
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

describe("Confidential HTTP live-path integration", () => {
  it("dispatches confidential payload and processes webhook callback end-to-end", async () => {
    const expectedToken = "test-confidential-token";
    const previousEnv = {
      url: process.env.CRE_CONFIDENTIAL_HTTP_URL,
      token: process.env.CRE_CONFIDENTIAL_HTTP_TOKEN,
      workflow: process.env.CRE_CONFIDENTIAL_WORKFLOW_ID,
      callback: process.env.CRE_CONFIDENTIAL_CALLBACK_URL,
      timeout: process.env.CRE_CONFIDENTIAL_HTTP_TIMEOUT_MS,
    };

    const app = await buildApp();
    await app.listen({ host: "127.0.0.1", port: 0 });
    const appAddress = app.server.address() as AddressInfo;
    const apiBase = `http://127.0.0.1:${appAddress.port}`;

    let receivedDispatch: DispatchBody | null = null;
    let callbackStatus = 0;
    let callbackJson: Record<string, unknown> | null = null;

    const privateEndpoint = createServer(async (req, res) => {
      if (req.method !== "POST" || req.url !== "/dispatch") {
        res.statusCode = 404;
        res.end();
        return;
      }

      const chunks: Buffer[] = [];
      req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      await new Promise((resolve) => req.on("end", resolve));

      assert.equal(req.headers.authorization, `Bearer ${expectedToken}`);

      receivedDispatch = JSON.parse(Buffer.concat(chunks).toString("utf8")) as DispatchBody;
      const callbackUrl = receivedDispatch.data.callbackUrl ?? `${apiBase}/api/internal/ingest/cre-webhook`;
      const callbackRes = await fetch(callbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId: receivedDispatch.workflowId,
          timestamp: Date.now(),
          chainId: receivedDispatch.chainId,
          data: {
            confidential: true,
            source: "confidential-http",
            correlationId: receivedDispatch.data.correlationId,
          },
        }),
      });
      callbackStatus = callbackRes.status;
      callbackJson = (await callbackRes.json()) as Record<string, unknown>;

      res.statusCode = 200;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ requestId: "req-test-1", accepted: true }));
    });

    await new Promise<void>((resolve) => {
      privateEndpoint.listen(0, "127.0.0.1", () => resolve());
    });
    const privateAddress = privateEndpoint.address() as AddressInfo;

    process.env.CRE_CONFIDENTIAL_HTTP_URL = `http://127.0.0.1:${privateAddress.port}/dispatch`;
    process.env.CRE_CONFIDENTIAL_HTTP_TOKEN = expectedToken;
    process.env.CRE_CONFIDENTIAL_WORKFLOW_ID = "aave-risk-confidential-http";
    process.env.CRE_CONFIDENTIAL_CALLBACK_URL = `${apiBase}/api/internal/ingest/cre-webhook`;
    process.env.CRE_CONFIDENTIAL_HTTP_TIMEOUT_MS = "5000";

    try {
      const result = requestAction({
        agentId: "integration-agent",
        scope: "risk-actions",
        actionType: "ESCALATE",
        chainId: "ethereum",
        composite: 0.9,
        metadata: { reason: "integration-test" },
      });

      assert.equal(result.dispatched, true);
      await waitFor(() => receivedDispatch !== null, 3000);
      await waitFor(() => callbackStatus > 0, 3000);

      assert.equal(receivedDispatch?.workflowId, "aave-risk-confidential-http");
      assert.equal(callbackStatus, 200);
      assert.equal(callbackJson?.status, "processed");
      assert.equal(callbackJson?.ingestionMode, "confidential-http");
      assert.equal(
        callbackJson?.correlationId,
        receivedDispatch?.data.correlationId
      );
    } finally {
      process.env.CRE_CONFIDENTIAL_HTTP_URL = previousEnv.url;
      process.env.CRE_CONFIDENTIAL_HTTP_TOKEN = previousEnv.token;
      process.env.CRE_CONFIDENTIAL_WORKFLOW_ID = previousEnv.workflow;
      process.env.CRE_CONFIDENTIAL_CALLBACK_URL = previousEnv.callback;
      process.env.CRE_CONFIDENTIAL_HTTP_TIMEOUT_MS = previousEnv.timeout;

      privateEndpoint.close();
      await app.close();
    }
  });
});
