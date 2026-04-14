/**
 * Internal callback for external CRE / workflow runners to mark vault jobs completed or failed.
 *
 * POST /api/internal/vault-gateway/cre-job-callback
 * Header: X-Vault-Job-Secret (must match INTERNAL_VAULT_JOB_CALLBACK_SECRET)
 */

import { timingSafeEqual } from "node:crypto";
import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { z } from "zod";
import { loadConfig } from "../../../config/index.js";
import { getOrchestrationJobStore } from "../../../infrastructure/orchestration/orchestration-job-store.singleton.js";

const bodySchema = z.object({
  jobId: z.string().trim().min(1).max(256),
  status: z.enum(["completed", "failed"]),
  error: z.string().max(4096).optional(),
});

export async function registerVaultJobCallbackRoute(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.post("/cre-job-callback", async (request, reply) => {
    const cfg = loadConfig();
    const expected = cfg.internalVaultJobCallbackSecret;
    if (!expected) {
      return reply.status(503).send({
        error: "CALLBACK_NOT_CONFIGURED",
        message: "INTERNAL_VAULT_JOB_CALLBACK_SECRET is not set.",
      });
    }

    const presented = request.headers["x-vault-job-secret"];
    const secret = typeof presented === "string" ? presented.trim() : "";
    const a = Buffer.from(secret, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return reply.status(401).send({
        error: "UNAUTHORIZED",
        message: "Invalid or missing X-Vault-Job-Secret.",
      });
    }

    const parsed = bodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "INVALID_BODY",
        message: parsed.error.message,
      });
    }

    const { jobId, status, error } = parsed.data;
    const store = getOrchestrationJobStore();
    const job = await store.getJob(jobId);
    if (!job) {
      return reply.status(404).send({
        error: "JOB_NOT_FOUND",
        message: "Unknown job id.",
      });
    }

    if (job.status !== "running" && job.status !== "pending") {
      return reply.status(409).send({
        error: "INVALID_STATE",
        message: `Job is not updatable from callback (status=${job.status}).`,
      });
    }

    if (status === "failed") {
      await store.patchJob(jobId, {
        status: "failed",
        error: error ?? "Marked failed by callback",
      });
    } else {
      await store.patchJob(jobId, {
        status: "completed",
        error: undefined,
      });
    }

    return reply.send({ ok: true, jobId });
  });
}
