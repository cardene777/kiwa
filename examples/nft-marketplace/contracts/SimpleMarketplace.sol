// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IMarketNft {
    function ownerOf(uint256 tokenId) external view returns (address);
    function getApproved(uint256 tokenId) external view returns (address);
    function transferFrom(address from, address to, uint256 tokenId) external;
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        returns (address receiver, uint256 royaltyAmount);
}

contract SimpleMarketplace {
    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }

    struct Offer {
        uint256 tokenId;
        address buyer;
        uint256 amount;
        uint256 deadline;
        bool active;
    }

    IMarketNft public immutable nft;
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Offer) public offers;
    uint256 public nextOfferId;

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

    error NotOwner();
    error NotApproved();
    error NotActive();
    error InsufficientPayment();
    error PaymentFailed();
    error AlreadyListed(uint256 tokenId);
    error OfferNotActive(uint256 offerId);
    error OfferExpired(uint256 offerId);
    error InvalidOfferAmount();
    error InvalidDeadline();
    error OfferPaymentMismatch();

    constructor(address nftAddress) {
        nft = IMarketNft(nftAddress);
    }

    function list(uint256 tokenId, uint256 price) external {
        if (listings[tokenId].active) revert AlreadyListed(tokenId);
        if (nft.ownerOf(tokenId) != msg.sender) revert NotOwner();
        if (nft.getApproved(tokenId) != address(this)) revert NotApproved();
        listings[tokenId] = Listing({seller: msg.sender, price: price, active: true});
        emit Listed(tokenId, msg.sender, price);
    }

    function buy(uint256 tokenId) external payable {
        _buyListing(tokenId, msg.sender, msg.value);
    }

    function buyNft(uint256 tokenId) external payable {
        _buyListing(tokenId, msg.sender, msg.value);
    }

    function cancel(uint256 tokenId) external {
        Listing memory l = listings[tokenId];
        if (!l.active) revert NotActive();
        if (l.seller != msg.sender) revert NotOwner();
        delete listings[tokenId];
        emit Cancelled(tokenId);
    }

    function makeOffer(uint256 tokenId, uint256 amount) external payable returns (uint256 offerId) {
        offerId = _makeOffer(tokenId, amount, type(uint256).max);
    }

    function makeOffer(uint256 tokenId, uint256 amount, uint256 deadline)
        external
        payable
        returns (uint256 offerId)
    {
        offerId = _makeOffer(tokenId, amount, deadline);
    }

    function cancelOffer(uint256 offerId) external {
        Offer memory offer = offers[offerId];
        if (!offer.active) revert OfferNotActive(offerId);
        if (offer.buyer != msg.sender) revert NotOwner();
        delete offers[offerId];
        (bool ok, ) = offer.buyer.call{value: offer.amount}("");
        if (!ok) revert PaymentFailed();
        emit OfferCancelled(offerId);
    }

    function acceptOffer(uint256 offerId) external {
        Offer memory offer = offers[offerId];
        if (!offer.active) revert OfferNotActive(offerId);
        if (offer.deadline < block.timestamp) revert OfferExpired(offerId);
        if (nft.ownerOf(offer.tokenId) != msg.sender) revert NotOwner();
        if (nft.getApproved(offer.tokenId) != address(this)) revert NotApproved();

        delete offers[offerId];
        if (listings[offer.tokenId].active) {
            delete listings[offer.tokenId];
        }

        nft.transferFrom(msg.sender, offer.buyer, offer.tokenId);
        _payoutWithRoyalty(offer.tokenId, msg.sender, offer.amount);
        emit OfferAccepted(offerId, offer.tokenId, offer.buyer);
    }

    function isOfferActive(uint256 offerId) public view returns (bool) {
        Offer memory offer = offers[offerId];
        return offer.active && offer.deadline >= block.timestamp;
    }

    function _buyListing(uint256 tokenId, address buyer, uint256 payment) internal {
        Listing memory l = listings[tokenId];
        if (!l.active) revert NotActive();
        if (payment < l.price) revert InsufficientPayment();

        delete listings[tokenId];
        nft.transferFrom(l.seller, buyer, tokenId);
        _payoutWithRoyalty(tokenId, l.seller, l.price);

        if (payment > l.price) {
            (bool refund, ) = buyer.call{value: payment - l.price}("");
            if (!refund) revert PaymentFailed();
        }

        emit Bought(tokenId, buyer, l.price);
    }

    function _makeOffer(uint256 tokenId, uint256 amount, uint256 deadline)
        internal
        returns (uint256 offerId)
    {
        if (amount == 0) revert InvalidOfferAmount();
        if (msg.value != amount) revert OfferPaymentMismatch();
        if (deadline <= block.timestamp) revert InvalidDeadline();

        offerId = ++nextOfferId;
        offers[offerId] = Offer({
            tokenId: tokenId,
            buyer: msg.sender,
            amount: amount,
            deadline: deadline,
            active: true
        });
        emit OfferMade(offerId, tokenId, msg.sender, amount, deadline);
    }

    function _payoutWithRoyalty(uint256 tokenId, address seller, uint256 salePrice) internal {
        uint256 sellerProceeds = salePrice;

        try nft.royaltyInfo(tokenId, salePrice) returns (address receiver, uint256 royaltyAmount) {
            if (receiver != address(0) && royaltyAmount > 0) {
                if (royaltyAmount > salePrice) {
                    royaltyAmount = salePrice;
                }
                sellerProceeds = salePrice - royaltyAmount;
                (bool royaltyPaid, ) = receiver.call{value: royaltyAmount}("");
                if (!royaltyPaid) revert PaymentFailed();
            }
        } catch {}

        (bool ok, ) = seller.call{value: sellerProceeds}("");
        if (!ok) revert PaymentFailed();
    }
}
