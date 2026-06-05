// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./UserOperation.sol";

contract SimpleAccount {
    bytes4 public constant MAGICVALUE = 0x1626ba7e;

    address public immutable entryPoint;
    address public owner;
    uint256 public nonce;

    error ExecutionFailed();
    error InvalidNonce(uint256 expected, uint256 actual);
    error InvalidSignature();
    error NotAuthorized();
    error ZeroAddress();

    constructor(address owner_, address entryPoint_) {
        if (owner_ == address(0) || entryPoint_ == address(0)) revert ZeroAddress();
        owner = owner_;
        entryPoint = entryPoint_;
    }

    function validateUserOp(UserOperation calldata userOp, bytes32 userOpHash) external {
        if (msg.sender != entryPoint) revert NotAuthorized();
        if (userOp.nonce != nonce) revert InvalidNonce(nonce, userOp.nonce);
        if (!_isValidOwnerSignature(userOpHash, userOp.signature)) revert InvalidSignature();
        nonce++;
    }

    function execute(address target, uint256 value, bytes calldata data)
        external
        returns (bytes memory result)
    {
        if (msg.sender != owner && msg.sender != entryPoint) revert NotAuthorized();
        (bool ok, bytes memory ret) = target.call{value: value}(data);
        if (!ok) revert ExecutionFailed();
        return ret;
    }

    function isValidSignature(bytes32 hash, bytes calldata signature)
        external
        view
        returns (bytes4)
    {
        return _isValidOwnerSignature(hash, signature) ? MAGICVALUE : bytes4(0xffffffff);
    }

    function _isValidOwnerSignature(bytes32 hash, bytes calldata signature)
        internal
        view
        returns (bool)
    {
        if (signature.length != 65) {
            return false;
        }

        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }

        address rawRecovered = ecrecover(hash, v, r, s);
        if (rawRecovered == owner) {
            return true;
        }

        bytes32 ethSignedHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
        );
        return ecrecover(ethSignedHash, v, r, s) == owner;
    }

    receive() external payable {}
}
