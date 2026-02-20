/**
 * Event Engine — Domain Event Types
 *
 * Typed events emitted by the real-time streaming layer.
 * These are protocol-agnostic event shapes consumed by
 * the event router and position graph.
 *
 * No infrastructure imports. No viem. Pure types.
 */

export interface AavePositionUpdated {
  type: "AavePositionUpdated";
  user: string;
  action: "Supply" | "Withdraw" | "Borrow" | "Repay" | "LiquidationCall";
  asset: string;
  amount: bigint;
  blockNumber: number;
  txHash: string;
  timestamp: number;
}

export interface OraclePriceUpdated {
  type: "OraclePriceUpdated";
  asset: string;
  price: number;
  previousPrice: number;
  deltaPercent: number;
  roundId: bigint;
  blockNumber: number;
  timestamp: number;
}

export interface NewBlock {
  type: "NewBlock";
  blockNumber: number;
  timestamp: number;
}

export type StreamEvent =
  | AavePositionUpdated
  | OraclePriceUpdated
  | NewBlock;

export type StreamEventType = StreamEvent["type"];

export type EventHandler<T extends StreamEvent = StreamEvent> = (event: T) => void;

export interface EventSubscription {
  unsubscribe(): void;
}
