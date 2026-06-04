// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Mock range-proof verifier that keeps public inputs on-chain.
/// @dev `minValue` / `maxValue` are public inputs, while `(value, salt)` is the
///      private witness kept off-chain until verification time.
contract RangeProofVerifier {
    mapping(address => bytes32) public rangeCommitments;
    mapping(address => uint256) public minValues;
    mapping(address => uint256) public maxValues;
    mapping(address => uint256) public verifiedCount;
    uint256 public totalVerified;

    event RangeCommitmentSet(
        address indexed who, bytes32 indexed commitment, uint256 minValue, uint256 maxValue
    );
    event RangeVerified(address indexed who, uint256 value, uint256 minValue, uint256 maxValue);

    error InvalidRange();
    error NoRangeCommitment();
    error InvalidRangeProof();
    error RangeOutOfBounds(uint256 value, uint256 minValue, uint256 maxValue);

    /// @notice Store the public inputs and commitment for a future proof.
    function setRangeCommitment(bytes32 commitment, uint256 minValue, uint256 maxValue) external {
        if (minValue > maxValue) revert InvalidRange();
        rangeCommitments[msg.sender] = commitment;
        minValues[msg.sender] = minValue;
        maxValues[msg.sender] = maxValue;
        emit RangeCommitmentSet(msg.sender, commitment, minValue, maxValue);
    }

    /// @notice Reveal the witness and check it against the public range.
    /// @dev This mocks a zk verifier by recomputing the commitment instead of verifying a SNARK.
    function verifyRange(uint256 value, bytes32 salt) external returns (bool success) {
        bytes32 storedCommitment = rangeCommitments[msg.sender];
        if (storedCommitment == bytes32(0)) revert NoRangeCommitment();

        uint256 minValue = minValues[msg.sender];
        uint256 maxValue = maxValues[msg.sender];
        if (value < minValue || value > maxValue) {
            revert RangeOutOfBounds(value, minValue, maxValue);
        }

        bytes32 computed = keccak256(abi.encodePacked(value, salt));
        if (computed != storedCommitment) revert InvalidRangeProof();

        verifiedCount[msg.sender]++;
        totalVerified++;
        emit RangeVerified(msg.sender, value, minValue, maxValue);
        return true;
    }

    function isValidRangeProof(address who, uint256 value, bytes32 salt)
        external
        view
        returns (bool)
    {
        bytes32 storedCommitment = rangeCommitments[who];
        if (storedCommitment == bytes32(0)) return false;

        uint256 minValue = minValues[who];
        uint256 maxValue = maxValues[who];
        if (value < minValue || value > maxValue) return false;

        return keccak256(abi.encodePacked(value, salt)) == storedCommitment;
    }
}
