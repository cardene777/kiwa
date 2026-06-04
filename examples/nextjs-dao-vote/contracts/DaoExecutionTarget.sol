// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DaoExecutionTarget {
    address public immutable dao;
    uint256 public lastValue;
    uint256 public executeCount;

    event ValueSet(uint256 value, uint256 executeCount);

    error NotDao();

    constructor(address dao_) {
        dao = dao_;
    }

    function setValue(uint256 value) external {
        if (msg.sender != dao) revert NotDao();
        lastValue = value;
        executeCount++;
        emit ValueSet(value, executeCount);
    }
}
