/**
 * v1/uniswap — Versioned Route Adapter
 *
 * Re-exports the existing Uniswap protocol routes into the v1 namespace.
 * This is a structural adapter — no logic changes, no new behavior.
 *
 * All actual route handlers live in: routes/protocol/uniswap/
 */

export { registerUniswapRoutes } from "../../protocol/uniswap/index.js";
