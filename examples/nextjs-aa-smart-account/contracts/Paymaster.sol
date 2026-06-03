// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ISmartAccount {
    function execute(address target, uint256 value, bytes calldata data) external returns (bytes memory);
}

/// @notice paymaster は user の代わりに smart account.execute を呼んで gas を負担する
/// @dev    real ERC-4337 paymaster は UserOp の paymasterAndData を検証するが、
///         本 example では「paymaster が entryPoint として smart account.execute を呼ぶ」簡略版
contract Paymaster {
    uint256 public sponsoredCount;

    event Sponsored(address indexed account, address indexed target, bytes data);

    error CallFailed();

    function sponsorAndExecute(
        address account,
        address target,
        uint256 value,
        bytes calldata data
    ) external returns (bytes memory result) {
        result = ISmartAccount(account).execute(target, value, data);
        sponsoredCount++;
        emit Sponsored(account, target, data);
        return result;
    }
}
