// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {MarketNft, IERC721Receiver} from "../contracts/MarketNft.sol";
import {
    GoodReceiver,
    WrongSelectorReceiver,
    RevertingReceiver,
    ReentrantReceiver,
    NoFallback
} from "./helpers/Mocks.sol";

contract MarketNftTest is Test {
    MarketNft internal nft;
    address internal royaltyReceiver = makeAddr("royaltyReceiver");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal carol = makeAddr("carol");
    address internal mallory = makeAddr("mallory");

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function setUp() public {
        nft = new MarketNft(royaltyReceiver);
    }

    // 観点 1: 正常系

    // TC-001: mint で tokenId=1 が alice に紐付く
    function test_Mint_HappyPath_AssignsOwnerAndEmitsTransfer() public {
        vm.expectEmit(true, true, true, true);
        emit Transfer(address(0), alice, 1);
        uint256 tokenId = nft.mint(alice);

        assertEq(tokenId, 1);
        assertEq(nft.ownerOf(1), alice);
        assertEq(nft.balanceOf(alice), 1);
        assertEq(nft.totalSupply(), 1);
    }

    // TC-002: approve で getApproved が更新される
    function test_Approve_HappyPath_SetsApprovedAddress() public {
        nft.mint(alice);

        vm.expectEmit(true, true, true, true);
        emit Approval(alice, bob, 1);
        vm.prank(alice);
        nft.approve(bob, 1);

        assertEq(nft.getApproved(1), bob);
    }

    // TC-003: transferFrom で approved が消える + 所有権が動く
    function test_TransferFrom_ByApproved_ClearsApprovalAndMovesOwner() public {
        nft.mint(alice);
        vm.prank(alice);
        nft.approve(bob, 1);

        vm.expectEmit(true, true, true, true);
        emit Transfer(alice, carol, 1);
        vm.prank(bob);
        nft.transferFrom(alice, carol, 1);

        assertEq(nft.ownerOf(1), carol);
        assertEq(nft.balanceOf(alice), 0);
        assertEq(nft.balanceOf(carol), 1);
        assertEq(nft.getApproved(1), address(0));
    }

    // TC-004: safeTransferFrom (EOA 宛は hook を呼ばずに成功)
    function test_SafeTransferFrom_ToEOA_Succeeds() public {
        nft.mint(alice);
        vm.prank(alice);
        nft.safeTransferFrom(alice, carol, 1);
        assertEq(nft.ownerOf(1), carol);
    }

    // TC-005: safeTransferFrom (contract 宛、 正規 receiver) → hook 呼出 + data 通過
    function test_SafeTransferFrom_ToValidReceiverContract_TriggersHook() public {
        nft.mint(alice);
        GoodReceiver receiver = new GoodReceiver();
        bytes memory data = hex"deadbeefcafe";
        vm.prank(alice);
        nft.safeTransferFrom(alice, address(receiver), 1, data);

        assertEq(nft.ownerOf(1), address(receiver));
        assertEq(receiver.callCount(), 1);
        assertEq(receiver.lastOperator(), alice);
        assertEq(receiver.lastFrom(), alice);
        assertEq(receiver.lastTokenId(), 1);
        assertEq(receiver.lastData(), data);
    }

    // TC-006: royaltyInfo が 5% を返す
    function test_RoyaltyInfo_Returns5PercentOfSalePrice() public view {
        (address receiver, uint256 royaltyAmount) = nft.royaltyInfo(1, 10_000);
        assertEq(receiver, royaltyReceiver);
        assertEq(royaltyAmount, 500);
    }

    // TC-007: supportsInterface が ERC165 / ERC721 / ERC721Metadata / ERC2981 を true return
    function test_SupportsInterface_AllExpectedIds() public view {
        assertTrue(nft.supportsInterface(0x01ffc9a7));
        assertTrue(nft.supportsInterface(0x80ac58cd));
        assertTrue(nft.supportsInterface(0x5b5e139f));
        assertTrue(nft.supportsInterface(0x2a55205a));
        assertFalse(nft.supportsInterface(0xffffffff));
    }

    // TC-017: setApprovalForAll で operator が登録される
    function test_SetApprovalForAll_HappyPath() public {
        vm.expectEmit(true, true, false, true);
        emit ApprovalForAll(alice, bob, true);
        vm.prank(alice);
        nft.setApprovalForAll(bob, true);
        assertTrue(nft.isApprovedForAll(alice, bob));
    }

    // TC-018: tokenURI が空文字列 (MVP default)
    function test_TokenURI_ReturnsEmptyForMintedToken() public {
        nft.mint(alice);
        assertEq(nft.tokenURI(1), "");
    }

    // 観点 2: 異常系

    // TC-019: 未 approve な caller が transferFrom → revert
    function test_TransferFrom_RevertsWhen_CallerNotApproved() public {
        nft.mint(alice);
        vm.prank(carol);
        vm.expectRevert(MarketNft.NotOwnerOrApproved.selector);
        nft.transferFrom(alice, bob, 1);
    }

    // TC-020: from が owner と不一致 → revert
    function test_TransferFrom_RevertsWhen_FromIsNotOwner() public {
        nft.mint(alice);
        vm.prank(alice);
        vm.expectRevert(MarketNft.NotOwnerOrApproved.selector);
        nft.transferFrom(bob, carol, 1);
    }

    // TC-021: 不正 selector の receiver → UnsafeRecipient
    function test_SafeTransferFrom_RevertsWhen_ReceiverReturnsWrongSelector() public {
        nft.mint(alice);
        WrongSelectorReceiver bad = new WrongSelectorReceiver();
        vm.prank(alice);
        vm.expectRevert(MarketNft.UnsafeRecipient.selector);
        nft.safeTransferFrom(alice, address(bad), 1);
        assertEq(nft.ownerOf(1), alice);
    }

    // TC-022: receiver が revert → UnsafeRecipient (try/catch 経路)
    function test_SafeTransferFrom_RevertsWhen_ReceiverReverts() public {
        nft.mint(alice);
        RevertingReceiver bad = new RevertingReceiver();
        vm.prank(alice);
        vm.expectRevert(MarketNft.UnsafeRecipient.selector);
        nft.safeTransferFrom(alice, address(bad), 1);
    }

    // TC-023: 未存在 tokenId の tokenURI → revert
    function test_TokenURI_RevertsForNonexistentToken() public {
        vm.expectRevert(bytes("ERC721: nonexistent"));
        nft.tokenURI(999);
    }

    // 観点 3: 境界値

    // TC-045: mint(0) → InvalidRecipient
    function test_Mint_RevertsWhen_ToIsZeroAddress() public {
        vm.expectRevert(MarketNft.InvalidRecipient.selector);
        nft.mint(address(0));
    }

    // TC-046: transferFrom to=0 → InvalidRecipient
    function test_TransferFrom_RevertsWhen_ToIsZeroAddress() public {
        nft.mint(alice);
        vm.prank(alice);
        vm.expectRevert(MarketNft.InvalidRecipient.selector);
        nft.transferFrom(alice, address(0), 1);
    }

    // TC-047: constructor の royaltyReceiver=0 → revert
    function test_Constructor_RevertsWhen_RoyaltyReceiverIsZero() public {
        vm.expectRevert(MarketNft.InvalidRecipient.selector);
        new MarketNft(address(0));
    }

    // TC-057: 100 件 mint で balanceOf が 100
    function test_Mint_AccumulatesBalance_Over100() public {
        for (uint256 i = 0; i < 100; i++) {
            nft.mint(alice);
        }
        assertEq(nft.balanceOf(alice), 100);
        assertEq(nft.totalSupply(), 100);
        assertEq(nft.ownerOf(100), alice);
    }

    // 観点 4: 状態遷移

    // TC-067: mint → transfer で balance が動く
    function test_StateTransition_MintThenTransfer_UpdatesBalances() public {
        nft.mint(alice);
        assertEq(nft.balanceOf(alice), 1);
        vm.prank(alice);
        nft.transferFrom(alice, bob, 1);
        assertEq(nft.balanceOf(alice), 0);
        assertEq(nft.balanceOf(bob), 1);
        assertEq(nft.ownerOf(1), bob);
    }

    // 観点 5: 権限

    // TC-068: mint は access control なし、 mallory も自由に mint 可
    function test_Mint_AccessIsPublic() public {
        vm.prank(mallory);
        uint256 id = nft.mint(mallory);
        assertEq(id, 1);
        assertEq(nft.ownerOf(1), mallory);
    }

    // TC-069: 非 owner の approve → revert
    function test_Approve_RevertsWhen_CallerNotOwnerNorOperator() public {
        nft.mint(alice);
        vm.prank(mallory);
        vm.expectRevert(MarketNft.NotOwnerOrApproved.selector);
        nft.approve(bob, 1);
    }

    // TC-070: operator (isApprovedForAll) が approve 呼出可
    function test_Approve_OperatorCanApprove() public {
        nft.mint(alice);
        vm.prank(alice);
        nft.setApprovalForAll(bob, true);
        vm.prank(bob);
        nft.approve(carol, 1);
        assertEq(nft.getApproved(1), carol);
    }

    // TC-071: getApproved 経由の transferFrom
    function test_TransferFrom_ViaGetApproved() public {
        nft.mint(alice);
        vm.prank(alice);
        nft.approve(bob, 1);
        vm.prank(bob);
        nft.transferFrom(alice, carol, 1);
        assertEq(nft.ownerOf(1), carol);
        assertEq(nft.getApproved(1), address(0));
    }

    // TC-072: isApprovedForAll 経由の transferFrom
    function test_TransferFrom_ViaOperatorApproval() public {
        nft.mint(alice);
        vm.prank(alice);
        nft.setApprovalForAll(bob, true);
        vm.prank(bob);
        nft.transferFrom(alice, carol, 1);
        assertEq(nft.ownerOf(1), carol);
    }

    // TC-073: operator approval 取消後の transferFrom → revert
    function test_TransferFrom_RevertsWhen_OperatorApprovalRevoked() public {
        nft.mint(alice);
        vm.prank(alice);
        nft.setApprovalForAll(bob, true);
        vm.prank(alice);
        nft.setApprovalForAll(bob, false);
        vm.prank(bob);
        vm.expectRevert(MarketNft.NotOwnerOrApproved.selector);
        nft.transferFrom(alice, carol, 1);
    }

    // 観点 6: 入力バリデーション

    // TC-076 (= TC-045 と同主旨)
    function test_Validation_MintRejectsZeroAddress() public {
        vm.expectRevert(MarketNft.InvalidRecipient.selector);
        nft.mint(address(0));
    }

    // TC-077 (= TC-046 と同主旨)
    function test_Validation_TransferRejectsZeroAddress() public {
        nft.mint(alice);
        vm.prank(alice);
        vm.expectRevert(MarketNft.InvalidRecipient.selector);
        nft.transferFrom(alice, address(0), 1);
    }

    // TC-078: safeTransferFrom 4 引数版で 1 KB の data でも EOA は素通り
    function test_Validation_SafeTransferAcceptsLongData_ToEOA() public {
        nft.mint(alice);
        bytes memory data = new bytes(1024);
        for (uint256 i = 0; i < 1024; i++) data[i] = bytes1(uint8(i % 251));
        vm.prank(alice);
        nft.safeTransferFrom(alice, carol, 1, data);
        assertEq(nft.ownerOf(1), carol);
    }

    // 観点 10: セキュリティ

    // TC-099: receiver hook 内で再 transferFrom を試行 (third party 宛) → revert で吸収、 attacker が owner のまま保持
    function test_Security_OnReceivedReentrancyCannotStealToThirdParty() public {
        nft.mint(alice);
        ReentrantReceiver attacker = new ReentrantReceiver(nft);
        // attacker が hook 内で第三者 (mallory) へ送ろうとするが、
        // attacker == from で transferFrom は実行できるため (attacker == owner = msg.sender == from)
        // self-owned transfer は成立する。 reentrancy で「別所有権を奪う」のは不可だが、
        // hook 完了後の最終所有者は attacker の意思で決まる。 ここでは「target 未設定 = 攻撃しない」場合に
        // ownerOf=attacker、 attempted=true で受領のみ起きることを確認する。
        vm.prank(alice);
        nft.safeTransferFrom(alice, address(attacker), 1);
        assertEq(nft.ownerOf(1), address(attacker));
        assertTrue(attacker.attempted());
        assertFalse(attacker.reentrantSucceeded());
    }

    // TC-099 補強: target を mallory に設定すると attacker は自分の保有 NFT を mallory へ流せる
    // (= reentrancy ではなく単なる正規 transferFrom、 attack ではない)。 これは仕様の境界を可視化する補助 test。
    function test_Security_OnReceivedReentrancySelfControlledIsNotAttack() public {
        nft.mint(alice);
        ReentrantReceiver attacker = new ReentrantReceiver(nft);
        attacker.setTarget(mallory);
        vm.prank(alice);
        nft.safeTransferFrom(alice, address(attacker), 1);
        // hook 内で attacker 自身が transfer 実行 → 最終 owner は mallory
        assertEq(nft.ownerOf(1), mallory);
        assertTrue(attacker.reentrantSucceeded());
    }

    // TC-101: 偽 selector receiver で revert される (セキュリティ視点)
    function test_Security_RejectsForgedReceiverSelector() public {
        nft.mint(alice);
        WrongSelectorReceiver bad = new WrongSelectorReceiver();
        vm.prank(alice);
        vm.expectRevert(MarketNft.UnsafeRecipient.selector);
        nft.safeTransferFrom(alice, address(bad), 1);
    }

    // 補助: safeTransferFrom 3 引数版で contract 宛は hook 呼出 (data 空)
    function test_SafeTransferFrom3Arg_ToContract_TriggersHookWithEmptyData() public {
        nft.mint(alice);
        GoodReceiver receiver = new GoodReceiver();
        vm.prank(alice);
        nft.safeTransferFrom(alice, address(receiver), 1);
        assertEq(receiver.callCount(), 1);
        assertEq(receiver.lastData().length, 0);
    }

    // 補助: contract code 長 0 (NoFallback の deploy 前) 経路は EOA と同じ扱いを cover するため
    // safeTransferFrom で hook を持たない contract (NoFallback) に送ろうとすると try/catch 失敗 = UnsafeRecipient
    function test_SafeTransferFrom_ToContractWithoutHook_Reverts() public {
        nft.mint(alice);
        NoFallback receiver = new NoFallback();
        vm.prank(alice);
        vm.expectRevert(MarketNft.UnsafeRecipient.selector);
        nft.safeTransferFrom(alice, address(receiver), 1);
    }

    // 補助: 境界値 fuzz - royaltyInfo の整数除算 (`forge fuzz`)
    function testFuzz_RoyaltyInfo_AlwaysBelowSalePrice(uint128 salePrice) public view {
        (, uint256 royalty) = nft.royaltyInfo(0, salePrice);
        assertLe(royalty, uint256(salePrice));
        // 5% 計算が常に成り立つ
        assertEq(royalty, (uint256(salePrice) * 500) / 10_000);
    }

    // 補助: 入力バリデーション fuzz - mint(to) は to != 0 なら必ず success かつ tokenId++ になる
    function testFuzz_Mint_AnyNonZeroAddress_Succeeds(address to) public {
        vm.assume(to != address(0));
        uint256 before = nft.totalSupply();
        uint256 id = nft.mint(to);
        assertEq(id, before + 1);
        assertEq(nft.ownerOf(id), to);
    }
}
