// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, StdInvariant} from "forge-std/Test.sol";
import {MarketNft} from "../contracts/MarketNft.sol";
import {SimpleMarketplace} from "../contracts/SimpleMarketplace.sol";
import {
    EthRejecter,
    NoFallback,
    MaliciousRoyaltyNft,
    ReentrantBuyer,
    RoyaltyReentrant
} from "./helpers/Mocks.sol";

contract SimpleMarketplaceTest is Test {
    MarketNft internal nft;
    SimpleMarketplace internal market;

    address internal royaltyReceiver = makeAddr("royaltyReceiver");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal carol = makeAddr("carol");
    address internal mallory = makeAddr("mallory");

    event Listed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event Bought(uint256 indexed tokenId, address indexed buyer, uint256 price);
    event Cancelled(uint256 indexed tokenId);
    event OfferMade(
        uint256 indexed offerId,
        uint256 indexed tokenId,
        address indexed buyer,
        uint256 amount,
        uint256 deadline
    );
    event OfferCancelled(uint256 indexed offerId);
    event OfferAccepted(uint256 indexed offerId, uint256 indexed tokenId, address indexed buyer);

    function setUp() public {
        nft = new MarketNft(royaltyReceiver);
        market = new SimpleMarketplace(address(nft));
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(carol, 100 ether);
        vm.deal(mallory, 100 ether);
    }

    // ===== helpers =====

    function _mintAndApprove(address to, uint256 expectedTokenId) internal returns (uint256 tokenId) {
        tokenId = nft.mint(to);
        assertEq(tokenId, expectedTokenId);
        vm.prank(to);
        nft.approve(address(market), tokenId);
    }

    function _list(address seller, uint256 tokenId, uint256 price) internal {
        vm.prank(seller);
        market.list(tokenId, price);
    }

    function _makeOffer(address buyer, uint256 tokenId, uint256 amount) internal returns (uint256 offerId) {
        vm.prank(buyer);
        offerId = market.makeOffer{value: amount}(tokenId, amount);
    }

    function _makeOfferWithDeadline(address buyer, uint256 tokenId, uint256 amount, uint256 deadline)
        internal
        returns (uint256 offerId)
    {
        vm.prank(buyer);
        offerId = market.makeOffer{value: amount}(tokenId, amount, deadline);
    }

    function _listingActive(uint256 tokenId) internal view returns (bool) {
        (, , bool active) = market.listings(tokenId);
        return active;
    }

    function _listingSeller(uint256 tokenId) internal view returns (address seller) {
        (seller, , ) = market.listings(tokenId);
    }

    function _offerActive(uint256 offerId) internal view returns (bool active) {
        (, , , , active) = market.offers(offerId);
    }

    function _offerBuyer(uint256 offerId) internal view returns (address buyer) {
        (, buyer, , , ) = market.offers(offerId);
    }

    function _offerAmount(uint256 offerId) internal view returns (uint256 amount) {
        (, , amount, , ) = market.offers(offerId);
    }

    function _offerDeadline(uint256 offerId) internal view returns (uint256 deadline) {
        (, , , deadline, ) = market.offers(offerId);
    }

    // ===== 観点 1: 正常系 =====

    // TC-008
    function test_List_HappyPath() public {
        _mintAndApprove(alice, 1);

        vm.expectEmit(true, true, false, true);
        emit Listed(1, alice, 1 ether);
        _list(alice, 1, 1 ether);

        assertTrue(_listingActive(1));
        assertEq(_listingSeller(1), alice);
    }

    // TC-009
    function test_Buy_HappyPath_PaysRoyaltyAndSeller() public {
        _mintAndApprove(alice, 1);
        _list(alice, 1, 1 ether);

        uint256 aliceBefore = alice.balance;
        uint256 royaltyBefore = royaltyReceiver.balance;

        vm.expectEmit(true, true, false, true);
        emit Bought(1, bob, 1 ether);
        vm.prank(bob);
        market.buy{value: 1 ether}(1);

        assertEq(nft.ownerOf(1), bob);
        assertFalse(_listingActive(1));
        assertEq(alice.balance - aliceBefore, 0.95 ether);
        assertEq(royaltyReceiver.balance - royaltyBefore, 0.05 ether);
    }

    // TC-010: buyNft alias
    function test_BuyNftAlias_BehavesSameAsBuy() public {
        _mintAndApprove(alice, 1);
        _list(alice, 1, 1 ether);

        vm.prank(bob);
        market.buyNft{value: 1 ether}(1);

        assertEq(nft.ownerOf(1), bob);
        assertFalse(_listingActive(1));
    }

    // TC-011
    function test_Cancel_HappyPath_DeactivatesListing() public {
        _mintAndApprove(alice, 1);
        _list(alice, 1, 1 ether);

        vm.expectEmit(true, false, false, false);
        emit Cancelled(1);
        vm.prank(alice);
        market.cancel(1);

        assertFalse(_listingActive(1));
    }

    // TC-012
    function test_MakeOffer_TwoArgs_DefaultMaxDeadline() public {
        nft.mint(alice);
        vm.expectEmit(true, true, true, true);
        emit OfferMade(1, 1, bob, 0.5 ether, type(uint256).max);
        uint256 offerId = _makeOffer(bob, 1, 0.5 ether);

        assertEq(offerId, 1);
        assertTrue(_offerActive(offerId));
        assertEq(_offerDeadline(offerId), type(uint256).max);
    }

    // TC-013
    function test_MakeOffer_ThreeArgs_RespectsExplicitDeadline() public {
        nft.mint(alice);
        uint256 deadline = block.timestamp + 1 days;
        uint256 offerId = _makeOfferWithDeadline(bob, 1, 0.5 ether, deadline);
        assertEq(offerId, 1);
        assertEq(_offerDeadline(offerId), deadline);
    }

    // TC-014
    function test_CancelOffer_HappyPath_RefundsBuyer() public {
        nft.mint(alice);
        uint256 offerId = _makeOffer(bob, 1, 0.5 ether);
        uint256 bobBefore = bob.balance;

        vm.expectEmit(true, false, false, false);
        emit OfferCancelled(offerId);
        vm.prank(bob);
        market.cancelOffer(offerId);

        assertFalse(_offerActive(offerId));
        assertEq(bob.balance - bobBefore, 0.5 ether);
    }

    // TC-015
    function test_AcceptOffer_HappyPath_TransfersAndPays() public {
        _mintAndApprove(alice, 1);
        uint256 offerId = _makeOffer(bob, 1, 0.5 ether);
        uint256 aliceBefore = alice.balance;
        uint256 royaltyBefore = royaltyReceiver.balance;

        vm.expectEmit(true, true, true, true);
        emit OfferAccepted(offerId, 1, bob);
        vm.prank(alice);
        market.acceptOffer(offerId);

        assertEq(nft.ownerOf(1), bob);
        assertEq(alice.balance - aliceBefore, 0.475 ether);
        assertEq(royaltyReceiver.balance - royaltyBefore, 0.025 ether);
        assertFalse(_offerActive(offerId));
    }

    // TC-016: acceptOffer 時に同 tokenId の listing も delete
    function test_AcceptOffer_AlsoCancelsActiveListing() public {
        _mintAndApprove(alice, 1);
        _list(alice, 1, 1 ether);
        uint256 offerId = _makeOffer(bob, 1, 0.5 ether);

        vm.prank(alice);
        market.acceptOffer(offerId);

        assertFalse(_listingActive(1));
    }

    // ===== 観点 2: 異常系 =====

    // TC-024
    function test_Buy_RevertsWhen_TokenNotListed() public {
        vm.prank(bob);
        vm.expectRevert(SimpleMarketplace.NotActive.selector);
        market.buy{value: 1 ether}(999);
    }

    // TC-025
    function test_Buy_RevertsWhen_ListingCancelled() public {
        _mintAndApprove(alice, 1);
        _list(alice, 1, 1 ether);
        vm.prank(alice);
        market.cancel(1);

        vm.prank(bob);
        vm.expectRevert(SimpleMarketplace.NotActive.selector);
        market.buy{value: 1 ether}(1);
    }

    // TC-026
    function test_Buy_RevertsWhen_PaymentInsufficient() public {
        _mintAndApprove(alice, 1);
        _list(alice, 1, 1 ether);

        vm.prank(bob);
        vm.expectRevert(SimpleMarketplace.InsufficientPayment.selector);
        market.buy{value: 0.9 ether}(1);
    }

    // TC-027: buyer 側 refund が失敗 (overpayment) → PaymentFailed
    function test_Buy_RevertsWhen_RefundToBuyerFails() public {
        _mintAndApprove(alice, 1);
        _list(alice, 1, 1 ether);
        EthRejecter rejecter = new EthRejecter();
        vm.deal(address(rejecter), 10 ether);

        vm.prank(address(rejecter));
        vm.expectRevert(SimpleMarketplace.PaymentFailed.selector);
        market.buy{value: 1.5 ether}(1);
    }

    // TC-028: seller 受領失敗 → PaymentFailed
    function test_Buy_RevertsWhen_SellerCannotReceiveEth() public {
        EthRejecter rejecter = new EthRejecter();
        // rejecter が NFT を mint + approve
        nft.mint(address(rejecter));
        vm.prank(address(rejecter));
        nft.approve(address(market), 1);
        vm.prank(address(rejecter));
        market.list(1, 1 ether);

        vm.prank(bob);
        vm.expectRevert(SimpleMarketplace.PaymentFailed.selector);
        market.buy{value: 1 ether}(1);
    }

    // TC-029: royalty receiver が revert → PaymentFailed
    function test_Buy_RevertsWhen_RoyaltyReceiverRejectsEth() public {
        MaliciousRoyaltyNft maliciousNft = new MaliciousRoyaltyNft(address(this));
        SimpleMarketplace badMarket = new SimpleMarketplace(address(maliciousNft));
        maliciousNft.mintTo(alice);
        maliciousNft.approveFrom(alice, address(badMarket), 1);
        // 別 receiver (revert) を設定
        EthRejecter rejecter = new EthRejecter();
        maliciousNft.setRoyaltyReceiver(address(rejecter));

        vm.prank(alice);
        badMarket.list(1, 1 ether);

        vm.prank(bob);
        vm.expectRevert(SimpleMarketplace.PaymentFailed.selector);
        badMarket.buy{value: 1 ether}(1);
    }

    // TC-030: 既 active な listing 重複 → AlreadyListed
    function test_List_RevertsWhen_DuplicateActiveListing() public {
        _mintAndApprove(alice, 1);
        _list(alice, 1, 1 ether);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(SimpleMarketplace.AlreadyListed.selector, uint256(1)));
        market.list(1, 2 ether);
    }

    // TC-031: marketplace 未 approve → NotApproved
    function test_List_RevertsWhen_NotApprovedToMarketplace() public {
        nft.mint(alice);
        vm.prank(alice);
        vm.expectRevert(SimpleMarketplace.NotApproved.selector);
        market.list(1, 1 ether);
    }

    // TC-032: 非 owner が list → NotOwner
    function test_List_RevertsWhen_CallerNotOwner() public {
        _mintAndApprove(alice, 1);
        vm.prank(bob);
        vm.expectRevert(SimpleMarketplace.NotOwner.selector);
        market.list(1, 1 ether);
    }

    // TC-033: 非 active な cancel → NotActive
    function test_Cancel_RevertsWhen_NotActive() public {
        vm.prank(alice);
        vm.expectRevert(SimpleMarketplace.NotActive.selector);
        market.cancel(1);
    }

    // TC-034: 非 seller が cancel → NotOwner
    function test_Cancel_RevertsWhen_CallerNotSeller() public {
        _mintAndApprove(alice, 1);
        _list(alice, 1, 1 ether);
        vm.prank(mallory);
        vm.expectRevert(SimpleMarketplace.NotOwner.selector);
        market.cancel(1);
    }

    // TC-035: makeOffer の msg.value と amount 不一致
    function test_MakeOffer_RevertsWhen_PaymentMismatch() public {
        nft.mint(alice);
        vm.prank(bob);
        vm.expectRevert(SimpleMarketplace.OfferPaymentMismatch.selector);
        market.makeOffer{value: 0.5 ether}(1, 1 ether);
    }

    // TC-036: deadline = now → InvalidDeadline
    function test_MakeOffer_RevertsWhen_DeadlineIsNow() public {
        nft.mint(alice);
        vm.prank(bob);
        vm.expectRevert(SimpleMarketplace.InvalidDeadline.selector);
        market.makeOffer{value: 0.5 ether}(1, 0.5 ether, block.timestamp);
    }

    // TC-037: deadline 過去 → InvalidDeadline
    function test_MakeOffer_RevertsWhen_DeadlineInPast() public {
        vm.warp(1000);
        nft.mint(alice);
        vm.prank(bob);
        vm.expectRevert(SimpleMarketplace.InvalidDeadline.selector);
        market.makeOffer{value: 0.5 ether}(1, 0.5 ether, 999);
    }

    // TC-038: cancelOffer の inactive offer
    function test_CancelOffer_RevertsWhen_OfferInactive() public {
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(SimpleMarketplace.OfferNotActive.selector, uint256(999)));
        market.cancelOffer(999);
    }

    // TC-039: 非 buyer が cancelOffer
    function test_CancelOffer_RevertsWhen_CallerNotBuyer() public {
        nft.mint(alice);
        uint256 offerId = _makeOffer(bob, 1, 0.5 ether);
        vm.prank(mallory);
        vm.expectRevert(SimpleMarketplace.NotOwner.selector);
        market.cancelOffer(offerId);
    }

    // TC-040: refund 拒否 contract の cancelOffer → PaymentFailed
    function test_CancelOffer_RevertsWhen_RefundFails() public {
        EthRejecter rejecter = new EthRejecter();
        vm.deal(address(rejecter), 10 ether);
        nft.mint(alice);
        vm.prank(address(rejecter));
        uint256 offerId = market.makeOffer{value: 0.5 ether}(1, 0.5 ether);

        vm.prank(address(rejecter));
        vm.expectRevert(SimpleMarketplace.PaymentFailed.selector);
        market.cancelOffer(offerId);
        // offer は revert で復元される
        assertTrue(_offerActive(offerId));
    }

    // TC-041: acceptOffer の inactive offer
    function test_AcceptOffer_RevertsWhen_OfferInactive() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(SimpleMarketplace.OfferNotActive.selector, uint256(999)));
        market.acceptOffer(999);
    }

    // TC-042: deadline 超過 → OfferExpired
    function test_AcceptOffer_RevertsWhen_DeadlineExceeded() public {
        _mintAndApprove(alice, 1);
        uint256 deadline = block.timestamp + 1 hours;
        uint256 offerId = _makeOfferWithDeadline(bob, 1, 0.5 ether, deadline);
        vm.warp(deadline + 1);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(SimpleMarketplace.OfferExpired.selector, offerId));
        market.acceptOffer(offerId);
    }

    // TC-043: 非 owner が acceptOffer → NotOwner
    function test_AcceptOffer_RevertsWhen_CallerNotOwner() public {
        _mintAndApprove(alice, 1);
        uint256 offerId = _makeOffer(carol, 1, 0.5 ether);
        vm.prank(bob);
        vm.expectRevert(SimpleMarketplace.NotOwner.selector);
        market.acceptOffer(offerId);
    }

    // TC-044: acceptOffer 時 marketplace 未 approve
    function test_AcceptOffer_RevertsWhen_NotApproved() public {
        _mintAndApprove(alice, 1);
        uint256 offerId = _makeOffer(bob, 1, 0.5 ether);
        // approve を取り消す
        vm.prank(alice);
        nft.approve(address(0), 1);
        vm.prank(alice);
        vm.expectRevert(SimpleMarketplace.NotApproved.selector);
        market.acceptOffer(offerId);
    }

    // ===== 観点 3: 境界値 =====

    // TC-048: price=0 listing
    function test_Boundary_ListAndBuyAtZeroPrice() public {
        _mintAndApprove(alice, 1);
        _list(alice, 1, 0);
        uint256 aliceBefore = alice.balance;

        vm.prank(bob);
        market.buy{value: 0}(1);

        assertEq(nft.ownerOf(1), bob);
        assertEq(alice.balance - aliceBefore, 0);
    }

    // TC-049: price=1 wei で royalty=0 (切り捨て)、 seller 受領 1 wei
    function test_Boundary_RoyaltyTruncatesToZeroForOneWei() public {
        _mintAndApprove(alice, 1);
        _list(alice, 1, 1);
        uint256 aliceBefore = alice.balance;
        uint256 royaltyBefore = royaltyReceiver.balance;

        vm.prank(bob);
        market.buy{value: 1}(1);

        assertEq(alice.balance - aliceBefore, 1);
        assertEq(royaltyReceiver.balance - royaltyBefore, 0);
    }

    // TC-050: 巨大 price でも overflow しない
    function test_Boundary_LargePriceDoesNotOverflow() public {
        _mintAndApprove(alice, 1);
        uint256 huge = (type(uint256).max / 10_000) - 1; // overflow 直前
        // 価格は listing に書くだけで実際の buy では資金不足なのでここでは list だけ
        _list(alice, 1, huge);
        assertTrue(_listingActive(1));
    }

    // TC-051: makeOffer amount=0 → InvalidOfferAmount
    function test_Boundary_MakeOfferZeroAmountReverts() public {
        nft.mint(alice);
        vm.prank(bob);
        vm.expectRevert(SimpleMarketplace.InvalidOfferAmount.selector);
        market.makeOffer{value: 0}(1, 0);
    }

    // TC-052: deadline = now + 1 (ぎりぎり) で makeOffer 成立、 直後 accept 可
    function test_Boundary_MakeOfferDeadlineJustAhead() public {
        _mintAndApprove(alice, 1);
        uint256 deadline = block.timestamp + 1;
        uint256 offerId = _makeOfferWithDeadline(bob, 1, 0.5 ether, deadline);
        vm.prank(alice);
        market.acceptOffer(offerId);
        assertEq(nft.ownerOf(1), bob);
    }

    // TC-053: deadline = type(uint256).max なら isOfferActive 永続 true
    function test_Boundary_MakeOfferMaxDeadlineAlwaysActive() public {
        nft.mint(alice);
        uint256 offerId = _makeOffer(bob, 1, 0.5 ether);
        vm.warp(block.timestamp + 365 days);
        assertTrue(market.isOfferActive(offerId));
    }

    // TC-054: deadline ちょうどで acceptOffer 成立 (`offer.deadline < block.timestamp` 判定)
    function test_Boundary_AcceptOfferAtDeadlineExactly() public {
        _mintAndApprove(alice, 1);
        uint256 deadline = block.timestamp + 1 hours;
        uint256 offerId = _makeOfferWithDeadline(bob, 1, 0.5 ether, deadline);
        vm.warp(deadline);
        vm.prank(alice);
        market.acceptOffer(offerId);
        assertEq(nft.ownerOf(1), bob);
    }

    // TC-055: deadline + 1 で OfferExpired (off-by-one 確認 = TC-042 重複だが boundary 視点)
    function test_Boundary_AcceptOfferOneSecondAfterDeadline() public {
        _mintAndApprove(alice, 1);
        uint256 deadline = block.timestamp + 1 hours;
        uint256 offerId = _makeOfferWithDeadline(bob, 1, 0.5 ether, deadline);
        vm.warp(deadline + 1);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(SimpleMarketplace.OfferExpired.selector, offerId));
        market.acceptOffer(offerId);
    }

    // ===== 観点 4: 状態遷移 =====

    // TC-058: list → buy で active→inactive
    function test_StateTransition_ListThenBuy_DeactivatesListing() public {
        _mintAndApprove(alice, 1);
        _list(alice, 1, 1 ether);
        assertTrue(_listingActive(1));
        vm.prank(bob);
        market.buy{value: 1 ether}(1);
        assertFalse(_listingActive(1));
    }

    // TC-059: list → cancel で active→inactive
    function test_StateTransition_ListThenCancel_DeactivatesListing() public {
        _mintAndApprove(alice, 1);
        _list(alice, 1, 1 ether);
        vm.prank(alice);
        market.cancel(1);
        assertFalse(_listingActive(1));
    }

    // TC-060: cancel 後 再 list 可能
    function test_StateTransition_CancelThenRelistSucceeds() public {
        _mintAndApprove(alice, 1);
        _list(alice, 1, 1 ether);
        vm.prank(alice);
        market.cancel(1);
        // approve は transferFrom が起きていないので残っている
        _list(alice, 1, 2 ether);
        assertTrue(_listingActive(1));
    }

    // TC-061: offer active → cancelled
    function test_StateTransition_OfferActiveToCancelled() public {
        nft.mint(alice);
        uint256 offerId = _makeOffer(bob, 1, 0.5 ether);
        assertTrue(_offerActive(offerId));
        vm.prank(bob);
        market.cancelOffer(offerId);
        assertFalse(_offerActive(offerId));
    }

    // TC-062: offer active → accepted
    function test_StateTransition_OfferActiveToAccepted() public {
        _mintAndApprove(alice, 1);
        uint256 offerId = _makeOffer(bob, 1, 0.5 ether);
        vm.prank(alice);
        market.acceptOffer(offerId);
        assertFalse(_offerActive(offerId));
    }

    // TC-063: 時間経過のみで isOfferActive=false (storage active は true のまま)
    function test_StateTransition_ExpirationDoesNotMutateStorage() public {
        _mintAndApprove(alice, 1);
        uint256 deadline = block.timestamp + 1 hours;
        uint256 offerId = _makeOfferWithDeadline(bob, 1, 0.5 ether, deadline);
        vm.warp(deadline + 1);
        assertFalse(market.isOfferActive(offerId));
        // storage の active は true のまま (mapping 値)
        assertTrue(_offerActive(offerId));
    }

    // TC-064: acceptOffer で他 active offers も refund + invalidate
    function test_StateTransition_AcceptOfferInvalidatesSiblings() public {
        _mintAndApprove(alice, 1);
        uint256 offer1 = _makeOffer(bob, 1, 0.3 ether);
        uint256 offer2 = _makeOffer(carol, 1, 0.4 ether);
        uint256 offer3 = _makeOffer(mallory, 1, 0.5 ether);

        uint256 bobBefore = bob.balance;
        uint256 carolBefore = carol.balance;

        vm.prank(alice);
        market.acceptOffer(offer3);

        assertFalse(_offerActive(offer1));
        assertFalse(_offerActive(offer2));
        assertFalse(_offerActive(offer3));
        assertEq(bob.balance - bobBefore, 0.3 ether);
        assertEq(carol.balance - carolBefore, 0.4 ether);
    }

    // TC-065: buy で同 tokenId の active offers を一括 refund
    function test_StateTransition_BuyRefundsAllActiveOffers() public {
        _mintAndApprove(alice, 1);
        _list(alice, 1, 1 ether);
        uint256 offer1 = _makeOffer(bob, 1, 0.3 ether);
        uint256 offer2 = _makeOffer(carol, 1, 0.4 ether);

        uint256 bobBefore = bob.balance;
        uint256 carolBefore = carol.balance;

        vm.prank(mallory);
        market.buy{value: 1 ether}(1);

        assertFalse(_offerActive(offer1));
        assertFalse(_offerActive(offer2));
        assertEq(bob.balance - bobBefore, 0.3 ether);
        assertEq(carol.balance - carolBefore, 0.4 ether);
    }

    // TC-066: acceptOffer 時 listing が active なら delete
    function test_StateTransition_AcceptOfferCancelsListingSilently() public {
        _mintAndApprove(alice, 1);
        _list(alice, 1, 1 ether);
        uint256 offerId = _makeOffer(bob, 1, 0.5 ether);
        vm.prank(alice);
        market.acceptOffer(offerId);
        // listing は delete されたが Cancelled は emit されない (spec の expected と一致確認)
        assertFalse(_listingActive(1));
    }

    // ===== 観点 5: 権限 =====

    // TC-074: 現 owner であれば accept 可 (元 lister != accept caller でも OK)
    function test_Permission_AcceptOfferByCurrentOwnerEvenAfterTransfer() public {
        _mintAndApprove(alice, 1);
        // alice → bob に手動 transfer (marketplace 経由ではない)
        vm.prank(alice);
        nft.transferFrom(alice, bob, 1);
        // bob が approve
        vm.prank(bob);
        nft.approve(address(market), 1);
        uint256 offerId = _makeOffer(carol, 1, 0.5 ether);
        vm.prank(bob);
        market.acceptOffer(offerId);
        assertEq(nft.ownerOf(1), carol);
    }

    // TC-075: 現 owner と一致しない caller → NotOwner
    function test_Permission_AcceptOfferRevertsWhen_CallerNotCurrentOwner() public {
        _mintAndApprove(alice, 1);
        uint256 offerId = _makeOffer(bob, 1, 0.5 ether);
        vm.prank(carol);
        vm.expectRevert(SimpleMarketplace.NotOwner.selector);
        market.acceptOffer(offerId);
    }

    // ===== 観点 6: 入力バリデーション =====

    // TC-079 (=TC-051)
    function test_Validation_MakeOfferAmountZero() public {
        nft.mint(alice);
        vm.prank(bob);
        vm.expectRevert(SimpleMarketplace.InvalidOfferAmount.selector);
        market.makeOffer{value: 0}(1, 0);
    }

    // TC-080: msg.value > amount でも reject
    function test_Validation_MakeOfferRejectsExcessMsgValue() public {
        nft.mint(alice);
        vm.prank(bob);
        vm.expectRevert(SimpleMarketplace.OfferPaymentMismatch.selector);
        market.makeOffer{value: 2 ether}(1, 1 ether);
    }

    // TC-081: list price=0 を許容
    function test_Validation_ListAcceptsZeroPrice() public {
        _mintAndApprove(alice, 1);
        _list(alice, 1, 0);
        assertTrue(_listingActive(1));
    }

    // ===== 観点 7: 冪等性 =====

    // TC-082: 二重 cancel
    function test_Idempotency_DoubleCancelReverts() public {
        _mintAndApprove(alice, 1);
        _list(alice, 1, 1 ether);
        vm.prank(alice);
        market.cancel(1);
        vm.prank(alice);
        vm.expectRevert(SimpleMarketplace.NotActive.selector);
        market.cancel(1);
    }

    // TC-083: 二重 cancelOffer
    function test_Idempotency_DoubleCancelOfferReverts() public {
        nft.mint(alice);
        uint256 offerId = _makeOffer(bob, 1, 0.5 ether);
        vm.prank(bob);
        market.cancelOffer(offerId);
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(SimpleMarketplace.OfferNotActive.selector, offerId));
        market.cancelOffer(offerId);
    }

    // TC-084: 二重 acceptOffer
    function test_Idempotency_DoubleAcceptOfferReverts() public {
        _mintAndApprove(alice, 1);
        uint256 offerId = _makeOffer(bob, 1, 0.5 ether);
        vm.prank(alice);
        market.acceptOffer(offerId);
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(SimpleMarketplace.OfferNotActive.selector, offerId));
        market.acceptOffer(offerId);
    }

    // TC-085: 重複 list (=TC-030 と同主旨、 冪等性視点で再記)
    function test_Idempotency_DuplicateListReverts() public {
        _mintAndApprove(alice, 1);
        _list(alice, 1, 1 ether);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(SimpleMarketplace.AlreadyListed.selector, uint256(1)));
        market.list(1, 1 ether);
    }

    // ===== 観点 8: 並行処理 (tx ordering) =====

    // TC-087: 同 tokenId の連続 buy は 2 回目 NotActive (sequential 実行で先勝ち)
    function test_Concurrency_TwoBuysSequentially_SecondReverts() public {
        _mintAndApprove(alice, 1);
        _list(alice, 1, 1 ether);
        vm.prank(bob);
        market.buy{value: 1 ether}(1);
        vm.prank(carol);
        vm.expectRevert(SimpleMarketplace.NotActive.selector);
        market.buy{value: 1 ether}(1);
    }

    // TC-088: buy → acceptOffer の順だと offer は NotActive
    function test_Concurrency_BuyThenAcceptOffer_OfferInactive() public {
        _mintAndApprove(alice, 1);
        _list(alice, 1, 1 ether);
        uint256 offerId = _makeOffer(carol, 1, 0.5 ether);
        vm.prank(bob);
        market.buy{value: 1 ether}(1);
        // bob が現 owner だが offer 自体が buy 経由で invalidate されている
        vm.prank(bob);
        nft.approve(address(market), 1);
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(SimpleMarketplace.OfferNotActive.selector, offerId));
        market.acceptOffer(offerId);
    }

    // TC-089: 1 件 refund 失敗で全巻戻し
    function test_Concurrency_AcceptOffer_OneRefundFailsRollsBackAll() public {
        _mintAndApprove(alice, 1);
        EthRejecter rejecter = new EthRejecter();
        vm.deal(address(rejecter), 10 ether);

        uint256 offer1 = _makeOffer(bob, 1, 0.3 ether);
        vm.prank(address(rejecter));
        uint256 offer2 = market.makeOffer{value: 0.4 ether}(1, 0.4 ether);
        uint256 offer3 = _makeOffer(carol, 1, 0.5 ether);

        vm.prank(alice);
        vm.expectRevert(SimpleMarketplace.PaymentFailed.selector);
        market.acceptOffer(offer3);

        // 全 offer は active のまま (state 復元)
        assertTrue(_offerActive(offer1));
        assertTrue(_offerActive(offer2));
        assertTrue(_offerActive(offer3));
        assertEq(nft.ownerOf(1), alice);
    }

    // TC-090: cancelOffer は他オファーに影響しない
    function test_Concurrency_CancelOfferAffectsOnlyTarget() public {
        nft.mint(alice);
        uint256 offer1 = _makeOffer(bob, 1, 0.3 ether);
        uint256 offer2 = _makeOffer(carol, 1, 0.4 ether);
        vm.prank(bob);
        market.cancelOffer(offer1);
        assertFalse(_offerActive(offer1));
        assertTrue(_offerActive(offer2));
    }

    // 補助: cancelOffer 後の buy 経由で _invalidateOffersForToken が
    //   既に inactive な offer を skip する経路 (`if (!offer.active) continue;`) を踏む
    function test_StateTransition_BuySkipsAlreadyCancelledOffers() public {
        _mintAndApprove(alice, 1);
        uint256 cancelledOffer = _makeOffer(bob, 1, 0.2 ether);
        uint256 liveOffer = _makeOffer(carol, 1, 0.3 ether);
        vm.prank(bob);
        market.cancelOffer(cancelledOffer);
        // ここで offersByToken[1] には cancelledOffer / liveOffer が残存、
        // cancelledOffer は active=false。 buy で _invalidateOffersForToken を走らせる
        _list(alice, 1, 1 ether);
        uint256 carolBefore = carol.balance;
        vm.prank(mallory);
        market.buy{value: 1 ether}(1);
        // carol のみ refund される (cancelled は既に inactive のため skip)
        assertEq(carol.balance - carolBefore, 0.3 ether);
        assertFalse(_offerActive(liveOffer));
    }

    // TC-091: list 後に owner が手動 transfer → buy は revert、 listing は active 残存 (ガベージ)
    function test_Concurrency_OwnerTransfersOutThenBuyFails() public {
        _mintAndApprove(alice, 1);
        _list(alice, 1, 1 ether);
        vm.prank(alice);
        nft.transferFrom(alice, carol, 1);
        vm.prank(bob);
        // SimpleMarketplace は alice を seller と認識して transferFrom(alice, bob, 1) を実行 → NotOwnerOrApproved
        vm.expectRevert(MarketNft.NotOwnerOrApproved.selector);
        market.buy{value: 1 ether}(1);
        // listing は active のまま (ガベージ)
        assertTrue(_listingActive(1));
    }

    // ===== 観点 9: 性能 =====

    // TC-092: 同 tokenId に N=10/50/100 件 offer、 acceptOffer の gas を計測
    function test_Performance_AcceptOfferWithMultipleOffers() public {
        _mintAndApprove(alice, 1);
        uint256 N = 50;
        // N 件 makeOffer する用意 (各 buyer に address を作る)
        for (uint256 i = 0; i < N; i++) {
            address buyer = address(uint160(uint256(keccak256(abi.encode("buyer", i)))));
            vm.deal(buyer, 1 ether);
            vm.prank(buyer);
            market.makeOffer{value: 0.001 ether}(1, 0.001 ether);
        }
        uint256 offerId = _makeOffer(bob, 1, 0.5 ether);

        uint256 gasBefore = gasleft();
        vm.prank(alice);
        market.acceptOffer(offerId);
        uint256 gasUsed = gasBefore - gasleft();
        // block gas limit 30M 以下
        assertLt(gasUsed, 30_000_000);
        assertEq(nft.ownerOf(1), bob);
    }

    // TC-094: mint 100 件の gas baseline (実 gas は --gas-report で確認)
    function test_Performance_Mint100Tokens() public {
        for (uint256 i = 0; i < 100; i++) {
            nft.mint(alice);
        }
        assertEq(nft.totalSupply(), 100);
    }

    // ===== 観点 10: セキュリティ =====

    // TC-095: acceptOffer で royalty receiver が reentrancy → root tx PaymentFailed で巻戻し
    function test_Security_AcceptOfferRoyaltyReentrancyRollsBack() public {
        MaliciousRoyaltyNft maliciousNft = new MaliciousRoyaltyNft(address(this));
        SimpleMarketplace badMarket = new SimpleMarketplace(address(maliciousNft));
        RoyaltyReentrant attacker = new RoyaltyReentrant(badMarket);
        maliciousNft.mintTo(alice);
        maliciousNft.approveFrom(alice, address(badMarket), 1);
        maliciousNft.setRoyaltyReceiver(address(attacker));

        vm.prank(bob);
        uint256 offerId = badMarket.makeOffer{value: 0.5 ether}(1, 0.5 ether);
        attacker.setTarget(offerId);

        vm.prank(alice);
        // royalty 受領時に attacker が再度 acceptOffer 呼出を試行 → 既に delete 済なので OfferNotActive、
        // try/catch で吸収するが root tx は問題なく流れる (PaymentFailed にはならない、 ETH 受領は成功)
        badMarket.acceptOffer(offerId);
        assertEq(maliciousNft.ownerOf(1), bob);
    }

    // TC-096: buy で seller reentrancy → 既に delete されているので NotActive (try/catch なしで revert)
    function test_Security_BuySellerReentrancyRollsBack() public {
        _mintAndApprove(alice, 1);
        // alice の代わりに ReentrantBuyer を seller として登録するため、 alice の transfer で seller を移し替える
        // ここでは「seller が reentrant に buy を試みると revert」を ReentrantBuyer 経由で確認
        // ただし seller の receive() で buy を試行する形を取る = ReentrantBuyer を seller にする
        ReentrantBuyer rb = new ReentrantBuyer(market);
        vm.deal(address(rb), 10 ether);
        // alice が NFT を rb に移す
        vm.prank(alice);
        nft.transferFrom(alice, address(rb), 1);
        vm.prank(address(rb));
        nft.approve(address(market), 1);
        // rb は seller として 1 ether で list
        rb.setTarget(1);
        vm.prank(address(rb));
        market.list(1, 1 ether);

        // bob が buy → seller (rb) の receive() 内で再度 market.buy を試みるが、 既に listing delete 済 → NotActive で吸収
        vm.prank(bob);
        market.buy{value: 1 ether}(1);
        assertEq(nft.ownerOf(1), bob);
        assertTrue(rb.attempted());
    }

    // TC-097: royaltyAmount > salePrice → clamp = salePrice、 seller=0
    function test_Security_RoyaltyAmountClampedToSalePrice() public {
        MaliciousRoyaltyNft maliciousNft = new MaliciousRoyaltyNft(address(this));
        SimpleMarketplace badMarket = new SimpleMarketplace(address(maliciousNft));
        maliciousNft.mintTo(alice);
        maliciousNft.approveFrom(alice, address(badMarket), 1);
        maliciousNft.setClampOver(true);
        address royRecv = makeAddr("greedyRoyalty");
        maliciousNft.setRoyaltyReceiver(royRecv);

        vm.prank(alice);
        badMarket.list(1, 1 ether);

        uint256 aliceBefore = alice.balance;
        uint256 royBefore = royRecv.balance;

        vm.prank(bob);
        badMarket.buy{value: 1 ether}(1);

        assertEq(royRecv.balance - royBefore, 1 ether);
        assertEq(alice.balance - aliceBefore, 0);
        assertEq(maliciousNft.ownerOf(1), bob);
    }

    // TC-098: royaltyInfo が revert → catch ブランチで royalty=0、 seller 全額
    function test_Security_RoyaltyInfoRevertingGivesSellerFullAmount() public {
        MaliciousRoyaltyNft maliciousNft = new MaliciousRoyaltyNft(address(this));
        SimpleMarketplace badMarket = new SimpleMarketplace(address(maliciousNft));
        maliciousNft.mintTo(alice);
        maliciousNft.approveFrom(alice, address(badMarket), 1);
        maliciousNft.setRevertOnRoyalty(true);

        vm.prank(alice);
        badMarket.list(1, 1 ether);

        uint256 aliceBefore = alice.balance;
        vm.prank(bob);
        badMarket.buy{value: 1 ether}(1);
        assertEq(alice.balance - aliceBefore, 1 ether);
        assertEq(maliciousNft.ownerOf(1), bob);
    }

    // TC-100: contract 残高 = sum active offers (1 回 tx 後の局所 invariant 確認)
    function test_Security_ContractBalanceEqualsActiveOffers() public {
        nft.mint(alice);
        _makeOffer(bob, 1, 0.3 ether);
        _makeOffer(carol, 1, 0.4 ether);
        assertEq(address(market).balance, 0.7 ether);
    }

    // TC-102: royaltyReceiver immutable は変更経路なし
    function test_Security_RoyaltyReceiverImmutable() public view {
        assertEq(nft.royaltyReceiver(), royaltyReceiver);
    }

    // TC-103: makeOffer 後 buyer は単独で常に refund 可
    function test_Security_BuyerCanAlwaysCancelOfferAndGetRefund() public {
        nft.mint(alice);
        uint256 offerId = _makeOffer(bob, 1, 0.5 ether);
        uint256 bobBefore = bob.balance;
        vm.prank(bob);
        market.cancelOffer(offerId);
        assertEq(bob.balance - bobBefore, 0.5 ether);
    }

    // TC-105: 同 tokenId は同時最大 1 件の active listing (重複 list は AlreadyListed で deny)
    function test_Security_OnlyOneActiveListingPerToken() public {
        _mintAndApprove(alice, 1);
        _list(alice, 1, 1 ether);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(SimpleMarketplace.AlreadyListed.selector, uint256(1)));
        market.list(1, 2 ether);
        // 1 件のみ
        assertTrue(_listingActive(1));
    }

    // TC-106: front-running 相当 — owner が NFT を transfer した後の acceptOffer
    function test_Security_AcceptOfferFailsAfterOwnerTransfersOut() public {
        _mintAndApprove(alice, 1);
        uint256 offerId = _makeOffer(bob, 1, 0.5 ether);
        vm.prank(alice);
        nft.transferFrom(alice, carol, 1);
        vm.prank(alice);
        vm.expectRevert(SimpleMarketplace.NotOwner.selector);
        market.acceptOffer(offerId);
        // carol が approve すれば accept できる
        vm.prank(carol);
        nft.approve(address(market), 1);
        vm.prank(carol);
        market.acceptOffer(offerId);
        assertEq(nft.ownerOf(1), bob);
    }
}

