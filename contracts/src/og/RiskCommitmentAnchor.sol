// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RiskCommitmentAnchor
 * @notice Minimal on-chain anchor for Aquarius deterministic risk commitments on **0G Chain** (EVM).
 * @dev Satisfies HackQuest / 0G APAC Track 5 proof for **0G Chain** integration: deploy on 0G mainnet,
 *      then call `anchor` with a `bytes32` commitment (e.g. SHA-256 of canonical JSON from the ZG pipeline).
 */
contract RiskCommitmentAnchor {
    bytes32 public lastCommitment;
    string public lastContextRef;
    address public owner;

    event CommitmentAnchored(
        bytes32 indexed commitment,
        string contextRef,
        uint256 indexed blockNumber,
        uint256 timestamp
    );

    constructor() {
        owner = msg.sender;
    }

    function anchor(bytes32 commitment, string calldata contextRef) external {
        require(msg.sender == owner, "RiskCommitmentAnchor: not owner");
        lastCommitment = commitment;
        lastContextRef = contextRef;
        emit CommitmentAnchored(commitment, contextRef, block.number, block.timestamp);
    }

    function transferOwnership(address newOwner) external {
        require(msg.sender == owner, "RiskCommitmentAnchor: not owner");
        require(newOwner != address(0), "RiskCommitmentAnchor: zero owner");
        owner = newOwner;
    }
}
