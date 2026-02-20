/**
 * Event Engine — Main Bootstrap
 *
 * Initializes WSS connections, event streams, event router,
 * and position graph store. Wires everything together.
 *
 * Usage:
 *   import { createEventEngine } from "@aquarius/event-engine";
 *   const engine = await createEventEngine(wssUrl);
 *   // engine.graph is now receiving real-time updates
 */

export { WssProvider } from "./wss-provider.js";
export { AaveEventStream } from "./aave-event-stream.js";
export { OracleEventStream } from "./oracle-event-stream.js";
export { BlockStream } from "./block-stream.js";
export { EventRouter } from "./event-router.js";
export { PositionGraphStore } from "./position-graph-store.js";
export type {
  StreamEvent,
  AavePositionUpdated,
  OraclePriceUpdated,
  NewBlock,
  EventHandler,
  EventSubscription,
} from "./types.js";

import { WssProvider } from "./wss-provider.js";
import { AaveEventStream } from "./aave-event-stream.js";
import { OracleEventStream } from "./oracle-event-stream.js";
import { BlockStream } from "./block-stream.js";
import { EventRouter } from "./event-router.js";
import { PositionGraphStore } from "./position-graph-store.js";

export interface EventEngine {
  wss: WssProvider;
  router: EventRouter;
  graph: PositionGraphStore;
  aaveStream: AaveEventStream;
  oracleStream: OracleEventStream;
  blockStream: BlockStream;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export async function createEventEngine(wssUrl: string): Promise<EventEngine> {
  const wss = new WssProvider(wssUrl);
  const router = new EventRouter();
  const graph = new PositionGraphStore();

  const aaveStream = new AaveEventStream(wss, router);
  const oracleStream = new OracleEventStream(wss, router);
  const blockStream = new BlockStream(wss, router);

  // Wire router → graph updates
  router.on("AavePositionUpdated", (event) => {
    const e = event as import("./types.js").AavePositionUpdated;
    const amountNormalized = Number(e.amount) / 1e18;

    switch (e.action) {
      case "Supply":
        graph.updateCollateral(e.user, e.asset, amountNormalized);
        break;
      case "Withdraw":
        graph.updateCollateral(e.user, e.asset, -amountNormalized);
        break;
      case "Borrow":
        graph.updateDebt(e.user, e.asset, amountNormalized);
        break;
      case "Repay":
        graph.updateDebt(e.user, e.asset, -amountNormalized);
        break;
      case "LiquidationCall":
        graph.updateDebt(e.user, e.asset, -amountNormalized);
        break;
    }
  });

  router.on("OraclePriceUpdated", (event) => {
    const e = event as import("./types.js").OraclePriceUpdated;
    graph.updatePrice(e.asset, e.price);
  });

  router.on("NewBlock", (event) => {
    const e = event as import("./types.js").NewBlock;
    graph.updateBlock(e.blockNumber);
  });

  return {
    wss,
    router,
    graph,
    aaveStream,
    oracleStream,
    blockStream,

    async start() {
      await wss.connect();
      await Promise.all([
        aaveStream.start(),
        oracleStream.start(),
        blockStream.start(),
      ]);
      console.info("[event-engine] All streams started");
    },

    async stop() {
      await Promise.all([
        aaveStream.stop(),
        oracleStream.stop(),
        blockStream.stop(),
      ]);
      wss.destroy();
      console.info("[event-engine] All streams stopped");
    },
  };
}
