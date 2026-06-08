// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {MintNft} from "../contracts/MintNft.sol";

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data)
        external
        returns (bytes4);
}

contract GoodReceiver is IERC721Receiver {
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}

contract BadReceiver is IERC721Receiver {
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return bytes4(0xdeadbeef);
    }
}

contract RevertingReceiver is IERC721Receiver {
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        revert("intentional revert");
    }
}

contract MintNftTest is Test {
    MintNft public nft;
    address public alice = address(0xA11CE);
    address public bob = address(0xB0B);
    address public charlie = address(0xC0C);

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function setUp() public {
        // deployer = address(this) なので royaltyReceiver = address(this)
        nft = new MintNft();
    }

    // ============================================================
    // 観点 1: 正常系
    // ============================================================

    /// TC-001 mint(alice) で tokenId=1
    function test_TC001_mint_HappyPath() public {
        vm.expectEmit(true, true, true, true);
        emit Transfer(address(0), alice, 1);

        uint256 tokenId = nft.mint(alice);

        assertEq(tokenId, 1);
        assertEq(nft.ownerOf(1), alice);
        assertEq(nft.balanceOf(alice), 1);
        assertEq(nft.totalSupply(), 1);
    }

    /// TC-002 transferFrom alice → bob
    function test_TC002_transferFrom_HappyPath() public {
        nft.mint(alice);

        vm.expectEmit(true, true, true, true);
        emit Transfer(alice, bob, 1);

        vm.prank(alice);
        nft.transferFrom(alice, bob, 1);

        assertEq(nft.ownerOf(1), bob);
        assertEq(nft.balanceOf(alice), 0);
        assertEq(nft.balanceOf(bob), 1);
    }

    /// TC-003 batchMint(alice, 3)
    function test_TC003_batchMint_HappyPath() public {
        uint256[] memory ids = nft.batchMint(alice, 3);
        assertEq(ids.length, 3);
        assertEq(ids[0], 1);
        assertEq(ids[1], 2);
        assertEq(ids[2], 3);
        assertEq(nft.totalSupply(), 3);
        assertEq(nft.balanceOf(alice), 3);
    }

    /// TC-004 royaltyInfo (500 bps = 5%)
    function test_TC004_royaltyInfo_HappyPath() public view {
        (address receiver, uint256 amount) = nft.royaltyInfo(1, 1 ether);
        assertEq(receiver, nft.royaltyReceiver());
        assertEq(amount, 0.05 ether);
    }

    // ============================================================
    // 観点 2: 異常系
    // ============================================================

    /// TC-005 mint(0) → InvalidRecipient
    function test_TC005_mint_RevertsWhen_RecipientZero() public {
        vm.expectRevert(MintNft.InvalidRecipient.selector);
        nft.mint(address(0));
    }

    /// TC-006 mint past MAX_SUPPLY → MaxSupplyReached
    function test_TC006_mint_RevertsWhen_MaxSupplyReached() public {
        nft.batchMint(alice, 10);
        vm.expectRevert(abi.encodeWithSelector(MintNft.MaxSupplyReached.selector, uint256(10)));
        nft.mint(alice);
    }

    /// TC-007 unauthorized transferFrom → NotOwner
    function test_TC007_transferFrom_RevertsWhen_NotOwner() public {
        nft.mint(alice);
        vm.prank(bob);
        vm.expectRevert(MintNft.NotOwner.selector);
        nft.transferFrom(alice, charlie, 1);
    }

    /// TC-008 transferFrom to=0 → InvalidRecipient
    function test_TC008_transferFrom_RevertsWhen_RecipientZero() public {
        nft.mint(alice);
        vm.prank(alice);
        vm.expectRevert(MintNft.InvalidRecipient.selector);
        nft.transferFrom(alice, address(0), 1);
    }

    // ============================================================
    // 観点 3: 境界値
    // ============================================================

    /// TC-009 batchMint MAX_SUPPLY 個 + 1 個目で revert
    function test_TC009_batchMint_AtMaxSupply() public {
        nft.batchMint(alice, 10);
        assertEq(nft.totalSupply(), 10);
        vm.expectRevert(abi.encodeWithSelector(MintNft.MaxSupplyReached.selector, uint256(10)));
        nft.mint(alice);
    }

    /// TC-010 batchMint exceed MAX_SUPPLY
    function test_TC010_batchMint_RevertsWhen_ExceedsMax() public {
        nft.batchMint(alice, 5);
        vm.expectRevert(abi.encodeWithSelector(MintNft.MaxSupplyReached.selector, uint256(10)));
        nft.batchMint(alice, 6); // 5+6 > 10
    }

    /// TC-011 batchMint exact remaining 5
    function test_TC011_batchMint_FillsRemaining() public {
        nft.batchMint(alice, 5);
        nft.batchMint(alice, 5);
        assertEq(nft.totalSupply(), 10);
    }

    // ============================================================
    // 観点 4: 状態遷移
    // ============================================================

    /// TC-012 alice 3 個 mint → transfer 2 → Enumerable swap-and-pop
    function test_TC012_transferFrom_EnumerableSwapAndPop() public {
        nft.batchMint(alice, 3);
        // alice の token: index 0=1, 1=2, 2=3
        vm.prank(alice);
        nft.transferFrom(alice, bob, 2);

        // alice balance 3 → 2、 残 token は [1, 3]
        assertEq(nft.balanceOf(alice), 2);
        // tokenOfOwnerByIndex で順序確認
        uint256 first = nft.tokenOfOwnerByIndex(alice, 0);
        uint256 second = nft.tokenOfOwnerByIndex(alice, 1);
        assertTrue(first == 1 || first == 3);
        assertTrue(second == 1 || second == 3);
        assertTrue(first != second);

        // bob は 1 個
        assertEq(nft.balanceOf(bob), 1);
        assertEq(nft.tokenOfOwnerByIndex(bob, 0), 2);
    }

    /// TC-013 mint 10 → tokenByIndex 全件 index+1
    function test_TC013_tokenByIndex_AfterFullMint() public {
        nft.batchMint(alice, 10);
        for (uint256 i = 0; i < 10; i++) {
            assertEq(nft.tokenByIndex(i), i + 1);
        }
    }

    /// TC-014 approve → bob 経由 transfer → approval clear
    function test_TC014_approve_AndTransferFrom_ClearsApproval() public {
        nft.mint(alice);
        vm.prank(alice);
        nft.approve(bob, 1);
        assertEq(nft.getApproved(1), bob);

        vm.prank(bob);
        nft.transferFrom(alice, charlie, 1);

        assertEq(nft.ownerOf(1), charlie);
        assertEq(nft.getApproved(1), address(0));
    }

    // ============================================================
    // 観点 5: 権限
    // ============================================================

    /// TC-015 unauthorized approve → NotOwner
    function test_TC015_approve_RevertsWhen_NotOwner() public {
        nft.mint(alice);
        vm.prank(charlie);
        vm.expectRevert(MintNft.NotOwner.selector);
        nft.approve(charlie, 1);
    }

    /// TC-016 operator が approve できる
    function test_TC016_approve_AsOperator() public {
        nft.mint(alice);
        vm.prank(alice);
        nft.setApprovalForAll(bob, true);

        vm.expectEmit(true, true, true, true);
        emit Approval(alice, charlie, 1);

        vm.prank(bob);
        nft.approve(charlie, 1);
        assertEq(nft.getApproved(1), charlie);
    }

    /// TC-017 operator が transferFrom できる
    function test_TC017_transferFrom_AsOperator() public {
        nft.mint(alice);
        vm.prank(alice);
        nft.setApprovalForAll(bob, true);

        vm.prank(bob);
        nft.transferFrom(alice, charlie, 1);
        assertEq(nft.ownerOf(1), charlie);
    }

    // ============================================================
    // 観点 6: 入力バリデーション
    // ============================================================

    /// TC-018 batchMint to=0 → InvalidRecipient
    function test_TC018_batchMint_RevertsWhen_RecipientZero() public {
        vm.expectRevert(MintNft.InvalidRecipient.selector);
        nft.batchMint(address(0), 5);
    }

    /// TC-019 ownerOf nonexistent → require revert
    function test_TC019_ownerOf_Nonexistent() public {
        vm.expectRevert(bytes("ERC721: nonexistent"));
        nft.ownerOf(999);
    }

    /// TC-020 tokenOfOwnerByIndex out of bounds
    function test_TC020_tokenOfOwnerByIndex_OutOfBounds() public {
        nft.batchMint(alice, 2);
        vm.expectRevert(MintNft.OwnerIndexOutOfBounds.selector);
        nft.tokenOfOwnerByIndex(alice, 2);
    }

    // ============================================================
    // 観点 7: 冪等性
    // ============================================================

    /// TC-021 mint 3 回 → 新 tokenId
    function test_TC021_mint_NotIdempotent() public {
        nft.mint(alice);
        nft.mint(alice);
        nft.mint(alice);
        assertEq(nft.totalSupply(), 3);
        assertEq(nft.balanceOf(alice), 3);
    }

    /// TC-022 approve 2 回 (上書き)
    function test_TC022_approve_Overwrite() public {
        nft.mint(alice);
        vm.startPrank(alice);
        nft.approve(bob, 1);
        nft.approve(bob, 1); // 上書きで同じ to
        vm.stopPrank();
        assertEq(nft.getApproved(1), bob);
    }

    /// TC-023 setApprovalForAll true → false
    function test_TC023_setApprovalForAll_Toggle() public {
        vm.startPrank(alice);
        nft.setApprovalForAll(bob, true);
        assertTrue(nft.isApprovedForAll(alice, bob));
        nft.setApprovalForAll(bob, false);
        assertFalse(nft.isApprovedForAll(alice, bob));
        vm.stopPrank();
    }

    // ============================================================
    // 観点 8: 並行処理
    // ============================================================

    /// TC-024 同 block 内で 2 user が mint
    function test_TC024_mint_ConcurrentDifferentUsers() public {
        nft.mint(alice);
        nft.mint(bob);
        assertEq(nft.ownerOf(1), alice);
        assertEq(nft.ownerOf(2), bob);
        assertEq(nft.totalSupply(), 2);
    }

    /// TC-025 同 tokenId race (1 人 success / 1 人 revert)
    function test_TC025_transferFrom_Race() public {
        nft.mint(alice);
        vm.prank(alice);
        nft.transferFrom(alice, bob, 1);
        vm.prank(alice);
        vm.expectRevert(MintNft.NotOwner.selector);
        nft.transferFrom(alice, charlie, 1);
    }

    /// TC-026 batchMint 競合
    function test_TC026_batchMint_Race() public {
        nft.batchMint(alice, 6);
        vm.expectRevert(abi.encodeWithSelector(MintNft.MaxSupplyReached.selector, uint256(10)));
        nft.batchMint(bob, 5); // 6+5 > 10
    }

    // ============================================================
    // 観点 9: 性能
    // ============================================================

    /// TC-027 batchMint(10) gas
    function test_TC027_batchMint_Gas() public {
        uint256 gasStart = gasleft();
        nft.batchMint(alice, 10);
        uint256 gasUsed = gasStart - gasleft();
        // 1M を上限目安に
        assertLt(gasUsed, 2_000_000);
    }

    /// TC-028 tokenOfOwnerByIndex gas
    function test_TC028_tokenOfOwnerByIndex_Gas() public {
        nft.batchMint(alice, 10);
        uint256 gasStart = gasleft();
        for (uint256 i = 0; i < 10; i++) {
            nft.tokenOfOwnerByIndex(alice, i);
        }
        uint256 gasUsed = gasStart - gasleft();
        assertLt(gasUsed, 100_000);
    }

    /// TC-029 swap-and-pop O(1) gas
    function test_TC029_transferFrom_GasIsConstant() public {
        nft.batchMint(alice, 5);
        uint256 gasStart = gasleft();
        vm.prank(alice);
        nft.transferFrom(alice, bob, 3);
        uint256 gasUsed = gasStart - gasleft();
        // 1 回の transferFrom が < 200k gas
        assertLt(gasUsed, 200_000);
    }

    // ============================================================
    // 観点 10: セキュリティ
    // ============================================================

    /// TC-030 royaltyReceiver immutable
    function test_TC030_royaltyReceiver_Immutable() public view {
        // royaltyReceiver は immutable で deployer = address(this)
        assertEq(nft.royaltyReceiver(), address(this));
    }

    /// TC-031 safeTransferFrom to BadReceiver → UnsafeRecipient
    function test_TC031_safeTransferFrom_BadReceiver() public {
        BadReceiver bad = new BadReceiver();
        nft.mint(alice);
        vm.prank(alice);
        vm.expectRevert(MintNft.UnsafeRecipient.selector);
        nft.safeTransferFrom(alice, address(bad), 1);
    }

    /// TC-032 safeTransferFrom to GoodReceiver / EOA → success
    function test_TC032_safeTransferFrom_GoodReceiver_AndEOA() public {
        GoodReceiver good = new GoodReceiver();
        nft.mint(alice);
        nft.mint(alice);

        // GoodReceiver (contract)
        vm.prank(alice);
        nft.safeTransferFrom(alice, address(good), 1);
        assertEq(nft.ownerOf(1), address(good));

        // EOA (charlie、 code.length == 0)
        vm.prank(alice);
        nft.safeTransferFrom(alice, charlie, 2);
        assertEq(nft.ownerOf(2), charlie);
    }

    // ============================================================
    // 補助 — supportsInterface
    // ============================================================

    function test_supportsInterface_All() public view {
        assertTrue(nft.supportsInterface(0x01ffc9a7)); // ERC165
        assertTrue(nft.supportsInterface(0x80ac58cd)); // ERC721
        assertTrue(nft.supportsInterface(0x780e9d63)); // ERC721 Enumerable
        assertTrue(nft.supportsInterface(0x2a55205a)); // ERC2981
        assertFalse(nft.supportsInterface(0xdeadbeef));
    }

    // ============================================================
    // coverage 補完
    // ============================================================

    /// tokenByIndex out of bounds
    function test_tokenByIndex_OutOfBounds() public {
        nft.batchMint(alice, 3);
        vm.expectRevert(MintNft.TokenIndexOutOfBounds.selector);
        nft.tokenByIndex(3);
    }

    /// safeTransferFrom 3 引数 overload
    function test_safeTransferFrom_ThreeArgOverload() public {
        nft.mint(alice);
        vm.prank(alice);
        nft.safeTransferFrom(alice, charlie, 1);
        assertEq(nft.ownerOf(1), charlie);
    }

    /// safeTransferFrom 4 引数 (data 付き) overload
    function test_safeTransferFrom_FourArgOverload_WithData() public {
        nft.mint(alice);
        vm.prank(alice);
        nft.safeTransferFrom(alice, charlie, 1, hex"deadbeef");
        assertEq(nft.ownerOf(1), charlie);
    }

    /// safeTransferFrom to RevertingReceiver → catch branch hit → UnsafeRecipient
    function test_safeTransferFrom_RevertingReceiver_CatchBranch() public {
        RevertingReceiver reverter = new RevertingReceiver();
        nft.mint(alice);
        vm.prank(alice);
        vm.expectRevert(MintNft.UnsafeRecipient.selector);
        nft.safeTransferFrom(alice, address(reverter), 1);
    }

    /// AlreadyMinted は通常経路では起きないが、 _owners を vm.store で直接書き換えて branch hit
    function test_mint_AlreadyMinted_DefensiveBranch() public {
        // storage layout: _owners は slot 3 (forge inspect で確認済)
        // totalSupply は 0、 _owners[1] = alice を set した状態で mint(alice) すると
        // tokenId = totalSupply+1 = 1、 _owners[1] != 0 なので AlreadyMinted revert
        bytes32 ownersSlot = keccak256(abi.encode(uint256(1), uint256(3)));
        vm.store(address(nft), ownersSlot, bytes32(uint256(uint160(alice))));

        vm.expectRevert(MintNft.AlreadyMinted.selector);
        nft.mint(alice);
    }
}
