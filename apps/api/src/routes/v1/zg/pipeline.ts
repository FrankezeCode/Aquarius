import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { loadZgConfig } from "../../../integrations/zg/config.js";
import { runZgPipeline } from "../../../integrations/zg/pipeline.js";
import { parseZgPipelineBody } from "../../../integrations/zg/schema.js";

/**
 * POST /api/v1/zg/pipeline — ZG-aligned intelligence pipeline (advisory only).
 */
export async function registerZgPipelineRoute(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.post("/pipeline", async (request, reply) => {
    const cfg = loadZgConfig();
    if (cfg.mode === "off") {
      return reply.status(503).send({
        error: "ZG_PIPELINE_DISABLED",
        message: "ZG pipeline is disabled (ZG_PIPELINE_MODE=off).",
      });
    }

    const parsed = parseZgPipelineBody(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid request",
        message: parsed.error.message,
      });
    }

    try {
      const result = await runZgPipeline(cfg, parsed.data);
      return reply.send({
        mode: result.mode,
        commitment: result.commitment,
        advisoryLine: result.advisoryLine,
        ...(result.inference && {
          inference: {
            model: result.inference.model,
            text: result.inference.text,
          },
        }),
        ...(result.storageBridge && { storageBridge: result.storageBridge }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return reply.status(502).send({
        error: "ZG_PIPELINE_FAILED",
        message,
      });
    }
  });
}
