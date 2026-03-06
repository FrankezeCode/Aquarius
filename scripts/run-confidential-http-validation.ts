import "dotenv/config";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { buildApp } from "../apps/api/src/app.js";
import { requestAction } from "../apps/api/src/protocols/aave/action-layer/escalation.service.js";

interface DispatchPayload {
  workflowId: string;
  chainId: string;
  timestamp: number;
  data: {
    agentId: string;
    actionType: string;
    composite: number;
    correlationId: string;
    confidential: boolean;
    metadata: Record<string, unknown>;
    callbackUrl?: string;
  };
}

interface ValidationArtifact {
  success: boolean;
  startedAt: string;
  finishedAt: string;
  dispatchReceived: boolean;
  dispatchAuthorized: boolean;
  callbackStatusCode?: number;
  callbackBody?: unknown;
  workflowId: string;
  correlationId?: string;
  notes: string[];
}

const CALLBACK_WORKFLOW = process.env.CRE_CONFIDENTIAL_WORKFLOW_ID ?? "aave-risk-confidential-http";
const EXPECTED_TOKEN = "local-confidential-token";

async function waitFor(predicate: () => boolean, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Timeout waiting for condition after ${timeoutMs}ms`);
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 25));
  }
}

async function main(): Promise<void> {
  const artifact: ValidationArtifact = {
    success: false,
    startedAt: new Date().toISOString(),
    finishedAt: "",
    dispatchReceived: false,
    dispatchAuthorized: false,
    workflowId: CALLBACK_WORKFLOW,
    notes: [],
  };

  const app = await buildApp();
  await app.listen({ port: 0, host: "127.0.0.1" });
  const appAddress = app.server.address() as AddressInfo;
  const apiBaseUrl = `http://127.0.0.1:${appAddress.port}`;

  let dispatchPayload: DispatchPayload | null = null;
  let callbackStatusCode: number | undefined;
  let callbackBody: unknown;

  const confidentialServer = createServer(async (req, res) => {
    if (req.method !== "POST" || req.url !== "/dispatch") {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: "not_found" }));
      return;
    }

    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    await new Promise((resolveDone) => req.on("end", resolveDone));

    const raw = Buffer.concat(chunks).toString("utf8");
    const auth = req.headers.authorization;
    const authorized = auth === `Bearer ${EXPECTED_TOKEN}`;
    artifact.dispatchAuthorized = authorized;

    if (!authorized) {
      res.statusCode = 401;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: "unauthorized" }));
      return;
    }

    try {
      dispatchPayload = JSON.parse(raw) as DispatchPayload;
      artifact.dispatchReceived = true;
      artifact.correlationId = dispatchPayload.data.correlationId;
    } catch {
      res.statusCode = 400;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: "invalid_json" }));
      return;
    }

    const callbackUrl =
      dispatchPayload.data.callbackUrl ?? `${apiBaseUrl}/api/internal/ingest/cre-webhook`;
    const callbackResponse = await fetch(callbackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workflowId: dispatchPayload.workflowId,
        timestamp: Date.now(),
        chainId: dispatchPayload.chainId,
        data: {
          confidential: true,
          source: "confidential-http",
          correlationId: dispatchPayload.data.correlationId,
        },
      }),
    });

    callbackStatusCode = callbackResponse.status;
    try {
      callbackBody = await callbackResponse.json();
    } catch {
      callbackBody = { parse: "failed" };
    }

    res.statusCode = 200;
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        requestId: `req-${Date.now()}`,
        accepted: true,
        confidential: true,
      })
    );
  });

  await new Promise<void>((resolveReady) => {
    confidentialServer.listen(0, "127.0.0.1", () => resolveReady());
  });

  const confidentialAddress = confidentialServer.address() as AddressInfo;
  const confidentialUrl = `http://127.0.0.1:${confidentialAddress.port}/dispatch`;

  const previousEnv = {
    url: process.env.CRE_CONFIDENTIAL_HTTP_URL,
    token: process.env.CRE_CONFIDENTIAL_HTTP_TOKEN,
    workflow: process.env.CRE_CONFIDENTIAL_WORKFLOW_ID,
    callback: process.env.CRE_CONFIDENTIAL_CALLBACK_URL,
    timeout: process.env.CRE_CONFIDENTIAL_HTTP_TIMEOUT_MS,
  };

  process.env.CRE_CONFIDENTIAL_HTTP_URL = confidentialUrl;
  process.env.CRE_CONFIDENTIAL_HTTP_TOKEN = EXPECTED_TOKEN;
  process.env.CRE_CONFIDENTIAL_WORKFLOW_ID = CALLBACK_WORKFLOW;
  process.env.CRE_CONFIDENTIAL_CALLBACK_URL = `${apiBaseUrl}/api/internal/ingest/cre-webhook`;
  process.env.CRE_CONFIDENTIAL_HTTP_TIMEOUT_MS = "5000";

  try {
    const escalation = requestAction({
      agentId: "validation-agent",
      scope: "risk-actions",
      actionType: "ESCALATE",
      chainId: "ethereum",
      composite: 0.93,
      metadata: {
        reason: "deadline-confidential-http-validation",
        wallet: "0x0000000000000000000000000000000000000001",
      },
    });

    if (!escalation.dispatched) {
      throw new Error(`Escalation action was denied: ${escalation.reason}`);
    }
    artifact.notes.push("Escalation action dispatched through live action-layer path.");

    await waitFor(() => artifact.dispatchReceived, 5000);
    await waitFor(() => typeof callbackStatusCode === "number", 5000);

    artifact.callbackStatusCode = callbackStatusCode;
    artifact.callbackBody = callbackBody;

    const callbackRecord = callbackBody as Record<string, unknown>;
    const ingestionMode = callbackRecord?.ingestionMode;
    if (callbackStatusCode !== 200) {
      throw new Error(`Webhook callback failed with status ${callbackStatusCode}`);
    }
    if (ingestionMode !== "confidential-http") {
      throw new Error(`Unexpected ingestion mode: ${String(ingestionMode)}`);
    }

    artifact.notes.push("Confidential HTTP dispatch accepted by private endpoint.");
    artifact.notes.push("Webhook callback processed by internal CRE ingest route.");
    artifact.notes.push("Ingestion mode confirmed as confidential-http.");
    artifact.success = true;
  } finally {
    process.env.CRE_CONFIDENTIAL_HTTP_URL = previousEnv.url;
    process.env.CRE_CONFIDENTIAL_HTTP_TOKEN = previousEnv.token;
    process.env.CRE_CONFIDENTIAL_WORKFLOW_ID = previousEnv.workflow;
    process.env.CRE_CONFIDENTIAL_CALLBACK_URL = previousEnv.callback;
    process.env.CRE_CONFIDENTIAL_HTTP_TIMEOUT_MS = previousEnv.timeout;

    confidentialServer.close();
    await app.close();

    artifact.finishedAt = new Date().toISOString();
    const artifactDir = resolve(process.cwd(), "artifacts");
    await mkdir(artifactDir, { recursive: true });
    const artifactPath = resolve(artifactDir, "confidential-http-validation.json");
    await writeFile(artifactPath, JSON.stringify(artifact, null, 2), "utf8");

    console.log("Confidential HTTP validation result:");
    console.log(JSON.stringify(artifact, null, 2));
    console.log(`Artifact written to: ${artifactPath}`);
  }
}

main().catch((error) => {
  console.error("Confidential HTTP validation failed:", error);
  process.exit(1);
});
