// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IERC20.sol";

/**
 * @title AquariusPerChainVault
 * @notice Per-chain ERC-20 share vault — deploy **once per chain** (per asset) with that
 *         network's `deploymentChainId` and `chainKey`. Holds a single underlying asset;
 *         staking / strategy adapters are added later behind governance and audits.
 *
 *         Security: non-reentrant deposit/withdraw; pausable; owner transfer.
 */
contract AquariusPerChainVault {
    IERC20 public immutable asset;
    /// @notice EVM chain id where this contract is deployed (e.g. 1, 137, 42161).
    uint256 public immutable deploymentChainId;
    /// @notice Indexing label, e.g. keccak256("ETHEREUM").
    bytes32 public immutable chainKey;

    address public owner;

    uint256 private _entered;
    bool public paused;

    mapping(address => uint256) public balanceOf;
    uint256 public totalShares;
    uint256 public totalAssets;

    event Deposit(address indexed user, uint256 assetsIn, uint256 sharesMinted);
    event Withdraw(address indexed user, uint256 sharesBurned, uint256 assetsOut);
    event Paused(address account);
    event Unpaused(address account);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "AquariusPerChainVault: not owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "AquariusPerChainVault: paused");
        _;
    }

    modifier nonReentrant() {
        require(_entered == 1, "AquariusPerChainVault: reentrant");
        _entered = 2;
        _;
        _entered = 1;
    }

    constructor(
        IERC20 asset_,
        uint256 deploymentChainId_,
        bytes32 chainKey_,
        address initialOwner
    ) {
        require(address(asset_) != address(0), "AquariusPerChainVault: zero asset");
        require(initialOwner != address(0), "AquariusPerChainVault: zero owner");
        asset = asset_;
        deploymentChainId = deploymentChainId_;
        chainKey = chainKey_;
        owner = initialOwner;
        _entered = 1;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "AquariusPerChainVault: zero owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setPaused(bool p) external onlyOwner {
        paused = p;
        if (p) emit Paused(msg.sender);
        else emit Unpaused(msg.sender);
    }

    /**
     * @notice Deposit underlying; mint vault shares.
     */
    function deposit(uint256 assets) external whenNotPaused nonReentrant returns (uint256 shares) {
        require(assets > 0, "AquariusPerChainVault: zero deposit");
        require(
            asset.transferFrom(msg.sender, address(this), assets),
            "AquariusPerChainVault: transferFrom failed"
        );

        if (totalShares == 0 || totalAssets == 0) {
            shares = assets;
        } else {
            shares = (assets * totalShares) / totalAssets;
        }
        require(shares > 0, "AquariusPerChainVault: zero shares");

        balanceOf[msg.sender] += shares;
        totalShares += shares;
        totalAssets += assets;

        emit Deposit(msg.sender, assets, shares);
    }

    /**
     * @notice Burn shares; receive underlying pro-rata.
     */
    function withdraw(uint256 shares) external whenNotPaused nonReentrant returns (uint256 assetsOut) {
        require(shares > 0, "AquariusPerChainVault: zero shares");
        require(shares <= balanceOf[msg.sender], "AquariusPerChainVault: exceeds balance");

        assetsOut = (shares * totalAssets) / totalShares;
        require(assetsOut > 0, "AquariusPerChainVault: zero out");

        balanceOf[msg.sender] -= shares;
        totalShares -= shares;
        totalAssets -= assetsOut;

        require(asset.transfer(msg.sender, assetsOut), "AquariusPerChainVault: transfer failed");

        emit Withdraw(msg.sender, shares, assetsOut);
    }

    function sharesOf(address user) external view returns (uint256) {
        return balanceOf[user];
    }
}
