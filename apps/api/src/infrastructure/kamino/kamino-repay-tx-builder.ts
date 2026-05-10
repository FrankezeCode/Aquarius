/**
 * Kamino repay — transaction builder (Klend SDK + Solana web3 instructions).
 *
 * Builds a VersionedTransaction for repay **without** broadcasting. Simulation
 * lives in `kamino-repay-dry-run.ts`.
 */

import { address, createNoopSigner, type AccountRole } from "@solana/kit";
import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import type { Config } from "../../config/index.js";
import { recordKaminoFallbackActivation } from "../../observability/domain-metrics.js";
import { pickSolanaRpc, recordSolanaRpcOutcome } from "./solana-rpc.js";
import { withTimeout, TimeoutError } from "./timeout.js";
import { kitInstructionsToWeb3 } from "./kit-instruction-to-web3.js";

export interface KaminoRepayTxBuildInput {
  config: Config;
  wallet: string;
  marketPubkey: string;
  repayMint: string;
  /** Human amount string (token units per Klend, same as SDK `buildRepayTxns`). */
  amountUi: string;
}

export type KaminoRepayTxBuildResult =
  | {
      ok: true;
      connection: Connection;
      versionedTransaction: VersionedTransaction;
      instructionCount: number;
    }
  | {
      ok: false;
      code:
        | "RPC_ERROR"
        | "MARKET_NOT_FOUND"
        | "OBLIGATION_NOT_FOUND"
        | "BUILD_FAILED"
        | "TIMEOUT";
      message: string;
    };

/**
 * Load market + obligation, run Klend `buildRepayTxns`, map Kit → web3 instructions,
 * compile a v0 transaction (recent blockhash, payer = wallet). Does not simulate or send.
 */
export async function buildKaminoRepayVersionedTransaction(
  input: KaminoRepayTxBuildInput
): Promise<KaminoRepayTxBuildResult> {
  const { config, wallet, marketPubkey, repayMint, amountUi } = input;
  if (!config.solanaRpcUrl) {
    return {
      ok: false,
      code: "RPC_ERROR",
      message: "SOLANA_RPC_URL is not configured.",
    };
  }

  const selection = pickSolanaRpc({
    primaryUrl: config.solanaRpcUrl,
    fallbackUrl: config.solanaRpcFallbackUrl,
    failureThreshold: config.kaminoCircuitFailureThreshold,
    circuitOpenMs: config.kaminoCircuitOpenMs,
  });
  if (selection.provider === "fallback") {
    recordKaminoFallbackActivation();
  }
  const rpcUrl = selection.url;
  const rpc = selection.rpc;
  const connection = new Connection(rpcUrl, "confirmed");

  const providerOutcomeOpts = {
    failureThreshold: config.kaminoCircuitFailureThreshold,
    circuitOpenMs: config.kaminoCircuitOpenMs,
  } as const;

  const { KaminoMarket, KaminoAction, VanillaObligation, PROGRAM_ID } =
    await import("@kamino-finance/klend-sdk");

  const ownerAddr = address(wallet);
  const noopOwner = createNoopSigner(ownerAddr);
  const marketAddr = address(marketPubkey);
  const mintAddr = address(repayMint);

  try {
    const market = await withTimeout(
      KaminoMarket.load(
        rpc as Parameters<typeof KaminoMarket.load>[0],
        marketAddr,
        config.kaminoRecentSlotMs,
        undefined,
        true
      ),
      config.kaminoRpcTimeoutMs,
      "KaminoMarket.load(repay)"
    );

    if (!market) {
      return {
        ok: false,
        code: "MARKET_NOT_FOUND",
        message: "Kamino market could not be loaded.",
      };
    }

    const vanilla = new VanillaObligation(PROGRAM_ID);
    const obligation = await withTimeout(
      market.getObligationByWallet(ownerAddr, vanilla),
      config.kaminoRpcTimeoutMs,
      "getObligationByWallet(repay)"
    );

    if (!obligation) {
      return {
        ok: false,
        code: "OBLIGATION_NOT_FOUND",
        message: "No vanilla obligation for this wallet on this market.",
      };
    }

    const rpcAny = rpc as {
      getSlot: (opts: { commitment: string }) => { send: () => Promise<bigint> };
    };
    const currentSlot = await withTimeout(
      rpcAny.getSlot({ commitment: "confirmed" }).send(),
      config.kaminoRpcTimeoutMs,
      "getSlot"
    );

    const action = await withTimeout(
      KaminoAction.buildRepayTxns(
        market,
        amountUi,
        mintAddr,
        noopOwner,
        obligation,
        true,
        undefined,
        currentSlot,
        noopOwner,
        1_000_000,
        true,
        false,
        { skipInitialization: false, skipLutCreation: false }
      ),
      config.kaminoRepaySimulateTimeoutMs,
      "buildRepayTxns"
    );

    const kitIxs = KaminoAction.actionToIxs(action);
    const web3Ixs = kitInstructionsToWeb3(
      kitIxs.map((ix) => {
        const accountsRaw = ix.accounts ?? [];
        return {
          programAddress: String(ix.programAddress),
          accounts: accountsRaw.map((a) => {
            const meta = a as { address: unknown; role: AccountRole };
            return {
              address: String(meta.address),
              role: meta.role,
            };
          }),
          data: new Uint8Array(ix.data ?? []),
        };
      })
    );

    const { blockhash } = await withTimeout(
      connection.getLatestBlockhash("confirmed"),
      config.kaminoRepaySimulateTimeoutMs,
      "getLatestBlockhash"
    );

    const payerKey = new PublicKey(wallet);
    const messageV0 = new TransactionMessage({
      payerKey,
      recentBlockhash: blockhash,
      instructions: web3Ixs,
    }).compileToV0Message();

    const versionedTransaction = new VersionedTransaction(messageV0);

    recordSolanaRpcOutcome(selection, true, providerOutcomeOpts);
    return {
      ok: true,
      connection,
      versionedTransaction,
      instructionCount: web3Ixs.length,
    };
  } catch (e) {
    if (e instanceof TimeoutError) {
      recordSolanaRpcOutcome(selection, false, providerOutcomeOpts);
      return { ok: false, code: "TIMEOUT", message: e.message };
    }
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("buildRepayTxns") || msg.includes("addSupportIxs")) {
      // Logical build failure (SDK couldn't shape the tx) — not an RPC fault.
      recordSolanaRpcOutcome(selection, true, providerOutcomeOpts);
      return { ok: false, code: "BUILD_FAILED", message: msg };
    }
    recordSolanaRpcOutcome(selection, false, providerOutcomeOpts);
    return {
      ok: false,
      code: "BUILD_FAILED",
      message: msg,
    };
  }
}
