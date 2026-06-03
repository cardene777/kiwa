// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address owner) external view returns (uint256);
}

/// @notice cliff + linear vesting (OpenZeppelin VestingWallet 互換の最小実装)
/// @dev    block.timestamp ベースで vested 量を計算
///         cliff 前は 0、cliff 通過後は線形 release、start + duration で全額 release
contract TokenVesting {
    IERC20 public immutable token;
    address public immutable beneficiary;
    uint64 public immutable start;
    uint64 public immutable cliff;
    uint64 public immutable duration;
    uint256 public immutable total;

    uint256 public released;

    event Released(uint256 amount);

    error NotBeneficiary();
    error TransferFailed();

    constructor(
        address tokenAddr,
        address beneficiaryAddr,
        uint64 startTime,
        uint64 cliffDuration,
        uint64 vestingDuration,
        uint256 totalAmount
    ) {
        token = IERC20(tokenAddr);
        beneficiary = beneficiaryAddr;
        start = startTime;
        cliff = startTime + cliffDuration;
        duration = vestingDuration;
        total = totalAmount;
    }

    /// @notice timestamp 時点で vest 済の累積量を返す
    function vestedAmount(uint64 timestamp) public view returns (uint256) {
        if (timestamp < cliff) return 0;
        if (timestamp >= start + duration) return total;
        return (total * (timestamp - start)) / duration;
    }

    /// @notice 現時点で release 可能な量 (vested - released)
    function releasable() public view returns (uint256) {
        return vestedAmount(uint64(block.timestamp)) - released;
    }

    /// @notice releasable 分を beneficiary へ transfer (誰でも呼べる、二重 claim は 0 返却で no-op)
    function release() external returns (uint256 amount) {
        amount = releasable();
        released += amount;
        if (amount > 0) {
            if (!token.transfer(beneficiary, amount)) revert TransferFailed();
            emit Released(amount);
        }
    }
}
