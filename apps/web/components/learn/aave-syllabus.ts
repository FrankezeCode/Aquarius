export interface AquaLearnModule {
  title: string;
  description: string;
  /** Shown as “~15 min” when you ship; placeholder until then */
  durationLabel: string;
}

export const AAVE_AQUA_LEARN_MODULES: AquaLearnModule[] = [
  {
    title: "Aave fundamentals & markets",
    description:
      "How liquidity pools, aTokens, and interest-rate models work—so you can read any Aave market with confidence.",
    durationLabel: "TBD",
  },
  {
    title: "Supply, borrow, and health factor",
    description:
      "Collateral factors, liquidation mechanics, and how to size positions without surprise liquidations.",
    durationLabel: "TBD",
  },
  {
    title: "Rates, utilization, and risk signals",
    description:
      "What drives borrow/supply APY, utilization spikes, and how protocol-level stress shows up in metrics.",
    durationLabel: "TBD",
  },
  {
    title: "Multichain Aave & governance basics",
    description:
      "Deploying across networks, bridging considerations, and how governance changes can affect your positions.",
    durationLabel: "TBD",
  },
  {
    title: "Protecting positions with Aquarius",
    description:
      "Using Aquarius monitoring, SELVA progression, and Aqua agents alongside Aave for proactive risk management.",
    durationLabel: "TBD",
  },
];
