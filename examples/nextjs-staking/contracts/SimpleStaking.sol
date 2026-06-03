// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address owner) external view returns (uint256);
}

/// @notice Minimal Lido / Convex 風 staking pool
/// @dev    stake token と reward token は別物
///         reward rate = block 毎に staked unit * REWARD_RATE_PER_BLOCK / 1e18
contract SimpleStaking {
    IERC20 public immutable stakeToken;
    IERC20 public immutable rewardToken;

    /// 1e15 = 0.001 reward per staked unit per block (= 0.1% / block)
    uint256 public constant REWARD_RATE_PER_BLOCK = 1e15;

    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public lastUpdate;
    mapping(address => uint256) public accruedReward;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event Claimed(address indexed user, uint256 amount);

    error TransferFailed();
    error InsufficientStake();
    error NoReward();

    constructor(address stake, address reward) {
        stakeToken = IERC20(stake);
        rewardToken = IERC20(reward);
    }

    /// @notice 経過 block 分の reward を accrued に加算し、lastUpdate を更新
    function _accrue(address user) internal {
        uint256 staked = stakedBalance[user];
        uint256 last = lastUpdate[user];
        if (staked > 0 && last > 0) {
            uint256 blocks = block.number - last;
            accruedReward[user] += (staked * blocks * REWARD_RATE_PER_BLOCK) / 1e18;
        }
        lastUpdate[user] = block.number;
    }

    function stake(uint256 amount) external {
        if (!stakeToken.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        _accrue(msg.sender);
        stakedBalance[msg.sender] += amount;
        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external {
        if (stakedBalance[msg.sender] < amount) revert InsufficientStake();
        _accrue(msg.sender);
        stakedBalance[msg.sender] -= amount;
        if (!stakeToken.transfer(msg.sender, amount)) revert TransferFailed();
        emit Unstaked(msg.sender, amount);
    }

    function claim() external returns (uint256 payout) {
        _accrue(msg.sender);
        payout = accruedReward[msg.sender];
        if (payout == 0) revert NoReward();
        accruedReward[msg.sender] = 0;
        if (!rewardToken.transfer(msg.sender, payout)) revert TransferFailed();
        emit Claimed(msg.sender, payout);
    }

    /// @notice view で現時点の pending reward を取得 (accrued + 未確定分)
    function pendingReward(address user) external view returns (uint256) {
        uint256 staked = stakedBalance[user];
        uint256 last = lastUpdate[user];
        uint256 accrued = accruedReward[user];
        if (staked == 0 || last == 0) return accrued;
        uint256 blocks = block.number - last;
        return accrued + (staked * blocks * REWARD_RATE_PER_BLOCK) / 1e18;
    }
}
