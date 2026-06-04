// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address owner) external view returns (uint256);
}

interface IPriceOracle {
    function getPrice(address asset) external view returns (uint256);
}

/// @notice Minimal Aave/Compound 風 lending pool
/// @dev    collateral と borrow asset の price は固定 1:1 として簡略化
///         LTV = 75% (collateral * 75 / 100 が借入可能上限)
contract SimpleLending {
    IERC20 public immutable collateralToken;
    IERC20 public immutable borrowToken;
    IPriceOracle public immutable priceOracle;

    uint256 public constant LTV_LIMIT = 75;
    /// LTV = 7500 / 10000 = 75%
    uint256 public constant LTV_BPS = 7500;
    uint256 public constant BPS_DENOM = 10000;
    uint256 public constant PRICE_SCALE = 1e18;
    uint256 public constant LIQUIDATION_THRESHOLD_BPS = 10500;

    mapping(address => uint256) public collateralBalance;
    mapping(address => uint256) public debtBalance;

    event Supplied(address indexed user, uint256 amount);
    event Borrowed(address indexed user, uint256 amount);
    event Repaid(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event Liquidated(
        address indexed borrower, address indexed liquidator, uint256 repaidDebt, uint256 seizedCollateral
    );

    error TransferFailed();
    error InsufficientCollateral();
    error MaxLTVExceeded(uint256 requestedDebt, uint256 maxDebt);
    error NoDebt();
    error PositionHealthy(uint256 collateralValue, uint256 liquidationThreshold);

    constructor(address coll, address borrow, address oracle) {
        collateralToken = IERC20(coll);
        borrowToken = IERC20(borrow);
        priceOracle = IPriceOracle(oracle);
    }

    function supply(uint256 amount) external {
        if (!collateralToken.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        collateralBalance[msg.sender] += amount;
        emit Supplied(msg.sender, amount);
    }

    function borrow(uint256 amount) external {
        uint256 nextDebt = debtBalance[msg.sender] + amount;
        uint256 maxBorrow = _maxBorrow(msg.sender);
        if (nextDebt > maxBorrow) revert MaxLTVExceeded(nextDebt, maxBorrow);
        debtBalance[msg.sender] = nextDebt;
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
        uint256 maxBorrowAfter = _maxBorrowFromCollateral(remaining);
        if (debtBalance[msg.sender] > maxBorrowAfter) {
            revert MaxLTVExceeded(debtBalance[msg.sender], maxBorrowAfter);
        }
        collateralBalance[msg.sender] -= amount;
        if (!collateralToken.transfer(msg.sender, amount)) revert TransferFailed();
        emit Withdrawn(msg.sender, amount);
    }

    function liquidate(address borrower) external {
        uint256 debt = debtBalance[borrower];
        if (debt == 0) revert NoDebt();

        uint256 collateralValue = _collateralValueFromAmount(collateralBalance[borrower]);
        uint256 liquidationThreshold = (debt * LIQUIDATION_THRESHOLD_BPS) / BPS_DENOM;
        if (collateralValue >= liquidationThreshold) {
            revert PositionHealthy(collateralValue, liquidationThreshold);
        }

        uint256 collateralAmount = collateralBalance[borrower];
        debtBalance[borrower] = 0;
        collateralBalance[borrower] = 0;

        if (!borrowToken.transferFrom(msg.sender, address(this), debt)) revert TransferFailed();
        if (!collateralToken.transfer(msg.sender, collateralAmount)) revert TransferFailed();
        emit Liquidated(borrower, msg.sender, debt, collateralAmount);
    }

    /// @notice Health factor (1e18 = 100% safe, < 1e18 = liquidation candidate)
    /// HF = (collateral * LTV_BPS / BPS_DENOM) * 1e18 / debt
    function healthFactor(address user) external view returns (uint256) {
        if (debtBalance[user] == 0) return type(uint256).max;
        uint256 maxBorrow = _maxBorrow(user);
        return (maxBorrow * 1e18) / debtBalance[user];
    }

    function collateralValue(address user) external view returns (uint256) {
        return _collateralValueFromAmount(collateralBalance[user]);
    }

    function _maxBorrow(address user) internal view returns (uint256) {
        return _maxBorrowFromCollateral(collateralBalance[user]);
    }

    function _maxBorrowFromCollateral(uint256 collateralAmount) internal view returns (uint256) {
        return (_collateralValueFromAmount(collateralAmount) * LTV_LIMIT) / 100;
    }

    function _collateralValueFromAmount(uint256 collateralAmount) internal view returns (uint256) {
        return (collateralAmount * priceOracle.getPrice(address(collateralToken))) / PRICE_SCALE;
    }
}
