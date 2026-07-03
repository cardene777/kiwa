// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ERC20.sol";

/// @title Vault (invariant-fuzz dogfood)
/// @notice Deposit / withdraw + share accounting. Users deposit an `ERC20`
///         asset and receive shares proportional to their contribution.
///         Withdrawal burns shares and returns assets pro-rata.
///
///         Top-level invariants for the harness:
///           1. `totalShares == sum(shares[account])`
///           2. `totalAssets >= vaultBalance` NEVER — vault must hold at
///              least what its accounting claims.
///           3. If `totalShares == 0` then `totalAssets == 0`.
///
///         The first depositor establishes the share-per-asset ratio (1:1).
///         Subsequent depositors mint shares as
///         `amount * totalShares / totalAssets` which preserves the
///         proportional accounting property.
contract Vault {
    ERC20 public immutable asset;

    uint256 public totalShares;
    uint256 public totalAssets;
    mapping(address => uint256) public shares;

    event Deposit(address indexed account, uint256 assets, uint256 shares);
    event Withdraw(address indexed account, uint256 assets, uint256 shares);

    constructor(ERC20 _asset) {
        asset = _asset;
    }

    /// @notice Deposit `amount` of `asset` and mint shares.
    function deposit(uint256 amount) external returns (uint256 mintedShares) {
        require(amount > 0, "deposit: zero");
        // Pull assets from the caller. `transferFrom` reverts on insufficient
        // allowance or balance, so we do not need explicit checks here.
        require(asset.transferFrom(msg.sender, address(this), amount), "deposit: transfer");
        if (totalShares == 0) {
            // First depositor establishes 1:1 share:asset ratio.
            mintedShares = amount;
        } else {
            mintedShares = (amount * totalShares) / totalAssets;
            require(mintedShares > 0, "deposit: dust");
        }
        totalShares += mintedShares;
        totalAssets += amount;
        shares[msg.sender] += mintedShares;
        emit Deposit(msg.sender, amount, mintedShares);
    }

    /// @notice Burn `shareAmount` shares and return the proportional assets.
    function withdraw(uint256 shareAmount) external returns (uint256 assetsOut) {
        require(shareAmount > 0, "withdraw: zero");
        require(shares[msg.sender] >= shareAmount, "withdraw: shares");
        assetsOut = (shareAmount * totalAssets) / totalShares;
        require(assetsOut > 0, "withdraw: dust");
        totalShares -= shareAmount;
        totalAssets -= assetsOut;
        shares[msg.sender] -= shareAmount;
        require(asset.transfer(msg.sender, assetsOut), "withdraw: transfer");
        emit Withdraw(msg.sender, assetsOut, shareAmount);
    }

    /// @notice Convenience view — how much asset the vault physically holds.
    ///         In this minimal design it should always equal `totalAssets`;
    ///         invariant `Vault_002` locks the relation.
    function vaultBalance() external view returns (uint256) {
        return asset.balanceOf(address(this));
    }
}
