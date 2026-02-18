/**
 * Execution Port — Re-export from Shared Kernel
 *
 * Bounded context: Aave / Application Layer
 *
 * Re-exports the shared ExecutionPort, ExecutionContext, and RiskLevel
 * from the shared kernel. This file exists for backward compatibility
 * so that existing Aave-internal imports continue to resolve.
 *
 * New code should import directly from:
 *   ../../shared/types/execution-context.js
 *
 * DDD role: Re-export (delegates to Shared Kernel).
 */

export type { RiskLevel, ExecutionContext, ExecutionPort } from "../../../shared/types/execution-context.js";
