// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IERC20.sol";
import "./interfaces/IPool.sol";

/**
 * @title MitigationExecutor
 * @notice Non-custodial executor for Aquarius risk mitigation.
 *         Users pre-approve bounded spending limits. The executor
 *         can then repay debt or supply collateral on their behalf
 *         without ever holding their private keys.
 *
 *         All actions are gated by:
 *           1. User approval mapping (bounded amount per token)
 *           2. AquaAgentPolicyGuard (frequency + size limits)
 */
contract MitigationExecutor {
    address public policyGuard;
    address public aavePool;
    address public owner;

    // user => token => max approved amount
    mapping(address => mapping(address => uint256)) public approvals;

    event ApprovalSet(address indexed user, address indexed token, uint256 maxAmount);
    event MitigationExecuted(address indexed user, string action, address asset, uint256 amount, bool success);

    constructor(address _aavePool, address _policyGuard) {
        aavePool = _aavePool;
        policyGuard = _policyGuard;
        owner = msg.sender;
    }

    /**
     * @notice User sets their approval for a specific token.
     *         This bounds the maximum the executor can use for mitigation.
     */
    function setApproval(address token, uint256 maxAmount) external {
        approvals[msg.sender][token] = maxAmount;
        emit ApprovalSet(msg.sender, token, maxAmount);
    }

    /**
     * @notice Repay debt on behalf of a user using their pre-approved tokens.
     * @param user The position owner
     * @param asset The debt asset to repay
     * @param amount The amount to repay
     */
    function repayOnBehalf(address user, address asset, uint256 amount) external {
        require(approvals[user][asset] >= amount, "MitigationExecutor: insufficient approval");

        // Check policy guard bounds
        (bool guardOk,) = policyGuard.call(
            abi.encodeWithSignature("checkBounds(address,uint256)", user, amount)
        );
        require(guardOk, "MitigationExecutor: policy guard rejected");

        // Reduce approval
        approvals[user][asset] -= amount;

        // Transfer tokens from user to this contract
        IERC20(asset).transferFrom(user, address(this), amount);

        // Approve pool to spend
        IERC20(asset).approve(aavePool, amount);

        // Repay on behalf of user (interest rate mode 2 = variable)
        IPool(aavePool).repay(asset, amount, 2, user);

        emit MitigationExecuted(user, "REPAY_DEBT", asset, amount, true);
    }

    /**
     * @notice Supply collateral on behalf of a user.
     * @param user The position owner
     * @param asset The collateral asset to supply
     * @param amount The amount to supply
     */
    function supplyOnBehalf(address user, address asset, uint256 amount) external {
        require(approvals[user][asset] >= amount, "MitigationExecutor: insufficient approval");

        (bool guardOk,) = policyGuard.call(
            abi.encodeWithSignature("checkBounds(address,uint256)", user, amount)
        );
        require(guardOk, "MitigationExecutor: policy guard rejected");

        approvals[user][asset] -= amount;

        IERC20(asset).transferFrom(user, address(this), amount);
        IERC20(asset).approve(aavePool, amount);
        IPool(aavePool).supply(asset, amount, user, 0);

        emit MitigationExecuted(user, "ADD_COLLATERAL", asset, amount, true);
    }
}
