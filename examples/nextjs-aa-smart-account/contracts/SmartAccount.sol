// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Minimal smart account (ERC-4337 簡略版) - execute() + ERC-1271 isValidSignature
contract SmartAccount {
    /// ERC-1271 magic value
    bytes4 public constant MAGICVALUE = 0x1626ba7e;

    address public owner;
    address public immutable entryPoint;
    uint256 public immutable recoveryThreshold;
    uint256 public guardianCount;
    uint256 public recoveryRequestCount;
    uint256 public ownerEpoch;

    struct RecoveryRequest {
        address proposedOwner;
        uint256 approvals;
        bool finalized;
        uint256 ownerEpoch;
    }

    mapping(address => bool) public guardians;
    mapping(uint256 => RecoveryRequest) private _recoveryRequests;
    mapping(uint256 => mapping(address => bool)) private _recoveryApprovals;

    event Executed(address indexed target, uint256 value, bytes data);
    event BatchExecuted(uint256 count);
    event RecoveryProposed(uint256 indexed requestId, address indexed proposer, address indexed newOwner);
    event RecoveryApproved(uint256 indexed requestId, address indexed guardian);
    event RecoveryFinalized(uint256 indexed requestId, address indexed newOwner);

    error NotAuthorized();
    error CallFailed(address target);
    error LengthMismatch();
    error BatchCallFailed(uint256 index, address target);
    error InvalidGuardianConfig();
    error NotGuardian();
    error InvalidRecoveryRequest();
    error InvalidNewOwner();
    error AlreadyApproved();
    error ThresholdNotReached(uint256 approved, uint256 required);
    error RecoveryAlreadyFinalized();
    error RecoveryStale();

    constructor(
        address _owner,
        address _entryPoint,
        address[] memory _guardians,
        uint256 _recoveryThreshold
    ) {
        if (_owner == address(0) || _recoveryThreshold == 0 || _recoveryThreshold > _guardians.length) {
            revert InvalidGuardianConfig();
        }

        owner = _owner;
        entryPoint = _entryPoint;
        recoveryThreshold = _recoveryThreshold;

        for (uint256 i = 0; i < _guardians.length; i++) {
            address guardian = _guardians[i];
            if (guardian == address(0) || guardians[guardian]) revert InvalidGuardianConfig();
            guardians[guardian] = true;
        }
        guardianCount = _guardians.length;
    }

    /// @notice owner or entryPoint だけが execute 可能
    function execute(address target, uint256 value, bytes calldata data) external returns (bytes memory result) {
        _requireAuthorized();
        result = _executeCall(target, value, data);
        return result;
    }

    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata data
    ) external returns (bytes[] memory results) {
        _requireAuthorized();
        if (targets.length != values.length || targets.length != data.length) revert LengthMismatch();

        results = new bytes[](targets.length);
        for (uint256 i = 0; i < targets.length; i++) {
            address target = targets[i];
            if (target.code.length == 0) revert BatchCallFailed(i, target);

            (bool ok, bytes memory ret) = target.call{value: values[i]}(data[i]);
            if (!ok) revert BatchCallFailed(i, target);

            results[i] = ret;
            emit Executed(target, values[i], data[i]);
        }

        emit BatchExecuted(targets.length);
        return results;
    }

    function proposeRecovery(address newOwner) external returns (uint256 requestId) {
        if (!guardians[msg.sender]) revert NotGuardian();
        if (newOwner == address(0)) revert InvalidNewOwner();

        requestId = ++recoveryRequestCount;
        _recoveryRequests[requestId] = RecoveryRequest({
            proposedOwner: newOwner,
            approvals: 0,
            finalized: false,
            ownerEpoch: ownerEpoch
        });

        emit RecoveryProposed(requestId, msg.sender, newOwner);
    }

    function approveRecovery(uint256 requestId) external {
        if (!guardians[msg.sender]) revert NotGuardian();

        RecoveryRequest storage request = _getRecoveryRequest(requestId);
        if (request.finalized) revert RecoveryAlreadyFinalized();
        if (_recoveryApprovals[requestId][msg.sender]) revert AlreadyApproved();

        _recoveryApprovals[requestId][msg.sender] = true;
        request.approvals++;

        emit RecoveryApproved(requestId, msg.sender);
    }

    function finalizeRecovery(uint256 requestId) external {
        RecoveryRequest storage request = _getRecoveryRequest(requestId);
        if (request.ownerEpoch != ownerEpoch) revert RecoveryStale();
        if (request.finalized) revert RecoveryAlreadyFinalized();
        if (request.approvals < recoveryThreshold) {
            revert ThresholdNotReached(request.approvals, recoveryThreshold);
        }

        request.finalized = true;
        owner = request.proposedOwner;
        ownerEpoch++;

        emit RecoveryFinalized(requestId, request.proposedOwner);
    }

    function recoveryRequestView(uint256 requestId)
        external
        view
        returns (address proposedOwner, uint256 approvals, bool finalized, uint256 requestOwnerEpoch)
    {
        RecoveryRequest storage request = _getRecoveryRequest(requestId);
        return (request.proposedOwner, request.approvals, request.finalized, request.ownerEpoch);
    }

    function hasApprovedRecovery(uint256 requestId, address guardian) external view returns (bool) {
        return _recoveryApprovals[requestId][guardian];
    }

    function _requireAuthorized() internal view {
        if (msg.sender != owner && msg.sender != entryPoint) revert NotAuthorized();
    }

    function _executeCall(address target, uint256 value, bytes calldata data)
        internal
        returns (bytes memory result)
    {
        if (target.code.length == 0) revert CallFailed(target);
        (bool ok, bytes memory ret) = target.call{value: value}(data);
        if (!ok) revert CallFailed(target);
        emit Executed(target, value, data);
        return ret;
    }

    function _getRecoveryRequest(uint256 requestId)
        internal
        view
        returns (RecoveryRequest storage request)
    {
        request = _recoveryRequests[requestId];
        if (request.proposedOwner == address(0)) revert InvalidRecoveryRequest();
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
