export type StreamKind = "mempool" | "liquidations" | "price-shocks";

export interface StreamConfig {
  kind: StreamKind;
  url: string;
}
