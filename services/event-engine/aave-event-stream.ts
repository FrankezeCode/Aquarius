/**
 * Event Engine — Aave V3 Event Stream
 *
 * Subscribes to Aave V3 Pool events via WSS:
 *   Supply, Withdraw, Borrow, Repay, LiquidationCall
 *
 * Emits: AavePositionUpdated domain events
 * Does NOT compute HF. Only detects position changes.
 */

import type { WssProvider } from "./wss-provider.js";
import type { AavePositionUpdated } from "./types.js";
import type { EventRouter } from "./event-router.js";

const AAVE_V3_POOL = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2";

// Aave V3 Pool event signatures (keccak256 of event signatures)
const EVENT_TOPICS: Record<string, AavePositionUpdated["action"]> = {
  "0x2b627736bca15cd5381dcf80b0bf11fd197d01a037c52b927a881a10fb73ba61": "Supply",
  "0x3115d1449a7b732c986cba18244e897a145df0b3b3e234b8aa0ae66e3e8e950e": "Withdraw",
  "0xb3d084820fb1a9decffb176436bd02558d15fac9b0ddfed8c465bc7359d7dce0": "Borrow",
  "0xa534c8dbe71f871f9f3f77571e29520c0ee6b12a0cc9502226a1267e87e008c1": "Repay",
  "0xe413a321e8681d831f4dbccbca790d2952b56f977908e45be37335533e005286": "LiquidationCall",
};

const ALL_TOPIC_HASHES = Object.keys(EVENT_TOPICS);

export class AaveEventStream {
  private wss: WssProvider;
  private router: EventRouter;
  private subscriptionId: string | null = null;

  constructor(wss: WssProvider, router: EventRouter) {
    this.wss = wss;
    this.router = router;
  }

  async start(): Promise<void> {
    this.subscriptionId = await this.wss.subscribe(
      "logs",
      {
        address: AAVE_V3_POOL,
        topics: [ALL_TOPIC_HASHES],
      },
      (log) => this.handleLog(log as LogEntry)
    );

    this.wss.on("resubscribe", () => {
      this.start().catch((e) =>
        console.error("[aave-stream] Re-subscribe failed:", e)
      );
    });

    console.info("[aave-stream] Listening for Aave V3 Pool events");
  }

  async stop(): Promise<void> {
    if (this.subscriptionId) {
      await this.wss.unsubscribe(this.subscriptionId);
      this.subscriptionId = null;
    }
  }

  private handleLog(log: LogEntry): void {
    const topic0 = log.topics?.[0];
    if (!topic0) return;

    const action = EVENT_TOPICS[topic0];
    if (!action) return;

    // Extract user address from topic (topic[1] for most Aave events is the user/onBehalfOf)
    const userTopic = log.topics[1] ?? log.topics[2];
    if (!userTopic) return;

    const user = "0x" + userTopic.slice(26);

    // Extract asset from topic[2] or data depending on event
    const asset = log.topics[2] ? "0x" + log.topics[2].slice(26) : "unknown";

    // Amount from data field (first 32 bytes)
    let amount = 0n;
    if (log.data && log.data.length >= 66) {
      try {
        amount = BigInt("0x" + log.data.slice(2, 66));
      } catch {
        amount = 0n;
      }
    }

    const event: AavePositionUpdated = {
      type: "AavePositionUpdated",
      user: user.toLowerCase(),
      action,
      asset: asset.toLowerCase(),
      amount,
      blockNumber: parseInt(log.blockNumber, 16),
      txHash: log.transactionHash,
      timestamp: Date.now(),
    };

    this.router.dispatch(event);
  }
}

interface LogEntry {
  address: string;
  topics: string[];
  data: string;
  blockNumber: string;
  transactionHash: string;
  logIndex: string;
}
