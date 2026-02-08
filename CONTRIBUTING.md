# Contributing to Aquarius DeFi Lab

This document defines the architectural laws of Aquarius.

All contributors — human or AI — must follow these rules.

---

## 1. Protocols are worlds

A protocol is not:
- a filter
- a query param
- a dropdown

A protocol IS:
- a namespace
- a routing boundary
- an isolated reality

Never implement:
?protocol=aave

Always implement:
/protocol/aave/...

---

## 2. Routing defines isolation

- Root layout is protocol-agnostic
- Protocol shell knows we are “in labs”
- Protocol world knows WHICH protocol

Never leak protocol state globally.

---

## 3. APIs mirror UI reality

If the UI route is:
/protocol/aave/opportunities

The API must be:
/api/protocols/aave/opportunities

---

## 4. No global protocol stores

Allowed global state:
- Auth
- Theme
- User preferences

Forbidden global state:
- Protocol metrics
- Risk data
- Opportunities

---

## 5. Clarity beats cleverness

Prefer:
- Explicit structure
- Readable intent
- Boring correctness

Avoid:
- Magical abstractions
- Over-optimization
- Hidden coupling

---

## 6. If unsure — stop

If you’re unsure where something belongs:
- Do NOT guess
- Do NOT generalize
- Ask or document first
