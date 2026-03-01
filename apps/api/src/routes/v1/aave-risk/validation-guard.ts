import type { FastifyReply } from "fastify";
import {
  getTenderlyValidationError,
  resolveDataProviderMode,
} from "../../../adapters/providerFactory.js";

let warned = false;

export function assertAaveValidationMode(reply: FastifyReply): boolean {
  const error = getTenderlyValidationError();
  if (!error) return true;

  if (!warned) {
    warned = true;
    console.warn(`[aave-validation] ${error}`);
  }

  reply.status(503).send({
    error: "AAVE_VALIDATION_MODE_BLOCKED",
    message: error,
    dataProviderMode: resolveDataProviderMode(),
  });
  return false;
}

export function assertTenderlyBindingMode(reply: FastifyReply): boolean {
  if (process.env.AAVE_VALIDATION_REQUIRE_TENDERLY !== "1") {
    reply.status(503).send({
      error: "BINDING_VALIDATION_FLAG_REQUIRED",
      message:
        "Phase B binding requires AAVE_VALIDATION_REQUIRE_TENDERLY=1 during validation runs.",
    });
    return false;
  }
  const mode = resolveDataProviderMode();
  if (mode !== "tenderly") {
    reply.status(503).send({
      error: "BINDING_TENDERLY_MODE_REQUIRED",
      message: `Phase B binding requires DATA_PROVIDER_MODE=tenderly, got "${mode}".`,
      dataProviderMode: mode,
    });
    return false;
  }
  return true;
}
