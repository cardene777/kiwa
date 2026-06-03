// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address owner) external view returns (uint256);
}

/// @notice source chain (L1 sim) で token を lock し、operator に Locked event を通知
contract SourceBridge {
    IERC20 public immutable sourceToken;
    address public immutable operator;
    uint256 public nonce;

    mapping(uint256 => bool) public unlocked;

    event Locked(uint256 indexed nonce, address indexed from, address indexed l2Recipient, uint256 amount);
    event Unlocked(uint256 indexed l2Nonce, address indexed l1Recipient, uint256 amount);

    error TransferFailed();
    error NotOperator();
    error AlreadyUnlocked();

    constructor(address token, address op) {
        sourceToken = IERC20(token);
        operator = op;
    }

    /// @notice ユーザーが source chain で token を lock、operator が dest chain で mint
    function bridgeLock(uint256 amount, address l2Recipient) external returns (uint256 currentNonce) {
        if (!sourceToken.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        currentNonce = nonce++;
        emit Locked(currentNonce, msg.sender, l2Recipient, amount);
    }

    /// @notice operator が dest chain で burn 確認後、source chain で unlock
    function unlock(uint256 l2Nonce, address l1Recipient, uint256 amount) external {
        if (msg.sender != operator) revert NotOperator();
        if (unlocked[l2Nonce]) revert AlreadyUnlocked();
        unlocked[l2Nonce] = true;
        if (!sourceToken.transfer(l1Recipient, amount)) revert TransferFailed();
        emit Unlocked(l2Nonce, l1Recipient, amount);
    }
}
