/**
 * Domain Model — PositionSnapshot
 *
 * Protocol-agnostic representation of a DeFi lending position.
 * This is the ONLY shape the domain layer operates on.
 *
 * Infrastructure adapters (Mock, Tenderly, Mainnet, Subgraph)
 * must map their raw data into this structure.
 *
 * Field names align with the existing AavePositionSnapshot for
 * structural compatibility with the risk intelligence pipeline
 * (correlator, scorer, monitor). No adapter or RPC types allowed.
 */
export {};
