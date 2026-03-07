/**
 * CCC — Execution Factory (Infrastructure Only)
 *
 * Creates the appropriate CCC execution adapter based on
 * the EXECUTION_MODE environment variable.
 *
 * Supported modes:
 *   - "simulated_ccc" → CccExecutionAdapter (Tenderly fork)
 *   - "local_don_ccc" → CccExecutionAdapter (callback-driven local DON simulation path)
 *   - "real_ccc"       → Future Chainlink DON integration
 *
 * Note:
 * local_don_ccc currently reuses the same adapter implementation as simulated_ccc.
 * The semantic difference lives in the ingress path:
 *   confidential callback -> correlation guards -> ExecutionRouter handoff.
 * This factory only ensures the adapter dependency exists for both modes.
 */

import { CccExecutionAdapter } from "./CccExecutionAdapter.js";
import type { ExecutionMode } from "./types.js";

export function createCccAdapter(): CccExecutionAdapter {
  const mode = (process.env.EXECUTION_MODE ?? "simulated_ccc") as ExecutionMode;
  const rpcUrl = process.env.TENDERLY_RPC_URL;

  if (mode === "real_ccc") {
    throw new Error(
      "[ccc-factory] real_ccc mode is not yet implemented. " +
      "Use EXECUTION_MODE=simulated_ccc or EXECUTION_MODE=local_don_ccc with a Tenderly fork."
    );
  }

  if (!rpcUrl) {
    throw new Error(
      `[ccc-factory] TENDERLY_RPC_URL is required for ${mode} mode.`
    );
  }

  const forkId = process.env.TENDERLY_FORK_ID;
  return new CccExecutionAdapter(rpcUrl, forkId);
}
