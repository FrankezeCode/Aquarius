// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CCIPCoordinator
 * @notice Cross-chain risk coordination contract for Aquarius.
 *         Emits on-chain risk broadcast events that would be picked
 *         up by Chainlink CCIP for cross-chain propagation.
 *
 *         Current: event emission only (stub for hackathon).
 *         Future: integrates with CCIP Router for actual cross-chain messaging.
 */
contract CCIPCoordinator {
    address public admin;
    string[] public registeredChains;
    bool public initialized;

    mapping(bytes32 => bool) public chainRegistered;

    event RiskBroadcast(string riskLevel, uint256 timestamp, address broadcaster);
    event ChainRegistered(string chain);
    event CoordinatorInitialized(address admin, string[] chains);

    constructor() {}

    function initialize(
        address _admin,
        string[] memory _chains
    ) external {
        require(!initialized, "CCIPCoordinator: already initialized");

        admin = _admin;
        registeredChains = _chains;

        for (uint i = 0; i < _chains.length; i++) {
            chainRegistered[keccak256(bytes(_chains[i]))] = true;
            emit ChainRegistered(_chains[i]);
        }

        initialized = true;
        emit CoordinatorInitialized(_admin, _chains);
    }

    /**
     * @notice Broadcast a risk level to all registered chains.
     *         Emits an event that CCIP relayers would pick up.
     */
    function broadcastRisk(string memory riskLevel) external {
        require(initialized, "CCIPCoordinator: not initialized");
        emit RiskBroadcast(riskLevel, block.timestamp, msg.sender);
    }

    function getRegisteredChains() external view returns (string[] memory) {
        return registeredChains;
    }

    function isChainRegistered(string memory chain) external view returns (bool) {
        return chainRegistered[keccak256(bytes(chain))];
    }
}
