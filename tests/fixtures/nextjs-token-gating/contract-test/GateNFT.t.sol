// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {GateNFT} from "../contracts/GateNFT.sol";

contract GateNFTTest is Test {
    GateNFT public nft;
    address public alice = address(0xA11CE);
    address public bob = address(0xB0B);
    address public charlie = address(0xC0C);

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    function setUp() public {
        nft = new GateNFT();
    }

    // ============================================================
    // 観点 1: 正常系
    // ============================================================

    /// TC-001 mint() happy path
    function test_TC001_mint_HappyPath() public {
        vm.expectEmit(true, true, true, true);
        emit Transfer(address(0), alice, 1);

        vm.prank(alice);
        uint256 tokenId = nft.mint();

        assertEq(tokenId, 1);
        assertEq(nft.ownerOf(1), alice);
        assertEq(nft.balanceOf(alice), 1);
        assertEq(nft.totalSupply(), 1);
    }

    /// TC-004 transferFrom happy path
    function test_TC004_transferFrom_HappyPath() public {
        vm.prank(alice);
        nft.mint();

        vm.expectEmit(true, true, true, true);
        emit Transfer(alice, bob, 1);

        vm.prank(alice);
        nft.transferFrom(alice, bob, 1);

        assertEq(nft.ownerOf(1), bob);
        assertEq(nft.balanceOf(alice), 0);
        assertEq(nft.balanceOf(bob), 1);
    }

    // ============================================================
    // 観点 2: 異常系
    // ============================================================

    /// TC-008 transferFrom with wrong msg.sender → NotOwner
    function test_TC008_transferFrom_RevertsWhen_NotOwnerCalls() public {
        vm.prank(alice);
        nft.mint();

        vm.prank(bob);
        vm.expectRevert(GateNFT.NotOwner.selector);
        nft.transferFrom(alice, charlie, 1);
    }

    /// TC-009 transferFrom to address(0) → InvalidRecipient
    function test_TC009_transferFrom_RevertsWhen_RecipientIsZero() public {
        vm.prank(alice);
        nft.mint();

        vm.prank(alice);
        vm.expectRevert(GateNFT.InvalidRecipient.selector);
        nft.transferFrom(alice, address(0), 1);
    }

    /// TC-022 non-existent tokenId → NotOwner
    function test_TC022_transferFrom_RevertsWhen_TokenDoesNotExist() public {
        vm.prank(alice);
        vm.expectRevert(GateNFT.NotOwner.selector);
        nft.transferFrom(alice, bob, 999);
    }

    // ============================================================
    // 観点 4: 状態遷移
    // ============================================================

    /// TC-014 totalSupply 3 連続 mint で 3 になる
    function test_TC014_mint_TotalSupplyTransition() public {
        vm.startPrank(alice);
        nft.mint();
        nft.mint();
        nft.mint();
        vm.stopPrank();

        assertEq(nft.totalSupply(), 3);
        assertEq(nft.balanceOf(alice), 3);
        assertEq(nft.ownerOf(1), alice);
        assertEq(nft.ownerOf(2), alice);
        assertEq(nft.ownerOf(3), alice);
    }

    // ============================================================
    // 観点 5: 権限
    // ============================================================

    /// TC-016 transferFrom 第三者からの呼び出し → NotOwner
    function test_TC016_transferFrom_OnlyOwner() public {
        vm.prank(alice);
        nft.mint();

        vm.prank(charlie); // alice の NFT を charlie が動かそうとする
        vm.expectRevert(GateNFT.NotOwner.selector);
        nft.transferFrom(alice, charlie, 1);
    }

    // ============================================================
    // 観点 6: 入力バリデーション (fuzz)
    // ============================================================

    /// TC-021 transferFrom to=0 always reverts (fuzz)
    function testFuzz_TC021_transferFrom_RejectsZeroRecipient(uint256 mintCount) public {
        vm.assume(mintCount > 0 && mintCount <= 10);
        vm.startPrank(alice);
        for (uint256 i = 0; i < mintCount; i++) {
            nft.mint();
        }
        vm.stopPrank();

        vm.prank(alice);
        vm.expectRevert(GateNFT.InvalidRecipient.selector);
        nft.transferFrom(alice, address(0), 1);
    }

    // ============================================================
    // 観点 7: 冪等性 (mint は冪等でない、 新 tokenId を発行する)
    // ============================================================

    /// TC-025 mint() を 2 回連続 → 新 tokenId が発行される
    function test_TC025_mint_Idempotency_NewTokenId() public {
        vm.startPrank(alice);
        uint256 first = nft.mint();
        uint256 second = nft.mint();
        vm.stopPrank();

        assertEq(first, 1);
        assertEq(second, 2);
        assertEq(nft.balanceOf(alice), 2);
        assertEq(nft.totalSupply(), 2);
    }

    // ============================================================
    // 観点 8: 並行処理 (Foundry は同期実行のため tx ordering で表現)
    // ============================================================

    /// TC-026 同 block 内で 2 user が mint → 異なる tokenId 取得
    function test_TC026_mint_ConcurrentTxOrdering() public {
        vm.prank(alice);
        uint256 aliceToken = nft.mint();

        vm.prank(bob);
        uint256 bobToken = nft.mint();

        assertEq(aliceToken, 1);
        assertEq(bobToken, 2);
        assertEq(nft.ownerOf(1), alice);
        assertEq(nft.ownerOf(2), bob);
        assertEq(nft.totalSupply(), 2);
    }

    /// TC-028 同 tokenId への transferFrom race (1 人 success / 1 人 revert)
    function test_TC028_transferFrom_ConcurrentRace() public {
        vm.prank(alice);
        nft.mint();

        // alice が bob に transfer
        vm.prank(alice);
        nft.transferFrom(alice, bob, 1);

        // alice が再度同 tokenId を transfer しようとする → revert (もう所有者ではない)
        vm.prank(alice);
        vm.expectRevert(GateNFT.NotOwner.selector);
        nft.transferFrom(alice, charlie, 1);
    }
}
