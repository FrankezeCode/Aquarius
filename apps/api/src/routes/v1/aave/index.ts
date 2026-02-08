/**
 * v1/aave — Versioned Route Adapter
 *
 * Re-exports the existing Aave protocol routes into the v1 namespace.
 * This is a structural adapter — no logic changes, no new behavior.
 *
 * All actual route handlers live in: routes/protocol/aave/
 */

export { registerAaveRoutes } from "../../protocol/aave/index.js";
