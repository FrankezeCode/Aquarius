---
name: aquarius-system
description: System-level intelligence architecture for Aquarius DeFi Lab (API-first, real-time, protocol-aware)
---

# Aquarius DeFi Lab – System Skill

## Mission
Aquarius exists to make on-chain opportunities, risks, and flows visible.
It surfaces what is normally unseen inside DeFi protocols.

This is not a dashboard product.
This is a real-time intelligence system.

## Core Philosophy
- APIs are the primary product.
- UI is a consumer, not the source of truth.
- Signals > dashboards.
- Events > polling.
- Insight > raw data.
- Safety > speed.

## System Thinking Rules
- Think in systems, not pages.
- Think in flows, not screens.
- Think in signals, not charts.
- Think in protocols, not features.

## Architecture Principles
- API-first by default.
- Event-driven when real-time matters.
- Protocol logic must be isolated and composable.
- No protocol logic leaks into UI.
- All intelligence should be reusable across:
  - Web UI
  - Developer APIs
  - Bots
  - Alerts
  - Future clients

## Technology Guidance (Not Restrictive)
- Next.js 16 is the web delivery layer, not the system.
- Use Server Components and Server Actions when building the web UI.
- Use Zod for schema validation across all layers.
- Prefer streams or subscriptions over REST for live data.
- REST is acceptable for deterministic, cacheable reads.

## Blockchain & DeFi Thinking
- On-chain data is adversarial until validated.
- Events can arrive late, reordered, or missing.
- Never assume protocol invariants.
- Normalize protocol data into shared internal models.

## Security & Safety
- Assume abuse by default.
- Wallet address ≠ trust.
- Never expose sensitive intelligence unintentionally.
- Protect users from themselves when necessary.

## UX & Human Factors
- Reduce cognitive load.
- Make the next action obvious.
- Hide complexity until it is needed.
- Present outcomes, not mechanisms.

## What NOT to Build
- No user-generated SQL dashboards.
- No protocol-specific UI logic.
- No tightly coupled features.
- No hype-driven features without a clear user outcome.

## Final Constraint
If a feature does not clearly advance:
“Making the unseen visible and actionable”
it does not belong in Aquarius.
