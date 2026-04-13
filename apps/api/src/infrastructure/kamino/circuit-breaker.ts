/**
 * Minimal circuit breaker for Solana / Kamino RPC calls (process-local).
 */

export class CircuitOpenError extends Error {
  readonly code = "CIRCUIT_OPEN" as const;
  constructor(public readonly retryAfterMs: number) {
    super("Kamino RPC circuit is open; retry later.");
    this.name = "CircuitOpenError";
  }
}

export function createCircuitBreaker(options: {
  failureThreshold: number;
  openDurationMs: number;
  now?: () => number;
}) {
  const { failureThreshold, openDurationMs, now = () => Date.now() } = options;
  let consecutiveFailures = 0;
  let openUntil: number | null = null;

  return {
    /**
     * Runs `fn`. On success, resets failure count. On failure, increments; opens circuit after threshold.
     */
    async execute<T>(fn: () => Promise<T>): Promise<T> {
      const t = now();
      if (openUntil !== null && t < openUntil) {
        throw new CircuitOpenError(openUntil - t);
      }
      if (openUntil !== null && t >= openUntil) {
        openUntil = null;
        consecutiveFailures = 0;
      }

      try {
        const result = await fn();
        consecutiveFailures = 0;
        return result;
      } catch (err) {
        consecutiveFailures += 1;
        if (consecutiveFailures >= failureThreshold) {
          openUntil = now() + openDurationMs;
          consecutiveFailures = 0;
        }
        throw err;
      }
    },
  };
}
