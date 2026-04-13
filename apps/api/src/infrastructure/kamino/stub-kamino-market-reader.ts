/**
 * Stub Kamino market reader — Phase A (no Solana RPC, no secrets).
 *
 * Replace with RPC + Kamino SDK implementation when ingesting live markets.
 */

import type { KaminoMarketReader } from "../../domain/ports/kamino.js";

export function createStubKaminoMarketReader(): KaminoMarketReader {
  return {
    async listMarketLabels() {
      return [];
    },
  };
}
