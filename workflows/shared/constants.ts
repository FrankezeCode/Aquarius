/**
 * Shared Workflow Constants
 *
 * Protocol-agnostic constants used across CRE workflows.
 */

/** Default retry attempts for workflow steps. */
export const DEFAULT_RETRY_COUNT = 3;

/** Default back-off base (ms) between retries. */
export const DEFAULT_BACKOFF_MS = 1000;

/** Maximum workflow execution time (ms) before timeout. */
export const MAX_WORKFLOW_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/** Supported workflow statuses. */
export const WORKFLOW_STATUSES = [
  "pending",
  "running",
  "completed",
  "failed",
] as const;

export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];
