/**
 * CRE Routes — /api/cre/*
 *
 * Infrastructure layer: thin HTTP wrappers around CRE orchestration.
 * No business logic. No risk scoring. No agent decisions.
 *
 * GET  /run  — continuous monitoring endpoint (polled by frontend)
 * POST /demo — full Tenderly CRE + CCC simulation demo
 */

import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import {
  runCREWorkflow,
} from "../../../../../packages/domain/cre/run-cre-workflow.js";
import { createMarketDataProvider } from "../../adapters/providerFactory.js";
import { registerCREDemoRoutes } from "./demo.js";

export async function registerCRERoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/run", async (_request, reply) => {
    const provider = createMarketDataProvider();

    const result = await runCREWorkflow({
      provider,
      chainId: "ethereum",
      positionLimit: 50,
      enableLLM: !!process.env.GROQ_API_KEY,
      groqApiKey: process.env.GROQ_API_KEY,
    });

    return reply.status(200).send(result);
  });

  await app.register(registerCREDemoRoutes);
}
