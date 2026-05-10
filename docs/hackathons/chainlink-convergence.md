# Aquarius — Chainlink Convergence Hackathon Submission

> This document is the dedicated submission overview for the **Chainlink Convergence Hackathon**.
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

Aquarius used Chainlink Convergence to build the **risk orchestration backbone** of the protocol: a controlled execution layer that turns advisory risk signals into staged, traceable mitigation actions, with a CRE-compatible workflow surface and CCIP-style cross-chain coordination paths.

## Focus areas

- **Chainlink CRE** — controlled execution rail with confidential HTTP and callback semantics.
- **CCIP** — cross-chain coordination patterns for execution intents.
- **Orchestration** — staged escalation: observe → protect → escalate.
- **Risk automation** — deterministic detection feeding controlled execution.
- **Vault gateway** — structured intent routing with validation, rate limiting, and execution mode controls.

## Where it lives in the codebase

- Orchestration ports: [`docs/implementation/phase2-orchestration-ports.md`](../implementation/phase2-orchestration-ports.md)
- Confidential HTTP simulation: [`docs/confidential-http-local-simulation.md`](../confidential-http-local-simulation.md)
- Architecture: [`docs/architecture.md`](../architecture.md)
- Public API surface: [`docs/api/public-surface.md`](../api/public-surface.md)
- Core integration discussion: see the **Chainlink** and **Vault gateway and execution rail** sections in the [main README](../../README.md)

## Demo

- **Live app:** <https://aquarius-web.vercel.app/>
- **Walkthrough video:** <https://youtu.be/b-kWwo4hqwk>
- **Intro video:** <https://youtu.be/Z0YKaZFClW4>

## Why this submission still matters

The Chainlink Convergence work is the **execution backbone** that the Solana / Kamino monitoring layer (see the [Colosseum Frontier submission](./colosseum-frontier.md)) is designed to plug into. The two submissions describe two complementary halves of the same long-term system:

- **Detection** — what the user / protocol position looks like in real time (Frontier focus).
- **Controlled action** — how that signal becomes a safe, traceable, policy-bound mitigation (Convergence focus).

---

> See the [main README](../../README.md) for full Chainlink-specific integration details, ADRs, validation reports, and submission proof packs.
