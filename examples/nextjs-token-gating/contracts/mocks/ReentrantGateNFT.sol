// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IGatedContentForReentry {
    function getSecret() external returns (string memory);
}

/// @notice TC-036 用 mock — `GatedContent` が `IGateNFT.balanceOf` を `external view`
/// として呼ぶため、 mock 側で state 変更を試みた瞬間に EVM レベルの staticcall 制約で
/// revert する。
///
/// 本 mock の目的は **「reentrancy を試みる悪意ある GateNFT を `GatedContent` に
/// 差し替えた場合、 view 制約で構造的に防がれる」** ことを assertion で示すこと。
///
/// 実 execution path の詳細。
///
/// 1. `GatedContent` が `gate.balanceOf(user)` を呼ぶ → EVM が staticcall を発行
/// 2. 本 mock の `balanceOf` body 内で `reentryCount = 1` (L35) を試みる
/// 3. 第 1 の storage write の瞬間に staticcall 制約で revert
/// 4. その revert は呼び出し元の `gate.balanceOf(user)` まで伝播
/// 5. 結果として `GatedContent.hasAccess` / `GatedContent.getSecret` も revert
///
/// L36 の `try target.getSecret()` には **到達しない** (L35 で既に revert 済)。
/// 本来の reentrancy 試行 (nested call) は dead code として残してあるが、
/// staticcall context では 1 命令目の state 変更で確実に revert するため、
/// nested call 経路の verify は本 mock では不可能。
///
/// 一般的な non-view callback site (例 ERC721 `transferFrom` 中の `onERC721Received` hook)
/// に対する真の reentrancy guard を verify したい場合は、 本 mock を **non-view** な
/// entry point 経由で呼ぶ別 target が必要。
contract ReentrantGateNFT {
    IGatedContentForReentry public target;
    address public holder;
    uint256 public reentryCount;

    function setTarget(address target_, address holder_) external {
        target = IGatedContentForReentry(target_);
        holder = holder_;
    }

    /// @dev `external view` の呼び出し元 (`GatedContent`) から **staticcall** される。
    /// L35 の `reentryCount = 1` (storage write) を試みた瞬間に staticcall 制約で revert
    /// し、 その revert は呼び出し元の `gate.balanceOf(user)` まで伝播する。
    ///
    /// L36 の `try target.getSecret()` は dead code (L35 で既に revert 済で到達しない)。
    /// L38 の return も同様に dead code。 本 mock は **「view 制約により state 変更を
    /// 含む reentrancy が構造的に不可能」** であることを示す test fixture。
    function balanceOf(address user) external returns (uint256) {
        if (address(target) != address(0) && reentryCount == 0 && user == holder) {
            reentryCount = 1;
            try target.getSecret() {} catch {}
        }
        return user == holder ? 1 : 0;
    }
}
