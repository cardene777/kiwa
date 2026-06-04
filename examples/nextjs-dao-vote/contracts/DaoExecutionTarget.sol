// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DaoExecutionTarget {
    uint256 public lastValue;
    uint256 public executeCount;

    event ValueSet(uint256 value, uint256 executeCount);

    function setValue(uint256 value) external {
        lastValue = value;
        executeCount++;
        emit ValueSet(value, executeCount);
    }
}
