// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AquaAgentPolicyGuard
 * @notice On-chain policy enforcement for Aquarius autonomous agents.
 *         Bounds mitigation actions by amount and frequency.
 *         Reverts with descriptive errors if policy is violated.
 */
contract AquaAgentPolicyGuard {
    address public owner;
    uint256 public maxSingleActionUsd;
    uint256 public maxDailyActionsPerUser;

    mapping(address => uint256) public dailyActionCount;
    mapping(address => uint256) public lastResetTimestamp;

    event PolicyChecked(address indexed user, uint256 amountUsd, bool passed);
    event PolicyUpdated(uint256 maxSingleActionUsd, uint256 maxDailyActions);

    constructor(uint256 _maxSingleActionUsd, uint256 _maxDailyActions) {
        owner = msg.sender;
        maxSingleActionUsd = _maxSingleActionUsd;
        maxDailyActionsPerUser = _maxDailyActions;
    }

    function checkBounds(address user, uint256 amountUsd) external {
        // Reset daily counter if new day
        if (block.timestamp - lastResetTimestamp[user] > 1 days) {
            dailyActionCount[user] = 0;
            lastResetTimestamp[user] = block.timestamp;
        }

        require(amountUsd <= maxSingleActionUsd, "PolicyGuard: exceeds single action limit");
        require(dailyActionCount[user] < maxDailyActionsPerUser, "PolicyGuard: daily limit reached");

        dailyActionCount[user]++;
        emit PolicyChecked(user, amountUsd, true);
    }

    function updatePolicy(uint256 _maxSingleActionUsd, uint256 _maxDailyActions) external {
        require(msg.sender == owner, "PolicyGuard: not owner");
        maxSingleActionUsd = _maxSingleActionUsd;
        maxDailyActionsPerUser = _maxDailyActions;
        emit PolicyUpdated(_maxSingleActionUsd, _maxDailyActions);
    }

    function resetDaily(address user) external {
        require(msg.sender == owner, "PolicyGuard: not owner");
        dailyActionCount[user] = 0;
        lastResetTimestamp[user] = block.timestamp;
    }
}
