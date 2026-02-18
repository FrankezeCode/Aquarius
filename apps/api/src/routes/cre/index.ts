/**
 * CRE Route — /api/cre/run
 *
 * Infrastructure layer: thin HTTP wrapper around runCREWorkflow().
 * No business logic. No risk scoring. No agent decisions.
 */

import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import {
  runCREWorkflow,
} from "../../../../../packages/domain/cre/run-cre-workflow.js";

export async function registerCRERoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/run", async (_request, reply) => {
    const result = await runCREWorkflow({
      chainId: "ethereum",
      positionLimit: 50,
      enableLLM: !!process.env.GROQ_API_KEY,
      groqApiKey: process.env.GROQ_API_KEY,
    });

    return reply.status(200).send(result);
  });
}
