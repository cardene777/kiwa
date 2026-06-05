// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SimpleAccount.sol";

contract SimpleAccountFactory {
    address public immutable entryPoint;

    event AccountCreated(address indexed owner, address indexed account, uint256 salt);

    constructor(address entryPoint_) {
        entryPoint = entryPoint_;
    }

    function createAccount(address owner, uint256 salt) external returns (address account) {
        account = getAddress(owner, salt);
        if (account.code.length > 0) {
            return account;
        }

        account = address(new SimpleAccount{salt: bytes32(salt)}(owner, entryPoint));
        emit AccountCreated(owner, account, salt);
    }

    function getAddress(address owner, uint256 salt) public view returns (address) {
        bytes memory bytecode = abi.encodePacked(
            type(SimpleAccount).creationCode,
            abi.encode(owner, entryPoint)
        );
        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), bytes32(salt), keccak256(bytecode))
        );
        return address(uint160(uint256(hash)));
    }
}
