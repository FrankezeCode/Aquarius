/**
 * Shared Workflow Utilities
 *
 * Common helpers used across all CRE workflows (aave-risk, uniswap-arb, etc.).
 * Keep this module dependency-free to avoid coupling workflows to each other.
 */

/**
 * Safely parse a JSON string, returning null on failure.
 */
export function safeJsonParse<T = unknown>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Sleep for a given duration (ms). Useful for retry/back-off logic.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a deterministic workflow run ID from components.
 */
export function workflowRunId(
  workflowName: string,
  timestamp: number
): string {
  return `${workflowName}-${timestamp}`;
}
