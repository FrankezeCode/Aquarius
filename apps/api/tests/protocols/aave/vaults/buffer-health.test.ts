/**
 * Unit tests — buffer-health domain math
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createCollateralAsset } from "../../../../src/protocols/aave/vaults/domain/collateral-asset.js";
import {
  aggregateTvlUsd,
  buildUsdPerUnitMap,
  computeBufferHealth,
  projectSolvencyUnderStress,
  suggestMitigationForWatch,
  withTimeToRefill,
} from "../../../../src/protocols/aave/vaults/domain/buffer-health.js";

describe("buffer-health domain", () => {
  it("aggregateTvlUsd sums collateral notionals", () => {
    const usd = buildUsdPerUnitMap({ USDC: 1, ETH: 3000 });
    const col = createCollateralAsset(
      "c1",
      "aq1",
      "USDC",
      "AAVE_ATOKEN",
      100
    );
    assert.equal(aggregateTvlUsd([col], usd), 100);
  });

  it("computeBufferHealth marks critical when below minimum", () => {
    const policy = { drawdownWarningPct: 5 };
    const h = computeBufferHealth({
      tvlUsd: 1000,
      minimumTvlUsd: 10_000,
      policy,
    });
    assert.equal(h.gapUsd, 9000);
    assert.equal(h.alertLevel, "critical");
  });

  it("computeBufferHealth warns on drawdown vs previous", () => {
    const policy = { drawdownWarningPct: 5 };
    const h = computeBufferHealth({
      tvlUsd: 9000,
      minimumTvlUsd: 0,
      previousTvlUsd: 10_000,
      policy,
    });
    assert.equal(h.alertLevel, "warning");
    assert.ok(h.drawdownPct >= 9);
  });

  it("withTimeToRefill estimates hours from gap and rate", () => {
    const policy = { drawdownWarningPct: 5, refillAssumedUsdPerHour: 1000 };
    const base = computeBufferHealth({
      tvlUsd: 0,
      minimumTvlUsd: 5000,
      policy,
    });
    const w = withTimeToRefill(base, policy);
    assert.equal(w.timeToRefillHours, 5);
  });

  it("projectSolvencyUnderStress linear drain", () => {
    const p = projectSolvencyUnderStress({
      tvlUsd: 100_000,
      minimumTvlUsd: 50_000,
      stressDrawUsdPerHour: 5000,
      horizonHours: 24,
    });
    assert.equal(p.projectedTvlUsd, -20_000);
    assert.equal(p.solventAtHorizon, false);
  });

  it("suggestMitigationForWatch returns INCREASE_BUFFER", () => {
    const s = suggestMitigationForWatch({
      healthFactor: 1.2,
      debtRatio: 0.3,
      liquidityIndex: 0,
      volatilityScore: 0.3,
      riskLevel: "watch",
      timestamp: Date.now(),
    });
    assert.ok(s);
    assert.equal(s!.action, "INCREASE_BUFFER");
  });

  it("suggestMitigationForWatch returns null when not watch", () => {
    const s = suggestMitigationForWatch({
      healthFactor: 1.2,
      debtRatio: 0.3,
      liquidityIndex: 0,
      volatilityScore: 0.3,
      riskLevel: "safe",
      timestamp: Date.now(),
    });
    assert.equal(s, null);
  });
});
