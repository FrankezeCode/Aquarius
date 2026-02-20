/**
 * Event Engine — Block Stream
 *
 * Subscribes to newHeads via WSS.
 * Emits: NewBlock domain events.
 *
 * Used for:
 *   - Position graph timestamping
 *   - Periodic safety checks
 *   - Block-based prediction triggers
 */

import type { WssProvider } from "./wss-provider.js";
import type { NewBlock } from "./types.js";
import type { EventRouter } from "./event-router.js";

export class BlockStream {
  private wss: WssProvider;
  private router: EventRouter;
  private subscriptionId: string | null = null;

  constructor(wss: WssProvider, router: EventRouter) {
    this.wss = wss;
    this.router = router;
  }

  async start(): Promise<void> {
    this.subscriptionId = await this.wss.subscribe(
      "newHeads",
      undefined,
      (header) => this.handleBlock(header as BlockHeader)
    );

    this.wss.on("resubscribe", () => {
      this.start().catch((e) =>
        console.error("[block-stream] Re-subscribe failed:", e)
      );
    });

    console.info("[block-stream] Listening for new blocks");
  }

  async stop(): Promise<void> {
    if (this.subscriptionId) {
      await this.wss.unsubscribe(this.subscriptionId);
      this.subscriptionId = null;
    }
  }

  private handleBlock(header: BlockHeader): void {
    const blockNumber = parseInt(header.number, 16);

    const event: NewBlock = {
      type: "NewBlock",
      blockNumber,
      timestamp: Date.now(),
    };

    this.router.dispatch(event);
  }
}

interface BlockHeader {
  number: string;
  hash: string;
  parentHash: string;
  timestamp: string;
}
