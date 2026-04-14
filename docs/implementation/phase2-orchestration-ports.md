# Phase 2 — Hexagonal orchestration ports (implementation guide)

**Status:** Spec ready for Agent-mode implementation (repo not modified with TS in Plan mode).

**Goal:** Isolate `runCREWorkflow` behind `OrchestrationPort` + `CreOrchestrationAdapter`; optional `VaultExecutionPort` façade; refactor CRE routes; unit tests with mocked port.

---

## Files to add

### 1. `apps/api/src/application/ports/orchestration.port.ts`

```typescript
/**
 * Orchestration port — single application boundary for CRE-backed workflows.
 *
 * All HTTP and protocol facades submit work through this port; implementations
 * delegate to Chainlink CRE (`runCREWorkflow`) per ADR 0003.
 *
 * DDD: Application port (hexagonal). No Fastify, no protocol scoring here.
 */

import type {
  CREWorkflowOptions,
  CREWorkflowResult,
} from "../../../../packages/domain/cre/run-cre-workflow.js";

/** Intent accepted by the orchestration rail (extend with vault intents in later phases). */
export type OrchestrationIntent = {
  readonly type: "cre.workflow";
  readonly options: CREWorkflowOptions;
};

export type OrchestrationJobStatus = "completed" | "failed" | "unknown";

export interface OrchestrationSubmitResult {
  readonly jobId: string;
  readonly status: OrchestrationJobStatus;
  readonly result?: CREWorkflowResult;
  readonly error?: string;
}

export interface OrchestrationPort {
  submitIntent(intent: OrchestrationIntent): Promise<OrchestrationSubmitResult>;
  getJobStatus(jobId: string): Promise<OrchestrationSubmitResult | null>;
}
```

### 2. `apps/api/src/application/ports/vault-execution.port.ts`

```typescript
/**
 * Vault execution port — optional façade over OrchestrationPort.
 */

import type {
  OrchestrationIntent,
  OrchestrationPort,
  OrchestrationSubmitResult,
} from "./orchestration.port.js";

export interface VaultExecutionPort {
  submitVaultIntent(intent: OrchestrationIntent): Promise<OrchestrationSubmitResult>;
  getVaultJobStatus(jobId: string): Promise<OrchestrationSubmitResult | null>;
}

export function createVaultExecutionPort(
  orchestration: OrchestrationPort
): VaultExecutionPort {
  return {
    submitVaultIntent: (intent) => orchestration.submitIntent(intent),
    getVaultJobStatus: (jobId) => orchestration.getJobStatus(jobId),
  };
}
```

### 3. `apps/api/src/application/ports/index.ts`

```typescript
export type {
  OrchestrationIntent,
  OrchestrationJobStatus,
  OrchestrationPort,
  OrchestrationSubmitResult,
} from "./orchestration.port.js";
export type { VaultExecutionPort } from "./vault-execution.port.js";
export { createVaultExecutionPort } from "./vault-execution.port.js";
```

### 4. `apps/api/src/infrastructure/orchestration/cre-orchestration.adapter.ts`

- Import `runCREWorkflow` from `packages/domain/cre/run-cre-workflow.js`.
- Class `CreOrchestrationAdapter implements OrchestrationPort`.
- `submitIntent`: if `intent.type !== "cre.workflow"` throw; else `await runCREWorkflow(intent.options)`, generate `jobId` (`cre-job-${crypto.randomUUID()}`), store `{ jobId, result }` in a `private readonly jobs = new Map<string, OrchestrationSubmitResult>()`, return `{ jobId, status: "completed", result }` or `{ jobId, status: "failed", error }` on catch.
- `getJobStatus`: return `this.jobs.get(jobId) ?? null`.
- Optional: cap Map size (e.g. max 500 entries) for long-running servers.

### 5. `apps/api/src/infrastructure/orchestration/index.ts`

```typescript
export { CreOrchestrationAdapter } from "./cre-orchestration.adapter.js";

export function createCreOrchestrationAdapter(): CreOrchestrationAdapter {
  return new CreOrchestrationAdapter();
}
```

---

## Files to refactor

### `apps/api/src/routes/cre/index.ts`

- Replace direct `runCREWorkflow` import with `createCreOrchestrationAdapter()` (module-level singleton or created once per plugin registration).
- `GET /run`: `await orchestration.submitIntent({ type: "cre.workflow", options: { provider, chainId, positionLimit: 50, enableLLM: !!process.env.GROQ_API_KEY, groqApiKey: process.env.GROQ_API_KEY } })` then `reply.send(submitted.result)` — preserve **identical** JSON shape (200 body = `CREWorkflowResult`).
- If `submitted.status === "failed"`, return 500 with error message.

### `apps/api/src/routes/cre/demo.ts`

- Replace three `runCREWorkflow` calls with `orchestration.submitIntent({ type: "cre.workflow", options: { provider, chainId: "ethereum", positionLimit: 10 } })` and use `submitted.result` as today.

---

## Tests

### `apps/api/tests/infrastructure/orchestration/cre-orchestration.adapter.test.ts`

- Mock `runCREWorkflow` via `vi.mock("../../../../../../packages/domain/cre/run-cre-workflow.js", ...)`.
- Assert `submitIntent` returns `jobId` and `getJobStatus` returns stored result.

### `apps/api/tests/application/orchestration-port-mock.test.ts` (optional)

- Define a fake `OrchestrationPort` and assert consumers can depend on interface only.

---

## Exit criteria checklist

- [ ] No `runCREWorkflow` import in `routes/cre/*.ts` (only adapter).
- [ ] `CreOrchestrationAdapter` in `infrastructure/orchestration/`.
- [ ] Unit test mocks `runCREWorkflow` or uses fake port.
- [ ] Behavior of `/api/cre/run` response unchanged for happy path.

---

## Note

`packages/domain/cre/run-cre-workflow.ts` remains the domain orchestration implementation; the **port** is the API boundary for `apps/api` routes. Protocol folders under `protocols/` do not currently import `runCREWorkflow`; no change required there for Phase 2.
