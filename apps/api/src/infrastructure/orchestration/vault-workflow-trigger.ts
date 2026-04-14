/**
 * Optional HTTP trigger to an external CRE / workflow gateway (staging).
 * Response shape is best-effort: `{ requestId?: string, workflowRunId?: string }`.
 */

export interface VaultWorkflowTriggerResult {
  readonly ok: boolean;
  readonly externalWorkflowId?: string;
  readonly errorMessage?: string;
}

export async function triggerVaultRemoteWorkflow(params: {
  readonly url: string;
  readonly token?: string;
  readonly workflowId: string;
  readonly chainId: string;
  readonly correlationId: string;
  readonly callbackUrl?: string;
  readonly timeoutMs: number;
}): Promise<VaultWorkflowTriggerResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), params.timeoutMs);
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Correlation-Id": params.correlationId,
    };
    if (params.token) {
      headers.Authorization = `Bearer ${params.token}`;
    }
    const body = {
      workflowId: params.workflowId,
      chainId: params.chainId,
      correlationId: params.correlationId,
      ...(params.callbackUrl ? { callbackUrl: params.callbackUrl } : {}),
      source: "aquarius-vault-gateway",
    };
    const res = await fetch(params.url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      return {
        ok: false,
        errorMessage: `HTTP ${res.status}`,
      };
    }
    let externalWorkflowId: string | undefined;
    try {
      const json = (await res.json()) as Record<string, unknown>;
      const rid =
        typeof json.requestId === "string"
          ? json.requestId
          : typeof json.workflowRunId === "string"
            ? json.workflowRunId
            : typeof json.id === "string"
              ? json.id
              : undefined;
      externalWorkflowId = rid;
    } catch {
      // empty body ok
    }
    return { ok: true, externalWorkflowId };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, errorMessage: message };
  } finally {
    clearTimeout(timer);
  }
}
