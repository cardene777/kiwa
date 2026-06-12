// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IGatedContentForReentry {
    function getSecret() external returns (string memory);
}

/// @notice TC-036 用 mock — `GatedContent` が `IGateNFT.balanceOf` を `external view`
/// として呼ぶため、 mock 側で state 変更や nested call を試みても EVM レベルの staticcall
/// 制約で revert する。 本 mock の目的は **「reentrancy が view 制約により構造的に
/// 防がれている」** ことを assertion で証明することにある (実 reentrancy 実行ではない)。
///
/// - `balanceOf` 内で `reentryCount` への storage write を試みる → staticcall 制約で revert
/// - 続けて `target.getSecret()` の nested call を試みる → 同上
/// - try / catch で revert を吸収するため呼び出し元 (`GatedContent`) からは
///   `balanceOf == 0` の view return として観測される (NotGated revert に至る)
///
/// 一般的な non-view callback site (例 `transfer` hook) に対する reentrancy guard
/// を verify したい場合は、 本 mock を non-view interface 経由で呼ぶ別 target が必要。
contract ReentrantGateNFT {
    IGatedContentForReentry public target;
    address public holder;
    uint256 public reentryCount;

    function setTarget(address target_, address holder_) external {
        target = IGatedContentForReentry(target_);
        holder = holder_;
    }

    /// @dev `external view` の呼び出し元 (`GatedContent`) から staticcall される。
    /// reentryCount への write と target.getSecret() への nested call は staticcall
    /// 制約で revert するが、 try / catch で吸収するため返り値は通常通り返る。
    function balanceOf(address user) external returns (uint256) {
        if (address(target) != address(0) && reentryCount == 0 && user == holder) {
            reentryCount = 1;
            try target.getSecret() {} catch {}
        }
        return user == holder ? 1 : 0;
    }
}
