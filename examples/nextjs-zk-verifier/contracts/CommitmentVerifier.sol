// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice ZK commit-reveal scheme の最小 verifier
/// @dev    本格 Groth16 / Plonk verifier (ecPairing + verifying key) を簡略化、
///         keccak256(secret, message) == commitment の check で proof verify を simulate
contract CommitmentVerifier {
    mapping(address => bytes32) public commitments;
    mapping(address => uint256) public verifiedCount;
    uint256 public totalVerified;

    event CommitmentSet(address indexed who, bytes32 commitment);
    event Verified(address indexed who, string message);

    error InvalidCommitment();
    error NoCommitment();

    /// @notice off-chain で計算した commitment を on-chain 登録
    function setCommitment(bytes32 commitment) external {
        commitments[msg.sender] = commitment;
        emit CommitmentSet(msg.sender, commitment);
    }

    /// @notice secret + message を reveal して commitment と一致確認
    /// @return success == true なら proof 有効
    function verify(bytes32 secret, string calldata message) external returns (bool success) {
        bytes32 stored = commitments[msg.sender];
        if (stored == bytes32(0)) revert NoCommitment();
        bytes32 hash = keccak256(abi.encodePacked(secret, message));
        if (hash != stored) revert InvalidCommitment();
        verifiedCount[msg.sender]++;
        totalVerified++;
        emit Verified(msg.sender, message);
        return true;
    }

    /// @notice view で commitment 一致確認 (state 変更なし)
    function isValid(address who, bytes32 secret, string calldata message)
        external
        view
        returns (bool)
    {
        bytes32 stored = commitments[who];
        if (stored == bytes32(0)) return false;
        return keccak256(abi.encodePacked(secret, message)) == stored;
    }
}
