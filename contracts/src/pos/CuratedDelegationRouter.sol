// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CuratedDelegationRouter
 * @notice Minimal testnet surface for Phase 7 — records a curated delegation *intent* on-chain (event only).
 *         This is not Ethereum beacon staking; it proves API → adapter → chain wiring with a verifiable tx hash.
 */
contract CuratedDelegationRouter {
    event DelegationRouted(
        address indexed validator,
        uint256 amountWei,
        address indexed sender,
        bytes32 indexed partnerId
    );

    /**
     * @param validator Curated validator or partner contract address (product-defined).
     * @param amountWei Logical amount (wei) for correlation; no native transfer.
     * @param partnerId Optional keccak partner id (or zero).
     */
    function recordDelegationIntent(
        address validator,
        uint256 amountWei,
        bytes32 partnerId
    ) external {
        emit DelegationRouted(validator, amountWei, msg.sender, partnerId);
    }
}
