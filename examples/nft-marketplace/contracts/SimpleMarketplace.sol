// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IMarketNft {
    function ownerOf(uint256 tokenId) external view returns (address);
    function getApproved(uint256 tokenId) external view returns (address);
    function transferFrom(address from, address to, uint256 tokenId) external;
}

contract SimpleMarketplace {
    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }

    IMarketNft public immutable nft;
    mapping(uint256 => Listing) public listings;

    event Listed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event Bought(uint256 indexed tokenId, address indexed buyer, uint256 price);
    event Cancelled(uint256 indexed tokenId);

    error NotOwner();
    error NotApproved();
    error NotActive();
    error InsufficientPayment();
    error PaymentFailed();

    constructor(address nftAddress) {
        nft = IMarketNft(nftAddress);
    }

    function list(uint256 tokenId, uint256 price) external {
        if (nft.ownerOf(tokenId) != msg.sender) revert NotOwner();
        if (nft.getApproved(tokenId) != address(this)) revert NotApproved();
        listings[tokenId] = Listing({seller: msg.sender, price: price, active: true});
        emit Listed(tokenId, msg.sender, price);
    }

    function buy(uint256 tokenId) external payable {
        Listing memory l = listings[tokenId];
        if (!l.active) revert NotActive();
        if (msg.value < l.price) revert InsufficientPayment();
        delete listings[tokenId];
        nft.transferFrom(l.seller, msg.sender, tokenId);
        (bool ok, ) = l.seller.call{value: l.price}("");
        if (!ok) revert PaymentFailed();
        if (msg.value > l.price) {
            (bool refund, ) = msg.sender.call{value: msg.value - l.price}("");
            if (!refund) revert PaymentFailed();
        }
        emit Bought(tokenId, msg.sender, l.price);
    }

    function cancel(uint256 tokenId) external {
        Listing memory l = listings[tokenId];
        if (!l.active) revert NotActive();
        if (l.seller != msg.sender) revert NotOwner();
        delete listings[tokenId];
        emit Cancelled(tokenId);
    }
}
