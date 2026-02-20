// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AquaAgent
 * @notice On-chain autonomous agent orchestrator for Aquarius.
 *         Routes mitigation actions to the appropriate executor:
 *           - "partialRepay" → MitigationExecutor.repayOnBehalf()
 *           - "vaultInject"  → BufferVault.injectLiquidity()
 *
 *         Maintains a list of approved actions for policy transparency.
 */
contract AquaAgent {
    address public executor;
    address public vault;
    address public policyGuard;
    address public owner;
    string[] public approvedActions;
    bool public initialized;

    mapping(bytes32 => bool) public actionApproved;

    event AgentInitialized(address executor, address vault, string[] actions);
    event ActionExecuted(string action, address user, address asset, uint256 amount, bool success);

    constructor() {
        owner = msg.sender;
    }

    function initialize(
        address _executor,
        address _vault,
        address _policyGuard,
        string[] memory _actions
    ) external {
        require(!initialized, "AquaAgent: already initialized");
        require(msg.sender == owner, "AquaAgent: not owner");

        executor = _executor;
        vault = _vault;
        policyGuard = _policyGuard;
        approvedActions = _actions;

        for (uint i = 0; i < _actions.length; i++) {
            actionApproved[keccak256(bytes(_actions[i]))] = true;
        }

        initialized = true;
        emit AgentInitialized(_executor, _vault, _actions);
    }

    /**
     * @notice Execute a mitigation action on behalf of a user.
     * @param action The action identifier (e.g., "partialRepay", "vaultInject")
     * @param user The position owner to protect
     * @param asset The asset involved in the mitigation
     * @param amount The amount to use
     */
    function executeAction(
        string memory action,
        address user,
        address asset,
        uint256 amount
    ) external {
        require(initialized, "AquaAgent: not initialized");
        require(actionApproved[keccak256(bytes(action))], "AquaAgent: action not approved");

        bytes32 actionHash = keccak256(bytes(action));
        bool success;

        if (actionHash == keccak256("partialRepay")) {
            (success,) = executor.call(
                abi.encodeWithSignature(
                    "repayOnBehalf(address,address,uint256)",
                    user, asset, amount
                )
            );
        } else if (actionHash == keccak256("vaultInject")) {
            (success,) = vault.call(
                abi.encodeWithSignature(
                    "injectLiquidity(address,address,uint256)",
                    user, asset, amount
                )
            );
        } else if (actionHash == keccak256("addCollateral")) {
            (success,) = executor.call(
                abi.encodeWithSignature(
                    "supplyOnBehalf(address,address,uint256)",
                    user, asset, amount
                )
            );
        }

        emit ActionExecuted(action, user, asset, amount, success);
    }

    function getApprovedActions() external view returns (string[] memory) {
        return approvedActions;
    }

    function isActionApproved(string memory action) external view returns (bool) {
        return actionApproved[keccak256(bytes(action))];
    }
}
