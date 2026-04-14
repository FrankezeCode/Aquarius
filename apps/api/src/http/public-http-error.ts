/**
 * Explicit HTTP errors with safe client-facing messages (Phase 8).
 * Throw from route handlers when you need a stable `error` code without leaking internals.
 */
export class PublicHttpError extends Error {
  constructor(
    readonly statusCode: number,
    readonly errorCode: string,
    readonly publicMessage: string
  ) {
    super(publicMessage);
    this.name = "PublicHttpError";
    Object.setPrototypeOf(this, PublicHttpError.prototype);
  }
}
