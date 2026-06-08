// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {GateNFT} from "../contracts/GateNFT.sol";
import {GatedContent} from "../contracts/GatedContent.sol";

contract GatedContentTest is Test {
    GateNFT public nft;
    GatedContent public gated;
    address public alice = address(0xA11CE);
    address public bob = address(0xB0B);
    address public charlie = address(0xC0C);

    event Accessed(address indexed caller);
    event TimedAccessGranted(address indexed grantedBy, address indexed user, uint256 expiresAt);

    function setUp() public {
        nft = new GateNFT();
        gated = new GatedContent(address(nft));

        // start at a sensible timestamp to avoid block.timestamp = 0 edge
        vm.warp(1_700_000_000);
    }

    function _mintFor(address who) internal {
        vm.prank(who);
        nft.mint();
    }

    // ============================================================
    // 観点 1: 正常系
    // ============================================================

    /// TC-002 getSecret happy path
    function test_TC002_getSecret_HappyPath() public {
        _mintFor(alice);

        vm.expectEmit(true, false, false, true);
        emit Accessed(alice);

        vm.prank(alice);
        string memory secret = gated.getSecret();

        assertEq(secret, "alpha-pass-2025");
        assertEq(gated.accessCount(), 1);
    }

    /// TC-003 grantTimedAccess happy path
    function test_TC003_grantTimedAccess_HappyPath() public {
        _mintFor(alice);

        uint256 ttl = 3600;
        uint256 expectedExpiry = block.timestamp + ttl;

        vm.expectEmit(true, true, false, true);
        emit TimedAccessGranted(alice, bob, expectedExpiry);

        vm.prank(alice);
        uint256 expiresAt = gated.grantTimedAccess(bob, ttl);

        assertEq(expiresAt, expectedExpiry);
        assertEq(gated.timedAccessExpiry(bob), expectedExpiry);
        assertEq(gated.timedAccessGrantor(bob), alice);
    }

    /// isGated true / false 経路
    function test_isGated_BothPaths() public {
        assertEq(gated.isGated(alice), false);
        _mintFor(alice);
        assertEq(gated.isGated(alice), true);
    }

    // ============================================================
    // 観点 2: 異常系
    // ============================================================

    /// TC-005 getSecret without NFT → NotGated
    function test_TC005_getSecret_RevertsWhen_NoNft() public {
        vm.prank(alice);
        vm.expectRevert(GatedContent.NotGated.selector);
        gated.getSecret();
        assertEq(gated.accessCount(), 0);
    }

    /// TC-006 grantTimedAccess without NFT → NotGated
    function test_TC006_grantTimedAccess_RevertsWhen_NoNft() public {
        vm.prank(alice);
        vm.expectRevert(GatedContent.NotGated.selector);
        gated.grantTimedAccess(bob, 3600);

        assertEq(gated.timedAccessExpiry(bob), 0);
        assertEq(gated.timedAccessGrantor(bob), address(0));
    }

    /// TC-007 grantTimedAccess with ttl=0 → InvalidTtl
    function test_TC007_grantTimedAccess_RevertsWhen_TtlZero() public {
        _mintFor(alice);

        vm.prank(alice);
        vm.expectRevert(GatedContent.InvalidTtl.selector);
        gated.grantTimedAccess(bob, 0);
    }

    // ============================================================
    // 観点 3: 境界値
    // ============================================================

    /// TC-010 ttl=1 (最小有効値) で hasAccess true
    function test_TC010_hasAccess_AtMinTtl() public {
        _mintFor(alice);

        vm.prank(alice);
        gated.grantTimedAccess(bob, 1);

        // 同 block (expiresAt = block.timestamp + 1 > block.timestamp)
        assertEq(gated.hasAccess(bob), true);
    }

    /// TC-011 expiry 超過後 hasAccess false
    function test_TC011_hasAccess_AfterExpiry() public {
        _mintFor(alice);

        vm.prank(alice);
        gated.grantTimedAccess(bob, 1);

        // expiresAt+1 まで進める
        vm.warp(block.timestamp + 2);
        assertEq(gated.hasAccess(bob), false);
    }

    /// TC-012 strict less-than の境界 (expiresAt 同値で true)
    function test_TC012_hasAccess_StrictLessThanBoundary() public {
        _mintFor(alice);

        vm.prank(alice);
        uint256 expiresAt = gated.grantTimedAccess(bob, 100);

        // expiresAt - 1 → true
        vm.warp(expiresAt - 1);
        assertEq(gated.hasAccess(bob), true);

        // expiresAt → true (`timedAccessExpiry[user] < block.timestamp` の strict less-than)
        vm.warp(expiresAt);
        assertEq(gated.hasAccess(bob), true);

        // expiresAt + 1 → false
        vm.warp(expiresAt + 1);
        assertEq(gated.hasAccess(bob), false);
    }

    // ============================================================
    // 観点 4: 状態遷移
    // ============================================================

    /// TC-013 grantor が NFT を失うと delegated access も失効
    function test_TC013_grantor_RevocationCascades() public {
        _mintFor(alice);

        vm.prank(alice);
        gated.grantTimedAccess(bob, 3600);

        // bob は最初 access 可能
        vm.prank(bob);
        gated.getSecret();
        assertEq(gated.accessCount(), 1);

        // alice が NFT を charlie に transfer
        vm.prank(alice);
        nft.transferFrom(alice, charlie, 1);

        // bob は revoke される (grantor=alice が NFT を持たないから)
        vm.prank(bob);
        vm.expectRevert(GatedContent.NotGated.selector);
        gated.getSecret();
        assertEq(gated.accessCount(), 1);
    }

    /// TC-015 grantTimedAccess 上書き
    function test_TC015_grantTimedAccess_Overwrite() public {
        _mintFor(alice);

        vm.startPrank(alice);
        uint256 firstExpiry = gated.grantTimedAccess(bob, 100);
        uint256 secondExpiry = gated.grantTimedAccess(bob, 200);
        vm.stopPrank();

        assertEq(gated.timedAccessExpiry(bob), secondExpiry);
        assertGt(secondExpiry, firstExpiry);
        assertEq(gated.timedAccessGrantor(bob), alice);
    }

    // ============================================================
    // 観点 5: 権限
    // ============================================================

    /// TC-017 grantTimedAccess を non-holder が呼ぶ → NotGated
    function test_TC017_grantTimedAccess_OnlyNftHolder() public {
        _mintFor(alice);

        vm.prank(bob); // bob は NFT 0 個
        vm.expectRevert(GatedContent.NotGated.selector);
        gated.grantTimedAccess(alice, 3600);
    }

    /// TC-018 自分自身に grant も許容仕様
    function test_TC018_grantTimedAccess_SelfGrantAllowed() public {
        _mintFor(alice);

        vm.prank(alice);
        uint256 expiresAt = gated.grantTimedAccess(alice, 3600);

        assertGt(expiresAt, block.timestamp);
        assertEq(gated.timedAccessExpiry(alice), expiresAt);
        assertEq(gated.timedAccessGrantor(alice), alice);
    }

    // ============================================================
    // 観点 6: 入力バリデーション
    // ============================================================

    /// TC-019 ttl=0 必ず InvalidTtl
    function test_TC019_grantTimedAccess_TtlZeroValidation() public {
        _mintFor(alice);
        vm.prank(alice);
        vm.expectRevert(GatedContent.InvalidTtl.selector);
        gated.grantTimedAccess(bob, 0);
    }

    /// TC-020 ttl=type(uint256).max で overflow revert
    function test_TC020_grantTimedAccess_TtlMaxOverflow() public {
        _mintFor(alice);
        vm.prank(alice);
        // block.timestamp + max は overflow、 Solidity 0.8 で revert
        vm.expectRevert(); // generic Panic on arithmetic overflow
        gated.grantTimedAccess(bob, type(uint256).max);
    }

    /// fuzz: 任意の ttl で grantTimedAccess + hasAccess の整合性
    function testFuzz_grantTimedAccess_TtlRange(uint64 ttl) public {
        vm.assume(ttl > 0);
        _mintFor(alice);

        vm.prank(alice);
        uint256 expiresAt = gated.grantTimedAccess(bob, uint256(ttl));

        assertEq(expiresAt, block.timestamp + ttl);
        assertEq(gated.hasAccess(bob), true);
    }

    // ============================================================
    // 観点 7: 冪等性 (累積動作の確認)
    // ============================================================

    /// TC-023 getSecret を 3 回呼ぶと accessCount=3
    function test_TC023_getSecret_AccessCountCumulative() public {
        _mintFor(alice);

        vm.startPrank(alice);
        gated.getSecret();
        gated.getSecret();
        gated.getSecret();
        vm.stopPrank();

        assertEq(gated.accessCount(), 3);
    }

    /// TC-024 grantTimedAccess 2 回連続で expiry 上書き、 grantor 同じなら変更なし
    function test_TC024_grantTimedAccess_IdempotentGrantor() public {
        _mintFor(alice);

        vm.startPrank(alice);
        gated.grantTimedAccess(bob, 3600);
        uint256 finalExpiry = gated.grantTimedAccess(bob, 7200);
        vm.stopPrank();

        assertEq(gated.timedAccessExpiry(bob), finalExpiry);
        assertEq(gated.timedAccessGrantor(bob), alice);
    }

    // ============================================================
    // 観点 8: 並行処理
    // ============================================================

    /// TC-027 同 block 内で 2 つの grantTimedAccess を同 user に → 後勝ち
    function test_TC027_grantTimedAccess_ConcurrentOverwrite() public {
        _mintFor(alice);

        vm.startPrank(alice);
        gated.grantTimedAccess(bob, 100);
        uint256 finalExpiry = gated.grantTimedAccess(bob, 200);
        vm.stopPrank();

        assertEq(gated.timedAccessExpiry(bob), finalExpiry);
    }

    // ============================================================
    // 観点 10: セキュリティ
    // ============================================================

    /// TC-029 expiry だけ未来で grantor=0 → bypass 不可
    /// natural な経路で再現するには block.timestamp=0 (= initial / Foundry のみ可) で
    /// timedAccessExpiry[user]=0、 timedAccessGrantor[user]=0 のとき
    /// L52 `0 < 0` false → L54 `grantor == 0` true → false return を通す
    function test_TC029_hasAccess_NoBypass_WithZeroGrantor() public {
        // block.timestamp を 0 に巻き戻す (Foundry のみ可能)
        vm.warp(0);

        // bob はどの mapping にも entry なし (default 0)
        // L51 `gate.balanceOf(bob) > 0` false (bob NFT 0)
        // L52 `timedAccessExpiry[bob] < block.timestamp` → `0 < 0` false (短絡しない)
        // L53 `address grantor = timedAccessGrantor[bob];` → 0
        // L54 `grantor == address(0)` true → false return
        assertEq(gated.hasAccess(bob), false);

        // getSecret も NotGated で revert
        vm.prank(bob);
        vm.expectRevert(GatedContent.NotGated.selector);
        gated.getSecret();
    }

    /// TC-030 grantor が NFT 失う → delegated access も失効
    function test_TC030_grantor_NftRevocationKillsDelegated() public {
        _mintFor(alice);

        vm.prank(alice);
        gated.grantTimedAccess(bob, 3600);

        // alice が NFT を charlie に transfer
        vm.prank(alice);
        nft.transferFrom(alice, charlie, 1);

        // bob は now revoked
        assertEq(gated.hasAccess(bob), false);
        vm.prank(bob);
        vm.expectRevert(GatedContent.NotGated.selector);
        gated.getSecret();

        // charlie は新所有者として直接 access 可能
        assertEq(gated.hasAccess(charlie), true);
    }

    /// TC-031 reentrancy 経路 — getSecret は単純で reentrancy 余地少 (確認のため)
    function test_TC031_getSecret_NoReentrancyImpact() public {
        _mintFor(alice);

        // 単純な 2 回呼び出しで state 一貫性確認 (reentrancy attack contract まではここでは省略)
        vm.startPrank(alice);
        gated.getSecret();
        gated.getSecret();
        vm.stopPrank();

        assertEq(gated.accessCount(), 2);
    }
}
