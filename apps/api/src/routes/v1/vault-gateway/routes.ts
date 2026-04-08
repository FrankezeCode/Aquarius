import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { getArchitectureManifest } from "../../../services/vault-gateway/manifest.js";
import { parseVaultRoutingQuery } from "../../../services/vault-gateway/schema.js";
import { resolveVaultRouting } from "../../../services/vault-gateway/router.js";

/**
 * Vault gateway — architecture manifest + advisory routing (no custody).
 *
 * GET /api/v1/vault-gateway/manifest
 * GET /api/v1/vault-gateway/routing?chain=&asset=
 */
export async function registerVaultGatewayRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/manifest", async (_request, reply) => {
    return reply.send(getArchitectureManifest());
  });

  app.get("/routing", async (request, reply) => {
    const q = request.query as Record<string, string | string[] | undefined>;
    const parsed = parseVaultRoutingQuery(q);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid query",
        message: parsed.message,
      });
    }

    try {
      const result = resolveVaultRouting(parsed.data.chain, parsed.data.asset);
      return reply.send(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return reply.status(400).send({
        error: "Routing unavailable",
        message,
      });
    }
  });
}
