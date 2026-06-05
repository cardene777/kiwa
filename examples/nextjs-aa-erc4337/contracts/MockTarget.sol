// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockTarget {
    uint256 public counter;

    event Incremented(address indexed caller, uint256 newValue);

    function increment() external {
        counter += 1;
        emit Incremented(msg.sender, counter);
    }
}
