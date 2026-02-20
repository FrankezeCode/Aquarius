// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IERC20.sol";
import "./interfaces/IPool.sol";

/**
 * @title BufferVault
 * @notice Pooled protection vault for Aquarius.
 *         Users deposit collateral (e.g., WETH) and receive aqShares
 *         representing their proportional claim on vault assets.
 *         On escalation, the vault can inject liquidity to protect
 *         any user's position by repaying debt from pooled reserves.
 *
 *         Mirrors the TypeScript domain model: AqAsset + CollateralAsset.
 */
contract BufferVault {
    IERC20 public underlyingAsset;
    address public aavePool;
    address public riskManager;
    address public owner;

    mapping(address => uint256) public deposits;
    mapping(address => uint256) public aqShares;
    uint256 public totalDeposits;
    uint256 public totalShares;

    bool public initialized;

    event Deposit(address indexed user, uint256 amount, uint256 sharesMinted);
    event Withdraw(address indexed user, uint256 shares, uint256 amountReturned);
    event LiquidityInjected(address indexed beneficiary, address debtAsset, uint256 amount);

    constructor(address _underlyingAsset, address _aavePool) {
        underlyingAsset = IERC20(_underlyingAsset);
        aavePool = _aavePool;
        owner = msg.sender;
    }

    function initialize(address _riskManager) external {
        require(!initialized, "BufferVault: already initialized");
        require(msg.sender == owner, "BufferVault: not owner");
        riskManager = _riskManager;
        initialized = true;
    }

    /**
     * @notice Deposit underlying asset into the vault.
     *         Mints aqShares proportional to deposit / totalDeposits.
     */
    function deposit(uint256 amount) external {
        require(amount > 0, "BufferVault: zero deposit");

        underlyingAsset.transferFrom(msg.sender, address(this), amount);

        uint256 sharesToMint;
        if (totalShares == 0 || totalDeposits == 0) {
            sharesToMint = amount;
        } else {
            sharesToMint = (amount * totalShares) / totalDeposits;
        }

        deposits[msg.sender] += amount;
        aqShares[msg.sender] += sharesToMint;
        totalDeposits += amount;
        totalShares += sharesToMint;

        emit Deposit(msg.sender, amount, sharesToMint);
    }

    /**
     * @notice Withdraw underlying by burning aqShares.
     */
    function withdraw(uint256 shares) external {
        require(shares > 0 && shares <= aqShares[msg.sender], "BufferVault: invalid shares");

        uint256 amountToReturn = (shares * totalDeposits) / totalShares;

        aqShares[msg.sender] -= shares;
        totalShares -= shares;
        totalDeposits -= amountToReturn;
        if (deposits[msg.sender] > amountToReturn) {
            deposits[msg.sender] -= amountToReturn;
        } else {
            deposits[msg.sender] = 0;
        }

        underlyingAsset.transfer(msg.sender, amountToReturn);

        emit Withdraw(msg.sender, shares, amountToReturn);
    }

    /**
     * @notice Inject liquidity from vault reserves to protect a position.
     *         Called by MitigationExecutor or AquaAgent during escalation.
     *         Repays debt on behalf of the beneficiary from pooled funds.
     */
    function injectLiquidity(
        address beneficiary,
        address debtAsset,
        uint256 amount
    ) external {
        require(amount <= totalDeposits, "BufferVault: insufficient reserves");

        // If debtAsset == underlyingAsset, use vault reserves directly
        // Otherwise, this would need a swap (future extension)
        IERC20(debtAsset).approve(aavePool, amount);
        IPool(aavePool).repay(debtAsset, amount, 2, beneficiary);

        totalDeposits -= amount;

        emit LiquidityInjected(beneficiary, debtAsset, amount);
    }

    function totalAssets() external view returns (uint256) {
        return totalDeposits;
    }

    function sharesOf(address user) external view returns (uint256) {
        return aqShares[user];
    }
}
