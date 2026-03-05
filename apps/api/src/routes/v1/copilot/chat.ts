import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { CopilotContextAssembler } from "../../../services/copilot/context-assembler.js";
import { CopilotAdvisoryAgent } from "../../../services/copilot/advisory-agent.js";
import { parseCopilotChatRequest } from "../../../services/copilot/schema.js";
import { normalizeEthereumAddress } from "../aave-risk/address-normalizer.js";
import { logCopilotTelemetry } from "../../../services/copilot/telemetry.js";

const contextAssembler = new CopilotContextAssembler();
const advisoryAgent = new CopilotAdvisoryAgent();

export function createCopilotChatRoute() {
  return async function copilotChatPlugin(
    app: FastifyInstance,
    _opts: FastifyPluginOptions
  ) {
    app.post("/chat", async (request, reply) => {
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

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/0214f521-f1e1-4237-8c5f-e3cdc61c7a1b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'551096'},body:JSON.stringify({sessionId:'551096',runId:'pre-fix',hypothesisId:'H2',location:'apps/api/src/routes/v1/copilot/chat.ts:34',message:'Wallet normalization output type',data:{hasInput:!!body.walletAddress,walletAddressType:typeof walletAddress,walletAddressIsNull:walletAddress===null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion

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

