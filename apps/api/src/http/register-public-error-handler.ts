/**
 * Global Fastify error handler — stable JSON, no stack traces to clients (Phase 8).
 *
 * Contract: `{ error: string; message: string; requestId?: string }`
 */

import type {
  FastifyError,
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { PublicHttpError } from "./public-http-error.js";

function getRequestId(request: FastifyRequest): string | undefined {
  const id = (request as FastifyRequest & { requestId?: string }).requestId;
  return typeof id === "string" && id.length > 0 ? id : undefined;
}

export function registerPublicErrorHandler(app: FastifyInstance): void {
  app.setNotFoundHandler((request, reply) => {
    const requestId = getRequestId(request);
    request.log.info(
      { requestId, url: request.url, method: request.method },
      "route not found"
    );
    return reply.status(404).send({
      error: "NOT_FOUND",
      message: "Resource not found.",
      ...(requestId ? { requestId } : {}),
    });
  });

  app.setErrorHandler(
    (error: Error, request: FastifyRequest, reply: FastifyReply) => {
      const requestId = getRequestId(request);
      const log = request.log ?? app.log;

      log.error(
        { err: error, requestId, url: request.url, method: request.method },
        error?.message ?? "request error"
      );

      if (error instanceof PublicHttpError) {
        return reply.status(error.statusCode).send({
          error: error.errorCode,
          message: error.publicMessage,
          ...(requestId ? { requestId } : {}),
        });
      }

      const fe = error as FastifyError;
      if (Array.isArray(fe.validation) && fe.validation.length > 0) {
        return reply.status(400).send({
          error: "VALIDATION_ERROR",
          message: "Request validation failed.",
          ...(requestId ? { requestId } : {}),
        });
      }

      const code = typeof fe.code === "string" ? fe.code : "";
      if (code === "FST_ERR_NOT_FOUND") {
        return reply.status(404).send({
          error: "NOT_FOUND",
          message: "Resource not found.",
          ...(requestId ? { requestId } : {}),
        });
      }

      const status =
        typeof fe.statusCode === "number" && fe.statusCode >= 400
          ? fe.statusCode
          : 500;

      if (status === 429) {
        return reply.status(429).send({
          error: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Try again later.",
          ...(requestId ? { requestId } : {}),
        });
      }

      if (status >= 400 && status < 500) {
        const message =
          status === 404
            ? "Resource not found."
            : status === 401
              ? "Unauthorized."
              : status === 403
                ? "Forbidden."
                : "Request could not be completed.";
        return reply.status(status).send({
          error: code || "CLIENT_ERROR",
          message,
          ...(requestId ? { requestId } : {}),
        });
      }

      return reply.status(500).send({
        error: "INTERNAL_ERROR",
        message: "An unexpected error occurred.",
        ...(requestId ? { requestId } : {}),
      });
    }
  );
}
