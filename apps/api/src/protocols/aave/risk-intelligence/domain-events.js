/**
 * Risk-Intelligence — Domain Events
 *
 * Bounded context: Aave / Risk Intelligence
 *
 * Pure domain event types emitted by the risk-intelligence layer.
 * These events carry NO infrastructure references (no CCIP, no HTTP,
 * no blockchain SDK imports). They are consumed by the application
 * layer which decides how to dispatch them.
 *
 * DDD principle: Domain emits facts. Infrastructure reacts.
 */
export {};
