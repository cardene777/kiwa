// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPermitToken {
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address owner) external view returns (uint256);
}

/// @notice Permit + 1-tx swap (1:1 fixed rate)
contract PermitSwap {
    IPermitToken public immutable tokenA;
    IPermitToken public immutable tokenB;

    event Swapped(address indexed user, uint256 amountIn, uint256 amountOut);

    constructor(address a, address b) {
        tokenA = IPermitToken(a);
        tokenB = IPermitToken(b);
    }

    /// @notice off-chain permit signature を使い 1 tx で approve + swap
    function permitAndSwap(
        uint256 amountIn,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        tokenA.permit(msg.sender, address(this), amountIn, deadline, v, r, s);
        require(tokenA.transferFrom(msg.sender, address(this), amountIn), "transferFrom failed");
        require(tokenB.transfer(msg.sender, amountIn), "tokenB transfer failed");
        emit Swapped(msg.sender, amountIn, amountIn);
    }
}