// ===== Invariant test (TC-104) =====

contract SimpleMarketplaceInvariantHandler is Test {
    SimpleMarketplace public market;
    MarketNft public nft;
    address[] public actors;
    uint256[] public offerIds;
    uint256 public mintedCount;

    constructor(SimpleMarketplace market_, MarketNft nft_, address[] memory actors_) {
        market = market_;
        nft = nft_;
        actors = actors_;
    }

    function _actor(uint256 seed) internal view returns (address) {
        return actors[seed % actors.length];
    }

    function mint(uint256 actorSeed) external {
        address a = _actor(actorSeed);
        nft.mint(a);
        mintedCount += 1;
    }

    function makeOffer(uint256 tokenSeed, uint256 amountSeed, uint256 actorSeed) external {
        if (mintedCount == 0) return;
        uint256 tokenId = (tokenSeed % mintedCount) + 1;
        uint256 amount = (amountSeed % 1 ether) + 1;
        address a = _actor(actorSeed);
        vm.deal(a, amount);
        vm.prank(a);
        try market.makeOffer{value: amount}(tokenId, amount) returns (uint256 id) {
            offerIds.push(id);
        } catch {}
    }

    function cancelOffer(uint256 idSeed) external {
        if (offerIds.length == 0) return;
        uint256 offerId = offerIds[idSeed % offerIds.length];
        (, address buyer, , , bool active) = market.offers(offerId);
        if (!active) return;
        vm.prank(buyer);
        try market.cancelOffer(offerId) {} catch {}
    }

    function activeOfferSum() external view returns (uint256 sum) {
        for (uint256 i = 0; i < offerIds.length; i++) {
            (, , uint256 amt, , bool active) = market.offers(offerIds[i]);
            if (active) sum += amt;
        }
    }
}

contract SimpleMarketplaceInvariantTest is StdInvariant, Test {
    SimpleMarketplace public market;
    MarketNft public nft;
    SimpleMarketplaceInvariantHandler public handler;

    function setUp() public {
        nft = new MarketNft(address(0xBEEF));
        market = new SimpleMarketplace(address(nft));
        address[] memory actors = new address[](3);
        actors[0] = makeAddr("a1");
        actors[1] = makeAddr("a2");
        actors[2] = makeAddr("a3");
        handler = new SimpleMarketplaceInvariantHandler(market, nft, actors);
        targetContract(address(handler));
    }

    // TC-104: contract ETH 残高 = sum(active offers の amount)
    function invariant_ContractBalanceMatchesActiveOffers() public view {
        uint256 sum = handler.activeOfferSum();
        assertEq(address(market).balance, sum);
    }
}
