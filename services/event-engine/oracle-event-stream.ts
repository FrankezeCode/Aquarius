/**
 * Event Engine — Chainlink Oracle Event Stream
 *
 * Subscribes to Chainlink price feed AnswerUpdated events via WSS.
 * Emits: OraclePriceUpdated domain events with price delta.
 *
 * Supports multiple price feeds simultaneously.
 */

import type { WssProvider } from "./wss-provider.js";
import type { OraclePriceUpdated } from "./types.js";
import type { EventRouter } from "./event-router.js";

// AnswerUpdated(int256 indexed current, uint256 indexed roundId, uint256 updatedAt)
const ANSWER_UPDATED_TOPIC = "0x0559884fd3a460db3073b7fc896cc77986f16e378210ded43186175bf646fc5f";

interface PriceFeedConfig {
  aggregatorAddress: string;
  asset: string;
  decimals: number;
}

// Mainnet Chainlink aggregator addresses for key Aave V3 assets
const DEFAULT_FEEDS: PriceFeedConfig[] = [
  { aggregatorAddress: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", asset: "WETH", decimals: 8 },
  { aggregatorAddress: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c", asset: "WBTC", decimals: 8 },
  { aggregatorAddress: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6", asset: "USDC", decimals: 8 },
  { aggregatorAddress: "0x3E7d1eAB13ad0104d2750B8863b489D65364e32D", asset: "USDT", decimals: 8 },
  { aggregatorAddress: "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9", asset: "DAI", decimals: 8 },
];

export class OracleEventStream {
  private wss: WssProvider;
  private router: EventRouter;
  private feeds: PriceFeedConfig[];
  private subscriptionId: string | null = null;
  private lastPrices = new Map<string, number>();

  constructor(wss: WssProvider, router: EventRouter, feeds?: PriceFeedConfig[]) {
    this.wss = wss;
    this.router = router;
    this.feeds = feeds ?? DEFAULT_FEEDS;
  }

  async start(): Promise<void> {
    const addresses = this.feeds.map((f) => f.aggregatorAddress.toLowerCase());

    this.subscriptionId = await this.wss.subscribe(
      "logs",
      {
        address: addresses,
        topics: [[ANSWER_UPDATED_TOPIC]],
      },
      (log) => this.handleLog(log as OracleLogEntry)
    );

    this.wss.on("resubscribe", () => {
      this.start().catch((e) =>
        console.error("[oracle-stream] Re-subscribe failed:", e)
      );
    });

    console.info(`[oracle-stream] Listening to ${this.feeds.length} Chainlink price feeds`);
  }

  async stop(): Promise<void> {
    if (this.subscriptionId) {
      await this.wss.unsubscribe(this.subscriptionId);
      this.subscriptionId = null;
    }
  }

  private handleLog(log: OracleLogEntry): void {
    const sourceAddress = log.address.toLowerCase();
    const feed = this.feeds.find(
      (f) => f.aggregatorAddress.toLowerCase() === sourceAddress
    );
    if (!feed) return;

    // AnswerUpdated: current is indexed (topic[1]), roundId is indexed (topic[2])
    const currentTopic = log.topics[1];
    const roundIdTopic = log.topics[2];
    if (!currentTopic || !roundIdTopic) return;

    const rawPrice = BigInt(currentTopic);
    const price = Number(rawPrice) / Math.pow(10, feed.decimals);
    const roundId = BigInt(roundIdTopic);

    const previousPrice = this.lastPrices.get(feed.asset) ?? price;
    const deltaPercent = previousPrice > 0
      ? ((price - previousPrice) / previousPrice) * 100
      : 0;

    this.lastPrices.set(feed.asset, price);

    const event: OraclePriceUpdated = {
      type: "OraclePriceUpdated",
      asset: feed.asset,
      price,
      previousPrice,
      deltaPercent: Math.round(deltaPercent * 10000) / 10000,
      roundId,
      blockNumber: parseInt(log.blockNumber, 16),
      timestamp: Date.now(),
    };

    this.router.dispatch(event);
  }
}

interface OracleLogEntry {
  address: string;
  topics: string[];
  data: string;
  blockNumber: string;
  transactionHash: string;
}
