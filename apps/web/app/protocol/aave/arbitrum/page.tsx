"use client";

import { useEffect } from "react";

import { useProtocolChain } from "@/context/protocol-chain-context";
import { AaveRiskMonitor } from "@/protocols/aave/aave-risk-monitor";

/**
 * Arbitrum Open House — dedicated Aave risk agent surface (chain pinned to Arbitrum).
 */
export default function AaveArbitrumRiskAgentPage() {
  const { switchChain } = useProtocolChain();

  useEffect(() => {
    switchChain("arbitrum");
  }, [switchChain]);

  return <AaveRiskMonitor />;
}
