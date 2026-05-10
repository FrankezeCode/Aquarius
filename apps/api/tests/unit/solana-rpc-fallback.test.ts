/**
 * Solana RPC primary/fallback router — provider-level circuit semantics.
 *
 * Pure logic: no real RPC calls. The Rpc client returned by `pickSolanaRpc`
 * is constructed by `@solana/kit` against the URL string and never invoked
 * here, so these tests stay fully offline.
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  pickSolanaRpc,
  recordSolanaRpcOutcome,
  resetSolanaRpcCacheForTests,
  isPrimarySolanaRpcCircuitOpen,
} from "../../src/infrastructure/kamino/solana-rpc.js";

const PRIMARY = "https://primary.example.com/?api_key=stub";
const FALLBACK = "https://fallback.example.com/?api_key=stub";

const OPTS = {
  failureThreshold: 3,
  circuitOpenMs: 30_000,
} as const;

describe("pickSolanaRpc", () => {
  beforeEach(() => {
    resetSolanaRpcCacheForTests();
  });

  it("returns primary when circuit is closed", () => {
    const sel = pickSolanaRpc({
      primaryUrl: PRIMARY,
      fallbackUrl: FALLBACK,
      ...OPTS,
    });
    assert.equal(sel.provider, "primary");
    assert.equal(sel.url, PRIMARY);
  });

  it("stays on primary when no fallback is configured even after failures", () => {
    let now = 1_000;
    const nowFn = () => now;
    for (let i = 0; i < OPTS.failureThreshold; i++) {
      const sel = pickSolanaRpc({
        primaryUrl: PRIMARY,
        ...OPTS,
        now: nowFn,
      });
      recordSolanaRpcOutcome(sel, false, { ...OPTS, now: nowFn });
    }
    const sel = pickSolanaRpc({
      primaryUrl: PRIMARY,
      ...OPTS,
      now: nowFn,
    });
    assert.equal(sel.provider, "primary");
  });

  it("routes to fallback after threshold consecutive primary failures", () => {
    let now = 1_000;
    const nowFn = () => now;
    for (let i = 0; i < OPTS.failureThreshold; i++) {
      const sel = pickSolanaRpc({
        primaryUrl: PRIMARY,
        fallbackUrl: FALLBACK,
        ...OPTS,
        now: nowFn,
      });
      assert.equal(sel.provider, "primary", `attempt ${i} should still be primary`);
      recordSolanaRpcOutcome(sel, false, { ...OPTS, now: nowFn });
    }
    const sel = pickSolanaRpc({
      primaryUrl: PRIMARY,
      fallbackUrl: FALLBACK,
      ...OPTS,
      now: nowFn,
    });
    assert.equal(sel.provider, "fallback");
    assert.equal(sel.url, FALLBACK);
    assert.equal(isPrimarySolanaRpcCircuitOpen(nowFn), true);
  });

  it("resets failure count on a successful primary outcome", () => {
    let now = 1_000;
    const nowFn = () => now;
    const cycle = (ok: boolean) => {
      const sel = pickSolanaRpc({
        primaryUrl: PRIMARY,
        fallbackUrl: FALLBACK,
        ...OPTS,
        now: nowFn,
      });
      recordSolanaRpcOutcome(sel, ok, { ...OPTS, now: nowFn });
    };
    cycle(false);
    cycle(false);
    cycle(true); // resets primary failure count
    cycle(false);
    cycle(false);
    const sel = pickSolanaRpc({
      primaryUrl: PRIMARY,
      fallbackUrl: FALLBACK,
      ...OPTS,
      now: nowFn,
    });
    assert.equal(
      sel.provider,
      "primary",
      "two failures after a success should not open the circuit"
    );
  });

  it("auto-closes the circuit after circuitOpenMs and probes primary", () => {
    let now = 1_000;
    const nowFn = () => now;
    for (let i = 0; i < OPTS.failureThreshold; i++) {
      const sel = pickSolanaRpc({
        primaryUrl: PRIMARY,
        fallbackUrl: FALLBACK,
        ...OPTS,
        now: nowFn,
      });
      recordSolanaRpcOutcome(sel, false, { ...OPTS, now: nowFn });
    }
    assert.equal(isPrimarySolanaRpcCircuitOpen(nowFn), true);

    now += OPTS.circuitOpenMs + 1;
    assert.equal(isPrimarySolanaRpcCircuitOpen(nowFn), false);

    const sel = pickSolanaRpc({
      primaryUrl: PRIMARY,
      fallbackUrl: FALLBACK,
      ...OPTS,
      now: nowFn,
    });
    assert.equal(sel.provider, "primary");
  });

  it("never advances primary circuit on fallback outcomes", () => {
    let now = 1_000;
    const nowFn = () => now;
    for (let i = 0; i < OPTS.failureThreshold; i++) {
      const sel = pickSolanaRpc({
        primaryUrl: PRIMARY,
        fallbackUrl: FALLBACK,
        ...OPTS,
        now: nowFn,
      });
      recordSolanaRpcOutcome(sel, false, { ...OPTS, now: nowFn });
    }
    assert.equal(isPrimarySolanaRpcCircuitOpen(nowFn), true);

    for (let i = 0; i < 10; i++) {
      const sel = pickSolanaRpc({
        primaryUrl: PRIMARY,
        fallbackUrl: FALLBACK,
        ...OPTS,
        now: nowFn,
      });
      assert.equal(sel.provider, "fallback");
      recordSolanaRpcOutcome(sel, false, { ...OPTS, now: nowFn });
    }

    now += OPTS.circuitOpenMs + 1;
    const sel = pickSolanaRpc({
      primaryUrl: PRIMARY,
      fallbackUrl: FALLBACK,
      ...OPTS,
      now: nowFn,
    });
    assert.equal(
      sel.provider,
      "primary",
      "fallback failures must not extend primary's open window"
    );
  });
});
