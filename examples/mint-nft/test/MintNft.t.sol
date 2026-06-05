// SPDX-License-Identifier: MIT
// /contract-test-foundry 出力 (Layer 1 spec test-spec-mint-nft.md 由来)
// 用途: examples/mint-nft の test 後付け導入
// 観点 grouping: 1 正常系 / 2 異常系 / 3 境界値 / 4 状態遷移 / 5 権限 / 10 セキュリティ
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/MintNft.sol";

contract MintNftTest is Test {
    MintNft public target;
    address public deployer = address(this);
    address public alice = address(0xA1);
    address public bob = address(0xB0);
    address public carol = address(0xC0);

    function setUp() public {
        target = new MintNft();
    }

    // ==========================================
    // 観点 1: 正常系 (TC-001 〜 TC-004)
    // ==========================================

    /// TC-001: mint(alice) → tokenId == 1
    function test_Mint_HappyPath() public {
        vm.expectEmit(true, true, true, true);
        emit MintNft.Transfer(address(0), alice, 1);
        uint256 tokenId = target.mint(alice);
        assertEq(tokenId, 1);
        assertEq(target.balanceOf(alice), 1);
        assertEq(target.ownerOf(1), alice);
        assertEq(target.totalSupply(), 1);
    }

    /// TC-002: batchMint(alice, 3) → [2,3,4]
    function test_BatchMint_HappyPath() public {
        target.mint(alice);
        uint256[] memory ids = target.batchMint(alice, 3);
        assertEq(ids.length, 3);
        assertEq(ids[0], 2);
        assertEq(ids[1], 3);
        assertEq(ids[2], 4);
        assertEq(target.balanceOf(alice), 4);
        assertEq(target.totalSupply(), 4);
    }

    /// TC-003: royaltyInfo(_, 1 ether) → 0.05 ether to deployer
    function test_RoyaltyInfo_HappyPath() public {
        target.mint(alice);
        (address receiver, uint256 amount) = target.royaltyInfo(1, 1 ether);
        assertEq(receiver, deployer);
        assertEq(amount, 1 ether * 500 / 10_000);  // 5%
    }

    /// TC-004: transferFrom by owner alice → ownerOf(1) == bob
    function test_TransferFrom_HappyPath() public {
        target.mint(alice);
        vm.prank(alice);
        target.transferFrom(alice, bob, 1);
        assertEq(target.ownerOf(1), bob);
        assertEq(target.balanceOf(alice), 0);
        assertEq(target.balanceOf(bob), 1);
    }

    // ==========================================
    // 観点 2: 異常系 (TC-005 〜 TC-007)
    // ==========================================

    /// TC-005: mint(address(0)) → InvalidRecipient
    function test_Mint_Reverts_When_RecipientZero() public {
        vm.expectRevert(MintNft.InvalidRecipient.selector);
        target.mint(address(0));
    }

    /// TC-006: 非 owner / 非 approved の transferFrom → NotOwner
    function test_TransferFrom_Reverts_When_NotOwner() public {
        target.mint(alice);
        vm.prank(bob);
        vm.expectRevert(MintNft.NotOwner.selector);
        target.transferFrom(alice, bob, 1);
    }

    /// TC-007: transferFrom to address(0) → InvalidRecipient
    function test_TransferFrom_Reverts_When_RecipientZero() public {
        target.mint(alice);
        vm.prank(alice);
        vm.expectRevert(MintNft.InvalidRecipient.selector);
        target.transferFrom(alice, address(0), 1);
    }

    // ==========================================
    // 観点 3: 境界値 (TC-008 〜 TC-010)
    // ==========================================

    /// TC-008: batchMint MAX_SUPPLY (10) → success
    function test_BatchMint_AtMaxSupply() public {
        target.batchMint(alice, 10);
        assertEq(target.totalSupply(), 10);
        assertEq(target.balanceOf(alice), 10);
    }

    /// TC-009: MAX_SUPPLY 到達後の mint → MaxSupplyReached
    function test_Mint_Reverts_AtMaxSupplyPlusOne() public {
        target.batchMint(alice, 10);
        vm.expectRevert(abi.encodeWithSelector(MintNft.MaxSupplyReached.selector, 10));
        target.mint(alice);
    }

    /// TC-010: batchMint MAX_SUPPLY + 1 → MaxSupplyReached
    function test_BatchMint_Reverts_AtMaxSupplyPlusOne() public {
        vm.expectRevert(abi.encodeWithSelector(MintNft.MaxSupplyReached.selector, 10));
        target.batchMint(alice, 11);
    }

    /// fuzz: 1 〜 MAX_SUPPLY (10) 範囲 batchMint は常に PASS
    function testFuzz_BatchMint_Boundary(uint256 count) public {
        count = bound(count, 1, 10);
        target.batchMint(alice, count);
        assertEq(target.totalSupply(), count);
    }

    // ==========================================
    // 観点 4: 状態遷移 (TC-011 〜 TC-012)
    // ==========================================

    /// TC-011: enumerable index が batchMint 後 連番で取得可能
    function test_Enumerable_IndexAfterBatchMint() public {
        target.batchMint(alice, 4);
        assertEq(target.tokenOfOwnerByIndex(alice, 0), 1);
        assertEq(target.tokenOfOwnerByIndex(alice, 1), 2);
        assertEq(target.tokenOfOwnerByIndex(alice, 2), 3);
        assertEq(target.tokenOfOwnerByIndex(alice, 3), 4);
    }

    /// TC-012: transfer 後の enumerable は swap で reorder
    function test_Enumerable_IndexAfterTransfer() public {
        target.batchMint(alice, 4);
        // alice owns [1,2,3,4]、 tokenId 2 を bob に transfer
        vm.prank(alice);
        target.transferFrom(alice, bob, 2);
        assertEq(target.balanceOf(alice), 3);
        // alice の owned tokens 3 件は元 4 件のうち 2 を除いた set
        uint256 a0 = target.tokenOfOwnerByIndex(alice, 0);
        uint256 a1 = target.tokenOfOwnerByIndex(alice, 1);
        uint256 a2 = target.tokenOfOwnerByIndex(alice, 2);
        assertTrue(a0 != 2 && a1 != 2 && a2 != 2);
        // bob が tokenId 2 を持つ
        assertEq(target.tokenOfOwnerByIndex(bob, 0), 2);
    }

    // ==========================================
    // 観点 5: 権限 (TC-013 〜 TC-014)
    // ==========================================

    /// TC-013: alice が bob に approve → bob が transferFrom 可能
    function test_Approve_AllowsTransfer() public {
        target.mint(alice);
        vm.prank(alice);
        target.approve(bob, 1);
        assertEq(target.getApproved(1), bob);

        vm.prank(bob);
        target.transferFrom(alice, bob, 1);
        assertEq(target.ownerOf(1), bob);
    }

    /// TC-014: alice が operator として carol を setApprovalForAll → carol が transferFrom 可能
    function test_SetApprovalForAll_AllowsTransfer() public {
        target.mint(alice);
        vm.prank(alice);
        target.setApprovalForAll(carol, true);
        assertTrue(target.isApprovedForAll(alice, carol));

        vm.prank(carol);
        target.transferFrom(alice, bob, 1);
        assertEq(target.ownerOf(1), bob);
    }

    // ==========================================
    // 観点 10: セキュリティ (TC-015 〜 TC-016)
    // ==========================================

    /// TC-015: safeTransferFrom to EOA → code.length 0 で callback skip、 success
    function test_SafeTransferFrom_ToEoa_Succeeds() public {
        target.mint(alice);
        vm.prank(alice);
        target.safeTransferFrom(alice, bob, 1);
        assertEq(target.ownerOf(1), bob);
    }

    /// TC-016: supportsInterface で ERC721 + ERC2981 を確認
    function test_SupportsInterface() public {
        assertTrue(target.supportsInterface(0x01ffc9a7));  // ERC165
        assertTrue(target.supportsInterface(0x80ac58cd));  // ERC721
        assertTrue(target.supportsInterface(0x780e9d63));  // ERC721 Enumerable
        assertTrue(target.supportsInterface(0x2a55205a));  // ERC2981
        assertFalse(target.supportsInterface(0xffffffff)); // 無効 ID
    }
}
