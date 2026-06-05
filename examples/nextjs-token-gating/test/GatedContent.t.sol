// SPDX-License-Identifier: MIT
// /contract-test-foundry 出力 (Layer 1 spec test-spec-token-gating.md 由来)
// 用途: 既存 nextjs-token-gating contracts の test 後付け導入
// 観点 grouping: 1 正常系 / 2 異常系 / 3 境界値 / 4 状態遷移 / 5 権限 / 10 セキュリティ
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/GateNFT.sol";
import "../contracts/GatedContent.sol";

contract GatedContentTest is Test {
    GateNFT public gateNft;
    GatedContent public gatedContent;

    address public holder = address(0x1);
    address public grantee = address(0x2);
    address public otherUser = address(0x3);
    address public nonHolder = address(0x4);

    function setUp() public {
        gateNft = new GateNFT();
        gatedContent = new GatedContent(address(gateNft));
    }

    // ==========================================
    // 観点 1: 正常系 (TC-001 〜 TC-003)
    // ==========================================

    /// TC-001: wallet connected で mint → balanceOf == 1
    function test_Mint_HappyPath() public {
        vm.prank(holder);
        uint256 tokenId = gateNft.mint();
        assertEq(gateNft.balanceOf(holder), 1);
        assertEq(gateNft.ownerOf(tokenId), holder);
        assertEq(tokenId, 1);
    }

    /// TC-002: NFT 保有者が grantTimedAccess → timedAccessExpiry が set
    function test_GrantTimedAccess_HappyPath() public {
        vm.prank(holder);
        gateNft.mint();

        vm.prank(holder);
        uint256 expiresAt = gatedContent.grantTimedAccess(grantee, 3600);

        assertEq(gatedContent.timedAccessExpiry(grantee), expiresAt);
        assertEq(expiresAt, block.timestamp + 3600);
        assertEq(gatedContent.timedAccessGrantor(grantee), holder);
    }

    /// TC-003: grantee 視点で getSecret → accessCount +1
    function test_GetSecret_HappyPath() public {
        vm.prank(holder);
        gateNft.mint();
        vm.prank(holder);
        gatedContent.grantTimedAccess(grantee, 3600);

        uint256 countBefore = gatedContent.accessCount();
        vm.prank(grantee);
        string memory secret = gatedContent.getSecret();
        assertEq(secret, "alpha-pass-2025");
        assertEq(gatedContent.accessCount(), countBefore + 1);
    }

    // ==========================================
    // 観点 2: 異常系 (TC-004 〜 TC-005)
    // ==========================================

    /// TC-004: NFT 未保有者が grantTimedAccess → NotGated revert
    function test_GrantTimedAccess_Reverts_When_NotNftHolder() public {
        vm.prank(nonHolder);
        vm.expectRevert(GatedContent.NotGated.selector);
        gatedContent.grantTimedAccess(grantee, 3600);

        // state 不変確認
        assertEq(gatedContent.timedAccessExpiry(grantee), 0);
    }

    /// TC-005: access 未付与者が getSecret → NotGated revert
    function test_GetSecret_Reverts_When_NoAccess() public {
        vm.prank(nonHolder);
        vm.expectRevert(GatedContent.NotGated.selector);
        gatedContent.getSecret();
    }

    // ==========================================
    // 観点 3: 境界値 (TC-006 〜 TC-008)
    // ==========================================

    /// TC-006: ttl = 0 で grant → InvalidTtl revert
    function test_GrantTimedAccess_Reverts_When_TtlZero() public {
        vm.prank(holder);
        gateNft.mint();

        vm.prank(holder);
        vm.expectRevert(GatedContent.InvalidTtl.selector);
        gatedContent.grantTimedAccess(grantee, 0);
    }

    /// TC-007: 期限直前 (expiresAt - 1) で getSecret → success
    function test_GetSecret_AtBoundaryBeforeExpiry() public {
        vm.prank(holder);
        gateNft.mint();
        vm.prank(holder);
        uint256 expiresAt = gatedContent.grantTimedAccess(grantee, 1);

        vm.warp(expiresAt - 1);
        vm.prank(grantee);
        string memory secret = gatedContent.getSecret();
        assertEq(secret, "alpha-pass-2025");
    }

    /// TC-008: 期限経過後 (expiresAt + 1) で getSecret → NotGated revert
    function test_GetSecret_Reverts_AfterExpiry() public {
        vm.prank(holder);
        gateNft.mint();
        vm.prank(holder);
        uint256 expiresAt = gatedContent.grantTimedAccess(grantee, 1);

        vm.warp(expiresAt + 1);
        vm.prank(grantee);
        vm.expectRevert(GatedContent.NotGated.selector);
        gatedContent.getSecret();
    }

    /// fuzz 版: ttl の有効範囲 (1 〜 365 days) で grant が success
    function testFuzz_GrantTimedAccess_Boundary(uint256 ttl) public {
        ttl = bound(ttl, 1, 365 days);
        vm.prank(holder);
        gateNft.mint();
        vm.prank(holder);
        uint256 expiresAt = gatedContent.grantTimedAccess(grantee, ttl);
        assertEq(expiresAt, block.timestamp + ttl);
    }

    // ==========================================
    // 観点 4: 状態遷移 (TC-009)
    // ==========================================

    /// TC-009: grantor が NFT を transfer 後、 grantee の hasAccess が false
    function test_TransferRevokesAccess() public {
        vm.prank(holder);
        uint256 tokenId = gateNft.mint();
        vm.prank(holder);
        gatedContent.grantTimedAccess(grantee, 3600);

        assertTrue(gatedContent.hasAccess(grantee));

        vm.prank(holder);
        gateNft.transferFrom(holder, otherUser, tokenId);

        assertFalse(gatedContent.hasAccess(grantee));
        assertEq(gateNft.balanceOf(holder), 0);
    }

    // ==========================================
    // 観点 5: 権限 (TC-010)
    // ==========================================

    /// TC-010: 非保有者が self に grant 試行 → NotGated revert
    function test_GrantTimedAccess_OnlyNftHolder_NonHolderReverts() public {
        vm.prank(nonHolder);
        vm.expectRevert(GatedContent.NotGated.selector);
        gatedContent.grantTimedAccess(nonHolder, 3600);
    }

    // ==========================================
    // 観点 10: セキュリティ (TC-011)
    // ==========================================

    /// TC-011: 2 grantee に同時 grant + grantor transfer → 両方失効
    function test_TransferRevokesAll_MultiGrantee() public {
        address granteeA = address(0xA);
        address granteeB = address(0xB);

        vm.prank(holder);
        uint256 tokenId = gateNft.mint();
        vm.prank(holder);
        gatedContent.grantTimedAccess(granteeA, 3600);
        vm.prank(holder);
        gatedContent.grantTimedAccess(granteeB, 3600);

        assertTrue(gatedContent.hasAccess(granteeA));
        assertTrue(gatedContent.hasAccess(granteeB));

        vm.prank(holder);
        gateNft.transferFrom(holder, otherUser, tokenId);

        assertFalse(gatedContent.hasAccess(granteeA));
        assertFalse(gatedContent.hasAccess(granteeB));
    }

    /// TC-012 [MAJOR]: 重複 grantTimedAccess の挙動 (実 contract は上書き)
    function test_GrantTimedAccess_DuplicateGrant_Overwrites() public {
        vm.prank(holder);
        gateNft.mint();

        vm.prank(holder);
        uint256 first = gatedContent.grantTimedAccess(grantee, 3600);
        assertEq(gatedContent.timedAccessExpiry(grantee), first);

        // 同 grantee に再度 grant (ttl 異なる)
        vm.warp(block.timestamp + 100);
        vm.prank(holder);
        uint256 second = gatedContent.grantTimedAccess(grantee, 7200);
        assertEq(gatedContent.timedAccessExpiry(grantee), second);
        // 上書きされており、 加算ではない (second != first + 7200)
        assertTrue(second != first);
        assertEq(second, block.timestamp + 7200);
    }

    /// TC-013 [MAJOR]: isGated(user) view 関数の動作確認
    function test_IsGated_ReturnsBalanceCheck() public {
        // NFT 未保有時は false
        assertFalse(gatedContent.isGated(holder));

        // mint 後は true
        vm.prank(holder);
        gateNft.mint();
        assertTrue(gatedContent.isGated(holder));

        // 他 user は依然 false
        assertFalse(gatedContent.isGated(grantee));
    }

    /// TC-014 [MAJOR]: TimedAccessGranted event の args 検証
    function test_GrantTimedAccess_EmitsEventWithArgs() public {
        vm.prank(holder);
        gateNft.mint();

        uint256 expectedExpiry = block.timestamp + 3600;
        vm.expectEmit(true, true, false, true);
        emit GatedContent.TimedAccessGranted(holder, grantee, expectedExpiry);
        vm.prank(holder);
        gatedContent.grantTimedAccess(grantee, 3600);
    }

    /// TC-015 [MAJOR]: Accessed event の args 検証
    function test_GetSecret_EmitsAccessedEvent() public {
        vm.prank(holder);
        gateNft.mint();
        vm.prank(holder);
        gatedContent.grantTimedAccess(grantee, 3600);

        vm.expectEmit(true, false, false, true);
        emit GatedContent.Accessed(grantee);
        vm.prank(grantee);
        gatedContent.getSecret();
    }

    /// TC-016 [MINOR]: NFT 保有者本人が getSecret も可能 (grant なしで直接アクセス)
    function test_GetSecret_AsNftHolder_NoGrantNeeded() public {
        vm.prank(holder);
        gateNft.mint();

        // grant なしで holder 自身が getSecret 呼べる
        vm.prank(holder);
        string memory secret = gatedContent.getSecret();
        assertEq(secret, "alpha-pass-2025");
    }

    /// TC-017 [CRITICAL]: GateNFT.transferFrom by non-owner → NotOwner revert
    function test_GateNft_TransferFrom_Reverts_NotOwner() public {
        vm.prank(holder);
        gateNft.mint();
        // grantee は owner でない、 from = holder で transferFrom 試行
        vm.prank(grantee);
        vm.expectRevert(GateNFT.NotOwner.selector);
        gateNft.transferFrom(holder, otherUser, 1);
    }

    /// TC-018 [CRITICAL]: GateNFT.transferFrom to address(0) → InvalidRecipient revert
    function test_GateNft_TransferFrom_Reverts_InvalidRecipient() public {
        vm.prank(holder);
        gateNft.mint();
        vm.prank(holder);
        vm.expectRevert(GateNFT.InvalidRecipient.selector);
        gateNft.transferFrom(holder, address(0), 1);
    }

    /// TC-019 [MINOR]: GateNFT.Transfer event の args 検証 (mint 時)
    function test_GateNft_Mint_EmitsTransferEvent() public {
        vm.expectEmit(true, true, true, true);
        emit GateNFT.Transfer(address(0), holder, 1);
        vm.prank(holder);
        gateNft.mint();
    }
}
