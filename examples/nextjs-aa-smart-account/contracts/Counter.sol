// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice test target で smart account.execute から呼ばれる
contract Counter {
    uint256 public count;
    mapping(address => uint256) public countByCaller;

    event Incremented(address indexed caller, uint256 newCount);

    function increment() external {
        count++;
        countByCaller[msg.sender]++;
        emit Incremented(msg.sender, count);
    }
}
