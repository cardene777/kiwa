// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./UserOperation.sol";

interface IAccount {
    function validateUserOp(UserOperation calldata userOp, bytes32 userOpHash) external;
}

contract EntryPoint {
    bytes32 private constant DOMAIN_TYPEHASH =
        keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        );
    bytes32 private constant USER_OP_TYPEHASH =
        keccak256(
            "UserOperation(address sender,uint256 nonce,bytes32 initCodeHash,bytes32 callDataHash,uint256 callGasLimit,uint256 verificationGasLimit,uint256 preVerificationGas,uint256 maxFeePerGas,uint256 maxPriorityFeePerGas,bytes32 paymasterAndDataHash)"
        );
    bytes32 private constant NAME_HASH = keccak256("EntryPoint");
    bytes32 private constant VERSION_HASH = keccak256("0.7");

    mapping(address => uint256) public deposits;

    error FailedOp(uint256 opIndex, string reason);
    error SenderAddressMismatch(address expected, address actual);
    error WithdrawFailed();

    event UserOperationHandled(address indexed sender, bytes32 indexed userOpHash);

    function handleOps(UserOperation[] calldata ops, address beneficiary) external {
        beneficiary;

        for (uint256 i = 0; i < ops.length; i++) {
            UserOperation calldata userOp = ops[i];

            if (userOp.sender.code.length == 0) {
                _deployAccount(i, userOp);
            }

            bytes32 userOpHash = getUserOpHash(userOp);
            try IAccount(userOp.sender).validateUserOp(userOp, userOpHash) {
                // no-op
            } catch Error(string memory reason) {
                revert FailedOp(i, reason);
            } catch {
                revert FailedOp(i, "validateUserOp reverted");
            }

            (bool ok, bytes memory ret) = userOp.sender.call(
                abi.encodePacked(userOp.callData)
            );
            if (!ok) {
                revert FailedOp(i, _decodeRevertReason(ret));
            }

            emit UserOperationHandled(userOp.sender, userOpHash);
        }
    }

    function getUserOpHash(UserOperation calldata userOp) public view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                USER_OP_TYPEHASH,
                userOp.sender,
                userOp.nonce,
                keccak256(userOp.initCode),
                keccak256(userOp.callData),
                userOp.callGasLimit,
                userOp.verificationGasLimit,
                userOp.preVerificationGas,
                userOp.maxFeePerGas,
                userOp.maxPriorityFeePerGas,
                keccak256(userOp.paymasterAndData)
            )
        );

        return keccak256(
            abi.encodePacked(
                "\x19\x01",
                keccak256(
                    abi.encode(
                        DOMAIN_TYPEHASH,
                        NAME_HASH,
                        VERSION_HASH,
                        block.chainid,
                        address(this)
                    )
                ),
                structHash
            )
        );
    }

    function depositTo(address account) external payable {
        deposits[account] += msg.value;
    }

    function withdrawTo(address payable withdrawAddress, uint256 amount) external {
        uint256 balance = deposits[msg.sender];
        if (balance < amount) revert FailedOp(type(uint256).max, "insufficient deposit");
        deposits[msg.sender] = balance - amount;

        (bool ok, ) = withdrawAddress.call{value: amount}("");
        if (!ok) revert WithdrawFailed();
    }

    function _deployAccount(uint256 opIndex, UserOperation calldata userOp) internal {
        if (userOp.initCode.length < 20) {
            revert FailedOp(opIndex, "initCode too short");
        }

        address factory = address(bytes20(userOp.initCode[:20]));
        bytes memory createCallData = bytes(userOp.initCode[20:]);

        (bool ok, bytes memory ret) = factory.call(createCallData);
        if (!ok) {
            revert FailedOp(opIndex, _decodeRevertReason(ret));
        }
        if (ret.length < 32) {
            revert FailedOp(opIndex, "factory returned no address");
        }

        address deployedAccount = abi.decode(ret, (address));
        if (deployedAccount != userOp.sender) {
            revert SenderAddressMismatch(userOp.sender, deployedAccount);
        }
        if (deployedAccount.code.length == 0) {
            revert FailedOp(opIndex, "account was not deployed");
        }
    }

    function _decodeRevertReason(bytes memory revertData) private pure returns (string memory) {
        if (revertData.length < 4) {
            return "execution reverted";
        }

        return "execution reverted";
    }
}
