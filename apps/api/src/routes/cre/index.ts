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
import {
  createMarketDataProvider,
  getTenderlyValidationError,
  resolveDataProviderMode,
} from "../../adapters/providerFactory.js";
import { registerCREDemoRoutes } from "./demo.js";
import { isAaveActiveChain, resolveAaveActiveChain } from "../v1/aave-risk/chain.js";

export async function registerCRERoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get<{ Querystring: { chain?: string } }>("/run", async (request, reply) => {
    const validationError = getTenderlyValidationError();
    if (validationError) {
      return reply.status(503).send({
        error: "AAVE_VALIDATION_MODE_BLOCKED",
        message: validationError,
        dataProviderMode: resolveDataProviderMode(),
      });
    }

    const requestedChain = request.query.chain?.toLowerCase();
    if (requestedChain && !isAaveActiveChain(requestedChain)) {
      return reply.status(400).send({
        error: "UNSUPPORTED_CHAIN",
        message: `Unsupported chain "${request.query.chain}". Supported chains: ethereum, polygon.`,
      });
    }
    const chainId = resolveAaveActiveChain(requestedChain);

    const provider = createMarketDataProvider();

    const result = await runCREWorkflow({
      provider,
      chainId,
      positionLimit: 50,
      enableLLM: !!process.env.GROQ_API_KEY,
      groqApiKey: process.env.GROQ_API_KEY,
    });

    return reply.status(200).send(result);
  });

  await app.register(registerCREDemoRoutes);
}
