// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice past event + リアルタイム event 両方を test するための minimal emitter
contract EventEmitter {
    uint256 public totalLogs;

    event Logged(address indexed sender, uint256 indexed value, string message);

    function emitLog(uint256 value, string calldata message) external {
        totalLogs++;
        emit Logged(msg.sender, value, message);
    }
}
