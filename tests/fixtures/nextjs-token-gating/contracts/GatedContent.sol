// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IGateNFT {
    function balanceOf(address owner) external view returns (uint256);
}

/// @notice GateNFT を 1 個以上 hold する人だけが getSecret() を呼べる
contract GatedContent {
    IGateNFT public immutable gate;
    string public constant SECRET = "alpha-pass-2025";
    uint256 public accessCount;
    mapping(address => uint256) public timedAccessExpiry;
    mapping(address => address) public timedAccessGrantor;

    event Accessed(address indexed caller);
    event TimedAccessGranted(address indexed grantedBy, address indexed user, uint256 expiresAt);

    error NotGated();
    error InvalidTtl();

    constructor(address gateNft) {
        gate = IGateNFT(gateNft);
    }

    /// @notice gated content (NFT 持ってる人だけ取得可能)
    function getSecret() external returns (string memory) {
        if (!hasAccess(msg.sender)) revert NotGated();
        accessCount++;
        emit Accessed(msg.sender);
        return SECRET;
    }

    /// @notice 自分が gated か (view)
    function isGated(address user) external view returns (bool) {
        return gate.balanceOf(user) > 0;
    }

    /// @notice NFT holder が別 address に期限付き access を付与する
    function grantTimedAccess(address user, uint256 ttlSeconds) external returns (uint256 expiresAt) {
        if (gate.balanceOf(msg.sender) == 0) revert NotGated();
        if (ttlSeconds == 0) revert InvalidTtl();
        expiresAt = block.timestamp + ttlSeconds;
        timedAccessExpiry[user] = expiresAt;
        timedAccessGrantor[user] = msg.sender;
        emit TimedAccessGranted(msg.sender, user, expiresAt);
    }

    /// @notice NFT 所有または期限付き access のどちらかで閲覧可能
    function hasAccess(address user) public view returns (bool) {
        if (gate.balanceOf(user) > 0) return true;
        if (timedAccessExpiry[user] < block.timestamp) return false;
        address grantor = timedAccessGrantor[user];
        if (grantor == address(0)) return false;
        return gate.balanceOf(grantor) > 0;
    }
}
