# Aquarius — 0G APAC Hackathon Submission

> This document is the dedicated submission overview for the **0G APAC Hackathon**.
> See the [main README](../../README.md) for full architecture and technical proof.

<p align="center">
  <a href="https://aquarius-web.vercel.app/">
    <img src="https://img.shields.io/badge/Live_Project-View_Site-7c3aed?style=for-the-badge&logo=vercel&logoColor=white" alt="View live project" />
  </a>
  &nbsp;
  <a href="https://youtu.be/b-kWwo4hqwk">
    <img src="https://img.shields.io/badge/Walkthrough-Watch_Video-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="Walkthrough demo video" />
  </a>
  &nbsp;
  <a href="https://aquarius-web.vercel.app/docs/introduction">
    <img src="https://img.shields.io/badge/Docs-Whitepaper-3b82f6?style=for-the-badge&logo=gitbook&logoColor=white" alt="Documentation / whitepaper" />
  </a>
</p>

---

## Summary

Aquarius used 0G APAC to explore **decentralized AI infrastructure for risk intelligence**: a 0G-routed pipeline that turns protocol monitoring data into agent-ready signals, with vault-gateway routing and a path toward decentralized data availability for risk feeds.

## Focus areas

- **0G data infrastructure** — protocol-monitoring data routed through a 0G-aware pipeline.
- **AI risk pipeline** — deterministic risk signals fed to agentic intelligence layers.
- **Decentralized storage / DA** — exploration of decentralized availability for risk feeds and proofs.
- **Protocol monitoring** — generic monitoring abstractions across EVM and Solana surfaces.
- **Agentic intelligence** — LLM-backed advisory layer grounded in deterministic signals.

## Where it lives in the codebase

- 0G integration discussion: see the **Zero Gravity (0G) and ZG pipeline** section in the [main README](../../README.md)
- Architecture: [`docs/architecture.md`](../architecture.md)
- Public API surface: [`docs/api/public-surface.md`](../api/public-surface.md)
- Vault strategy and routing: [`docs/vault-strategy.md`](../vault-strategy.md)

## Demo

- **Live app:** <https://aquarius-web.vercel.app/>
- **Walkthrough video:** <https://youtu.be/b-kWwo4hqwk>
- **Intro video:** <https://youtu.be/Z0YKaZFClW4>

## How this fits the broader vision

The 0G APAC submission contributes the **AI / data infrastructure** half of the Aquarius stack. Together with the [Chainlink Convergence](./chainlink-convergence.md) execution backbone and the [Colosseum Frontier](./colosseum-frontier.md) Solana-native risk monitoring front end, the three submissions describe the full Aquarius system:

- **Detection** — wallet-native, protocol-aware risk reads (Solana / Kamino on Frontier).
- **Intelligence** — decentralized AI pipeline grounded in deterministic risk signals (0G).
- **Controlled action** — safe, traceable, policy-bound mitigation (Chainlink Convergence).

---

> See the [main README](../../README.md) for full 0G-specific integration details and broader architecture documentation.
