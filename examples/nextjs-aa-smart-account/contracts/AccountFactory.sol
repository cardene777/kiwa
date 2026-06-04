// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SmartAccount.sol";

/// @notice deterministic deploy で SmartAccount を生成
contract AccountFactory {
    address public immutable entryPoint;
    uint256 public immutable recoveryThreshold;
    address[] private _guardians;

    event AccountCreated(address indexed owner, address indexed account);

    constructor(address _entryPoint, address[] memory guardians, uint256 _recoveryThreshold) {
        entryPoint = _entryPoint;
        recoveryThreshold = _recoveryThreshold;
        _guardians = guardians;
    }

    /// @notice 同じ owner + salt で常に同じ address に deploy される
    function createAccount(address owner, uint256 salt) external returns (address account) {
        bytes32 saltBytes = bytes32(salt);
        SmartAccount sa = new SmartAccount{salt: saltBytes}(
            owner,
            entryPoint,
            _guardianList(),
            recoveryThreshold
        );
        account = address(sa);
        emit AccountCreated(owner, account);
    }

    /// @notice 事前に deploy 先 address を計算 (counterfactual deployment)
    function getAddress(address owner, uint256 salt) external view returns (address) {
        bytes memory bytecode = abi.encodePacked(
            type(SmartAccount).creationCode,
            abi.encode(owner, entryPoint, _guardianList(), recoveryThreshold)
        );
        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), bytes32(salt), keccak256(bytecode))
        );
        return address(uint160(uint256(hash)));
    }

    function guardianAt(uint256 index) external view returns (address) {
        return _guardians[index];
    }

    function guardianCount() external view returns (uint256) {
        return _guardians.length;
    }

    function _guardianList() internal view returns (address[] memory guardians) {
        guardians = new address[](_guardians.length);
        for (uint256 i = 0; i < _guardians.length; i++) {
            guardians[i] = _guardians[i];
        }
    }
}
