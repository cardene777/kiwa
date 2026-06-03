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

    event Accessed(address indexed caller);

    error NotGated();

    constructor(address gateNft) {
        gate = IGateNFT(gateNft);
    }

    /// @notice gated content (NFT 持ってる人だけ取得可能)
    function getSecret() external returns (string memory) {
        if (gate.balanceOf(msg.sender) == 0) revert NotGated();
        accessCount++;
        emit Accessed(msg.sender);
        return SECRET;
    }

    /// @notice 自分が gated か (view)
    function isGated(address user) external view returns (bool) {
        return gate.balanceOf(user) > 0;
    }
}
