import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { loadConfig } from "../../../config/index.js";
import { getCreOrchestrationAdapter } from "../../../infrastructure/orchestration/index.js";
import { matchesVaultIntentBearer } from "./intent-bearer.js";

/**
 * GET /api/v1/vault-gateway/jobs/:jobId — poll orchestration status (Bearer auth).
 */
export async function registerVaultGatewayGetJob(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get<{
    Params: { jobId: string };
    Querystring: { includeResult?: string };
  }>("/jobs/:jobId", async (request, reply) => {
      const config = loadConfig();

      if (!config.vaultGatewayExecutionEnabled) {
        return reply.status(403).send({
          kind: "rejected",
          reasonCode: "EXECUTION_DISABLED",
          message: "Vault gateway execution is not enabled for this deployment.",
        });
      }

      if (
        !matchesVaultIntentBearer(
          request.headers.authorization,
          config.vaultGatewayIntentTokens
        )
      ) {
        return reply.status(401).send({
          kind: "rejected",
          reasonCode: "UNAUTHORIZED",
          message: "Missing or invalid credentials.",
        });
      }

      const { jobId } = request.params;
      const orchestration = getCreOrchestrationAdapter();
      const job = await orchestration.getJobStatus(jobId);
      if (!job) {
        return reply.status(404).send({
          kind: "rejected",
          reasonCode: "JOB_NOT_FOUND",
          message: "No job exists for this id.",
        });
      }

      const includeResult =
        String(request.query?.includeResult ?? "") === "true";

      return reply.send({
        kind: "status",
        jobId: job.jobId,
        correlationId: job.correlationId,
        status: job.status,
        workflowDefinitionId: job.workflowDefinitionId,
        externalWorkflowId: job.externalWorkflowId,
        error: job.status === "failed" ? job.error : undefined,
        ...(includeResult && job.result ? { result: job.result } : {}),
      });
  });
}
