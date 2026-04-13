/**
 * Kamino repay — Solana RPC simulation (dry-run, no broadcast).
 *
 * Composes `buildKaminoRepayVersionedTransaction` + `Connection.simulateTransaction`.
 */

import type { Config } from "../../config/index.js";
import { withTimeout, TimeoutError } from "./timeout.js";
import { buildKaminoRepayVersionedTransaction } from "./kamino-repay-tx-builder.js";

export interface KaminoRepayDryRunInput {
  config: Config;
  wallet: string;
  marketPubkey: string;
  repayMint: string;
  /** Human amount string (token units per Klend, same as SDK `buildRepayTxns`). */
  amountUi: string;
}

export type KaminoRepayDryRunResult =
  | {
      ok: true;
      simulated: true;
      instructionCount: number;
      unitsConsumed: number | undefined;
      logs: string[] | null;
      err: string | null | undefined;
    }
  | {
      ok: false;
      code:
        | "MARKET_NOT_FOUND"
        | "OBLIGATION_NOT_FOUND"
        | "BUILD_FAILED"
        | "SIMULATE_FAILED"
        | "TIMEOUT"
        | "RPC_ERROR";
      message: string;
    };

/**
 * Build repay transaction (Klend + web3) and run `simulateTransaction` (no fee paid; no broadcast).
 */
export async function simulateKaminoRepayDryRun(
  input: KaminoRepayDryRunInput
): Promise<KaminoRepayDryRunResult> {
  const { config } = input;

  const built = await buildKaminoRepayVersionedTransaction(input);
  if (!built.ok) {
    if (built.code === "RPC_ERROR") {
      return { ok: false, code: "RPC_ERROR", message: built.message };
    }
    return built;
  }

  const { connection, versionedTransaction, instructionCount } = built;

  try {
    const sim = await withTimeout(
      connection.simulateTransaction(versionedTransaction, {
        sigVerify: false,
        commitment: "confirmed",
      }),
      config.kaminoRepaySimulateTimeoutMs,
      "simulateTransaction"
    );

    const units = sim.value.unitsConsumed;
    return {
      ok: true,
      simulated: true,
      instructionCount,
      unitsConsumed: units ?? undefined,
      logs: sim.value.logs ?? null,
      err: sim.value.err ? JSON.stringify(sim.value.err) : null,
    };
  } catch (e) {
    if (e instanceof TimeoutError) {
      return { ok: false, code: "TIMEOUT", message: e.message };
    }
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, code: "SIMULATE_FAILED", message: msg };
  }
}
