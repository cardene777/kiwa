// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Minimal smart account (ERC-4337 簡略版) - execute() + ERC-1271 isValidSignature
contract SmartAccount {
    /// ERC-1271 magic value
    bytes4 public constant MAGICVALUE = 0x1626ba7e;

    address public immutable owner;
    address public immutable entryPoint;

    event Executed(address indexed target, uint256 value, bytes data);

    error NotAuthorized();
    error CallFailed();

    constructor(address _owner, address _entryPoint) {
        owner = _owner;
        entryPoint = _entryPoint;
    }

    /// @notice owner or entryPoint だけが execute 可能
    function execute(address target, uint256 value, bytes calldata data) external returns (bytes memory result) {
        if (msg.sender != owner && msg.sender != entryPoint) revert NotAuthorized();
        (bool ok, bytes memory ret) = target.call{value: value}(data);
        if (!ok) revert CallFailed();
        emit Executed(target, value, data);
        return ret;
    }

    /// @notice ERC-1271: hash を owner が sign したか確認
    function isValidSignature(bytes32 hash, bytes calldata signature)
        external
        view
        returns (bytes4)
    {
        if (signature.length != 65) return 0xffffffff;
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }
        // ethSignedMessageHash 経由で recover
        bytes32 ethSignedHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
        );
        address recovered = ecrecover(ethSignedHash, v, r, s);
        if (recovered == owner) return MAGICVALUE;
        // raw hash でも試す
        address rawRecovered = ecrecover(hash, v, r, s);
        if (rawRecovered == owner) return MAGICVALUE;
        return 0xffffffff;
    }

    receive() external payable {}
}
