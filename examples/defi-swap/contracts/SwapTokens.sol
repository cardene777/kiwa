// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Minimal ERC20 implementation for swap example (no OpenZeppelin)
contract Erc20 {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    error InsufficientBalance();
    error InsufficientAllowance();

    constructor(string memory n, string memory s, uint256 initialSupply, address recipient) {
        name = n;
        symbol = s;
        totalSupply = initialSupply;
        balanceOf[recipient] = initialSupply;
        emit Transfer(address(0), recipient, initialSupply);
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transfer(address to, uint256 value) external returns (bool) {
        if (balanceOf[msg.sender] < value) revert InsufficientBalance();
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 a = allowance[from][msg.sender];
        if (a < value) revert InsufficientAllowance();
        if (balanceOf[from] < value) revert InsufficientBalance();
        if (a != type(uint256).max) {
            allowance[from][msg.sender] = a - value;
        }
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
        return true;
    }
}

interface IErc20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address owner) external view returns (uint256);
}

/// @notice Simple 1:1 swap pool (TokenA → TokenB at fixed rate)
contract SimpleSwap {
    IErc20 public immutable tokenA;
    IErc20 public immutable tokenB;

    event Swapped(address indexed user, uint256 amountIn, uint256 amountOut);

    error TransferInFailed();
    error TransferOutFailed();

    constructor(address a, address b) {
        tokenA = IErc20(a);
        tokenB = IErc20(b);
    }

    /// @notice Swap amountIn of tokenA for the same amount of tokenB (1:1).
    function swapAforB(uint256 amountIn) external {
        if (!tokenA.transferFrom(msg.sender, address(this), amountIn)) revert TransferInFailed();
        if (!tokenB.transfer(msg.sender, amountIn)) revert TransferOutFailed();
        emit Swapped(msg.sender, amountIn, amountIn);
    }
}
