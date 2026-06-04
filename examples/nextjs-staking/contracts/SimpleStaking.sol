// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address owner) external view returns (uint256);
}

/// @notice Minimal Lido / Convex 風 staking pool
/// @dev    stake token と reward token は別物
///         reward は seconds 単位で rewardPerToken に蓄積する
contract SimpleStaking {
    IERC20 public immutable stakeToken;
    IERC20 public immutable rewardToken;
    address public immutable controller;
    uint256 public immutable rewardRate;

    uint256 public constant REWARD_PRECISION = 1e18;
    uint256 public constant MIN_STAKE_DURATION = 7 days;
    uint256 public constant PENALTY_RATE = 10;

    uint256 public totalStaked;
    uint256 public rewardPerTokenStored;
    uint256 public lastUpdateTime;
    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public accruedReward;
    mapping(address => uint256) public stakeStartedAt;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount, uint256 returnedAmount, uint256 penaltyAmount);
    event Claimed(address indexed user, uint256 amount);
    event PenaltyPaid(address indexed user, uint256 amount, address indexed controller);

    error TransferFailed();
    error InsufficientStake();
    error NoReward();
    error InvalidController();

    constructor(address stake, address reward, address daoController, uint256 rewardRatePerSecond) {
        if (daoController == address(0)) revert InvalidController();
        stakeToken = IERC20(stake);
        rewardToken = IERC20(reward);
        controller = daoController;
        rewardRate = rewardRatePerSecond;
        lastUpdateTime = block.timestamp;
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) return rewardPerTokenStored;
        uint256 elapsed = block.timestamp - lastUpdateTime;
        return rewardPerTokenStored + (rewardRate * elapsed * REWARD_PRECISION) / totalStaked;
    }

    function _pendingReward(address user) internal view returns (uint256) {
        return accruedReward[user]
            + (stakedBalance[user] * (rewardPerToken() - userRewardPerTokenPaid[user])) / REWARD_PRECISION;
    }

    function _accrue(address user) internal {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;

        if (user != address(0)) {
            accruedReward[user] = _pendingReward(user);
            userRewardPerTokenPaid[user] = rewardPerTokenStored;
        }
    }

    function stake(uint256 amount) external {
        _accrue(msg.sender);
        uint256 currentStake = stakedBalance[msg.sender];
        if (!stakeToken.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        stakedBalance[msg.sender] = currentStake + amount;
        totalStaked += amount;
        if (currentStake == 0) {
            stakeStartedAt[msg.sender] = block.timestamp;
        }
        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external {
        if (stakedBalance[msg.sender] < amount) revert InsufficientStake();
        _accrue(msg.sender);

        stakedBalance[msg.sender] -= amount;
        totalStaked -= amount;

        uint256 penaltyAmount;
        if (block.timestamp - stakeStartedAt[msg.sender] < MIN_STAKE_DURATION) {
            penaltyAmount = (amount * PENALTY_RATE) / 100;
            if (penaltyAmount > 0) {
                if (!stakeToken.transfer(controller, penaltyAmount)) revert TransferFailed();
                emit PenaltyPaid(msg.sender, penaltyAmount, controller);
            }
        }

        uint256 payout = amount - penaltyAmount;
        if (payout > 0) {
            if (!stakeToken.transfer(msg.sender, payout)) revert TransferFailed();
        }
        if (stakedBalance[msg.sender] == 0) {
            stakeStartedAt[msg.sender] = 0;
        }
        emit Unstaked(msg.sender, amount, payout, penaltyAmount);
    }

    function claim() external returns (uint256 payout) {
        _accrue(msg.sender);
        uint256 accrued = accruedReward[msg.sender];
        if (accrued == 0) revert NoReward();

        uint256 rewardPool = rewardToken.balanceOf(address(this));
        if (rewardPool == 0) revert NoReward();

        payout = accrued > rewardPool ? rewardPool : accrued;
        accruedReward[msg.sender] = accrued - payout;
        if (!rewardToken.transfer(msg.sender, payout)) revert TransferFailed();
        emit Claimed(msg.sender, payout);
    }

    /// @notice view で現時点の pending reward を取得 (accrued + 未確定分)
    function pendingReward(address user) external view returns (uint256) {
        return _pendingReward(user);
    }
}
