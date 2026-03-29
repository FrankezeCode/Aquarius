import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { CopilotContextAssembler } from "../../../services/copilot/context-assembler.js";
import { CopilotAdvisoryAgent } from "../../../services/copilot/advisory-agent.js";
import { parseCopilotChatRequest } from "../../../services/copilot/schema.js";
import { normalizeEthereumAddress } from "../aave-risk/address-normalizer.js";
import { logCopilotTelemetry } from "../../../services/copilot/telemetry.js";

const contextAssembler = new CopilotContextAssembler();
const advisoryAgent = new CopilotAdvisoryAgent();

export function createCopilotChatRoute(opts?: {
  copilotRateLimitMax?: number;
}) {
  const routeOpts =
    opts?.copilotRateLimitMax != null && opts.copilotRateLimitMax > 0
      ? {
          config: {
            rateLimit: {
              max: opts.copilotRateLimitMax,
              timeWindow: "1 minute" as const,
            },
          },
        }
      : {};

  return async function copilotChatPlugin(
    app: FastifyInstance,
    _opts: FastifyPluginOptions
  ) {
    app.post("/chat", routeOpts, async (request, reply) => {
      const requestId = (request as { requestId?: string }).requestId ?? "unknown";
      const startedAt = Date.now();

      let body;
      try {
        body = parseCopilotChatRequest(request.body);
      } catch (err) {
        return reply.status(400).send({
          error: "Invalid request",
          message: err instanceof Error ? err.message : String(err),
        });
      }

      const walletAddress = body.walletAddress
        ? normalizeEthereumAddress(body.walletAddress)
        : undefined;
      const normalizedWalletAddress = walletAddress ?? undefined;

      if (body.walletAddress && !walletAddress) {
        return reply.status(400).send({
          error: "Invalid wallet address",
          message: "walletAddress must be a valid Ethereum address",
        });
      }

      try {
        const context = await contextAssembler.assemble({
          protocol: body.protocol,
          chain: body.chain,
          walletAddress: normalizedWalletAddress,
        });

        const response = await advisoryAgent.advise({
          context,
          question: body.question,
          conversation: body.conversation ?? [],
        });

        logCopilotTelemetry({
          requestId,
          protocol: body.protocol,
          chain: body.chain,
          contextAgeMs: Date.now() - context.contextTimestamp,
          modelLatencyMs: Date.now() - startedAt,
          fallbackUsed: !!response.fallbackUsed,
          status: response.fallbackUsed ? "fallback" : "ok",
        });

        return reply.send(response);
      } catch (err) {
        logCopilotTelemetry({
          requestId,
          protocol: body.protocol,
          chain: body.chain,
          modelLatencyMs: Date.now() - startedAt,
          status: "error",
        });
        return reply.status(500).send({
          error: "Copilot unavailable",
          message: err instanceof Error ? err.message : String(err),
        });
      }
    });
  };
}

