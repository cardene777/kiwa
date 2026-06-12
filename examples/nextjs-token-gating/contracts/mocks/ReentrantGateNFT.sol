// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IGatedContentForReentry {
    function getSecret() external returns (string memory);
}

/// @notice TC-036 用 mock — balanceOf 内で getSecret を 1 回 reentry 試行する
contract ReentrantGateNFT {
    IGatedContentForReentry public target;
    address public holder;
    uint256 public reentryCount;

    function setTarget(address target_, address holder_) external {
        target = IGatedContentForReentry(target_);
        holder = holder_;
    }

    function balanceOf(address user) external returns (uint256) {
        if (address(target) != address(0) && reentryCount == 0 && user == holder) {
            reentryCount = 1;
            try target.getSecret() {} catch {}
        }
        return user == holder ? 1 : 0;
    }
}
