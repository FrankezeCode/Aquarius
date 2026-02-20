/**
 * Prediction Engine — Volatility Forecast (EWMA Model)
 *
 * Exponentially Weighted Moving Average volatility estimator.
 * Tracks per-asset volatility from price updates.
 *
 * Pure computation — no I/O. Maintains minimal state
 * (recent returns window per asset).
 *
 * Performance target: < 0.05ms per update.
 */

const DEFAULT_LAMBDA = 0.94; // EWMA decay factor (RiskMetrics standard)
const DEFAULT_WINDOW = 100;
const ANNUALIZATION_FACTOR = Math.sqrt(365 * 24 * 3600 / 12); // blocks to annual

export interface VolatilityEstimate {
  asset: string;
  ewmaVariance: number;
  annualizedVol: number;
  sampleCount: number;
  lastUpdate: number;
}

export class VolatilityForecaster {
  private lambda: number;
  private maxWindow: number;
  private assetReturns = new Map<string, number[]>();
  private assetVariance = new Map<string, number>();
  private assetLastPrice = new Map<string, number>();
  private lastUpdate = new Map<string, number>();

  constructor(lambda = DEFAULT_LAMBDA, maxWindow = DEFAULT_WINDOW) {
    this.lambda = lambda;
    this.maxWindow = maxWindow;
  }

  /**
   * Feed a new price observation. Computes return and updates EWMA.
   */
  update(asset: string, price: number, timestamp?: number): void {
    const lastPrice = this.assetLastPrice.get(asset);
    this.assetLastPrice.set(asset, price);

    if (lastPrice === undefined || lastPrice <= 0 || price <= 0) return;

    const logReturn = Math.log(price / lastPrice);

    let returns = this.assetReturns.get(asset);
    if (!returns) {
      returns = [];
      this.assetReturns.set(asset, returns);
    }

    returns.push(logReturn);
    if (returns.length > this.maxWindow) {
      returns.shift();
    }

    // EWMA variance update: σ²_t = λ * σ²_{t-1} + (1 - λ) * r²_t
    const prevVariance = this.assetVariance.get(asset) ?? logReturn * logReturn;
    const newVariance = this.lambda * prevVariance + (1 - this.lambda) * logReturn * logReturn;
    this.assetVariance.set(asset, newVariance);
    this.lastUpdate.set(asset, timestamp ?? Date.now());
  }

  /**
   * Get current volatility estimate for an asset.
   */
  getEstimate(asset: string): VolatilityEstimate | undefined {
    const variance = this.assetVariance.get(asset);
    if (variance === undefined) return undefined;

    const returns = this.assetReturns.get(asset);
    const blockVol = Math.sqrt(variance);
    const annualizedVol = blockVol * ANNUALIZATION_FACTOR;

    return {
      asset,
      ewmaVariance: variance,
      annualizedVol: Math.round(annualizedVol * 10000) / 10000,
      sampleCount: returns?.length ?? 0,
      lastUpdate: this.lastUpdate.get(asset) ?? 0,
    };
  }

  /**
   * Get all tracked assets' volatility estimates.
   */
  getAllEstimates(): VolatilityEstimate[] {
    const results: VolatilityEstimate[] = [];
    for (const asset of this.assetVariance.keys()) {
      const est = this.getEstimate(asset);
      if (est) results.push(est);
    }
    return results;
  }
}
