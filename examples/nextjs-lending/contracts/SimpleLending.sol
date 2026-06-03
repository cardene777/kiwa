// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address owner) external view returns (uint256);
}

/// @notice Minimal Aave/Compound 風 lending pool
/// @dev    collateral と borrow asset の price は固定 1:1 として簡略化
///         LTV = 75% (collateral * 75 / 100 が借入可能上限)
contract SimpleLending {
    IERC20 public immutable collateralToken;
    IERC20 public immutable borrowToken;

    /// LTV = 7500 / 10000 = 75%
    uint256 public constant LTV_BPS = 7500;
    uint256 public constant BPS_DENOM = 10000;

    mapping(address => uint256) public collateralBalance;
    mapping(address => uint256) public debtBalance;

    event Supplied(address indexed user, uint256 amount);
    event Borrowed(address indexed user, uint256 amount);
    event Repaid(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    error TransferFailed();
    error InsufficientCollateral();
    error ExceedsBorrowCap();
    error NoDebt();

    constructor(address coll, address borrow) {
        collateralToken = IERC20(coll);
        borrowToken = IERC20(borrow);
    }

    function supply(uint256 amount) external {
        if (!collateralToken.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        collateralBalance[msg.sender] += amount;
        emit Supplied(msg.sender, amount);
    }

    function borrow(uint256 amount) external {
        uint256 maxBorrow = (collateralBalance[msg.sender] * LTV_BPS) / BPS_DENOM;
        if (debtBalance[msg.sender] + amount > maxBorrow) revert ExceedsBorrowCap();
        debtBalance[msg.sender] += amount;
        if (!borrowToken.transfer(msg.sender, amount)) revert TransferFailed();
        emit Borrowed(msg.sender, amount);
    }

    function repay(uint256 amount) external {
        if (debtBalance[msg.sender] == 0) revert NoDebt();
        uint256 repayAmount = amount > debtBalance[msg.sender] ? debtBalance[msg.sender] : amount;
        if (!borrowToken.transferFrom(msg.sender, address(this), repayAmount)) revert TransferFailed();
        debtBalance[msg.sender] -= repayAmount;
        emit Repaid(msg.sender, repayAmount);
    }

    function withdraw(uint256 amount) external {
        if (collateralBalance[msg.sender] < amount) revert InsufficientCollateral();
        uint256 remaining = collateralBalance[msg.sender] - amount;
        uint256 maxBorrowAfter = (remaining * LTV_BPS) / BPS_DENOM;
        if (debtBalance[msg.sender] > maxBorrowAfter) revert ExceedsBorrowCap();
        collateralBalance[msg.sender] -= amount;
        if (!collateralToken.transfer(msg.sender, amount)) revert TransferFailed();
        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Health factor (1e18 = 100% safe, < 1e18 = liquidation candidate)
    /// HF = (collateral * LTV_BPS / BPS_DENOM) * 1e18 / debt
    function healthFactor(address user) external view returns (uint256) {
        if (debtBalance[user] == 0) return type(uint256).max;
        uint256 maxBorrow = (collateralBalance[user] * LTV_BPS) / BPS_DENOM;
        return (maxBorrow * 1e18) / debtBalance[user];
    }
}
