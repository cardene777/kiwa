// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SmartAccount.sol";

/// @notice deterministic deploy で SmartAccount を生成
contract AccountFactory {
    address public immutable entryPoint;

    event AccountCreated(address indexed owner, address indexed account);

    constructor(address _entryPoint) {
        entryPoint = _entryPoint;
    }

    /// @notice 同じ owner + salt で常に同じ address に deploy される
    function createAccount(address owner, uint256 salt) external returns (address account) {
        bytes32 saltBytes = bytes32(salt);
        SmartAccount sa = new SmartAccount{salt: saltBytes}(owner, entryPoint);
        account = address(sa);
        emit AccountCreated(owner, account);
    }

    /// @notice 事前に deploy 先 address を計算 (counterfactual deployment)
    function getAddress(address owner, uint256 salt) external view returns (address) {
        bytes memory bytecode = abi.encodePacked(
            type(SmartAccount).creationCode,
            abi.encode(owner, entryPoint)
        );
        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), bytes32(salt), keccak256(bytecode))
        );
        return address(uint160(uint256(hash)));
    }
}
