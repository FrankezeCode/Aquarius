/**
 * Infrastructure Layer — Barrel Export
 *
 * Bounded context: Aave / Infrastructure
 *
 * Re-exports all infrastructure adapters.
 */

export {
  PublicCREAdapter,
  ConfidentialCREAdapter,
  ExecutionRouter,
} from "./execution/index.js";
