// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {MarketNft, IERC721Receiver} from "../../contracts/MarketNft.sol";
import {SimpleMarketplace} from "../../contracts/SimpleMarketplace.sol";

contract GoodReceiver is IERC721Receiver {
    bytes public lastData;
    address public lastOperator;
    address public lastFrom;
    uint256 public lastTokenId;
    uint256 public callCount;

    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data)
        external
        returns (bytes4)
    {
        lastOperator = operator;
        lastFrom = from;
        lastTokenId = tokenId;
        lastData = data;
        callCount += 1;
        return IERC721Receiver.onERC721Received.selector;
    }
}

contract WrongSelectorReceiver is IERC721Receiver {
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return 0xdeadbeef;
    }
}

contract RevertingReceiver is IERC721Receiver {
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        revert("nope");
    }
}

contract ReentrantReceiver is IERC721Receiver {
    MarketNft public nft;
    address public target;
    bool public attempted;
    bool public reentrantSucceeded;

    constructor(MarketNft nft_) {
        nft = nft_;
    }

    function setTarget(address t) external {
        target = t;
    }

    function onERC721Received(address, address, uint256 tokenId, bytes calldata) external returns (bytes4) {
        attempted = true;
        if (target != address(0)) {
            try nft.transferFrom(address(this), target, tokenId) {
                reentrantSucceeded = true;
            } catch {}
        }
        return IERC721Receiver.onERC721Received.selector;
    }
}

contract EthRejecter {
    fallback() external payable {
        revert("no eth");
    }
}

contract NoFallback {}

contract ReentrantBuyer {
    SimpleMarketplace public market;
    uint256 public targetTokenId;
    bool public attempted;

    constructor(SimpleMarketplace market_) {
        market = market_;
    }

    function setTarget(uint256 tokenId) external {
        targetTokenId = tokenId;
    }

    function buy(uint256 tokenId) external payable {
        market.buy{value: msg.value}(tokenId);
    }

    receive() external payable {
        if (!attempted && targetTokenId != 0) {
            attempted = true;
            try market.buy{value: msg.value}(targetTokenId) {} catch {}
        }
    }
}

contract ReentrantSeller {
    SimpleMarketplace public market;
    bool public attempted;

    constructor(SimpleMarketplace market_) {
        market = market_;
    }

    function list(uint256 tokenId, uint256 price) external {
        market.list(tokenId, price);
    }

    function approve(address nftAddr, address operator, uint256 tokenId) external {
        MarketNft(nftAddr).approve(operator, tokenId);
    }

    function transferTo(address nftAddr, address to, uint256 tokenId) external {
        MarketNft(nftAddr).transferFrom(address(this), to, tokenId);
    }

    receive() external payable {
        if (!attempted) {
            attempted = true;
            try market.buy{value: msg.value}(0) {} catch {}
        }
    }
}

contract MaliciousRoyaltyNft {
    address public royaltyReceiver;
    bool public revertOnRoyalty;
    bool public clampOver;
    bool public revertOnReceive;

    mapping(uint256 => address) public ownerOf;
    mapping(uint256 => address) public getApproved;
    uint256 public nextId;

    constructor(address receiver_) {
        royaltyReceiver = receiver_;
    }

    function setRevertOnRoyalty(bool v) external {
        revertOnRoyalty = v;
    }

    function setClampOver(bool v) external {
        clampOver = v;
    }

    function setRevertOnReceive(bool v) external {
        revertOnReceive = v;
    }

    function setRoyaltyReceiver(address r) external {
        royaltyReceiver = r;
    }

    function mintTo(address to) external returns (uint256 id) {
        id = ++nextId;
        ownerOf[id] = to;
    }

    function approveFrom(address from, address to, uint256 tokenId) external {
        require(ownerOf[tokenId] == from, "not owner");
        getApproved[tokenId] = to;
    }

    function transferFrom(address from, address to, uint256 tokenId) external {
        require(ownerOf[tokenId] == from, "owner mismatch");
        require(msg.sender == from || msg.sender == getApproved[tokenId], "not approved");
        delete getApproved[tokenId];
        ownerOf[tokenId] = to;
    }

    function royaltyInfo(uint256, uint256 salePrice) external view returns (address receiver, uint256 royaltyAmount) {
        if (revertOnRoyalty) revert("royalty boom");
        receiver = royaltyReceiver;
        royaltyAmount = clampOver ? salePrice + 1 : (salePrice * 500) / 10_000;
    }

    receive() external payable {
        if (revertOnReceive) revert("nope");
    }
}

contract RoyaltyReentrant {
    SimpleMarketplace public market;
    uint256 public targetOfferId;
    bool public attempted;

    constructor(SimpleMarketplace market_) {
        market = market_;
    }

    function setTarget(uint256 offerId) external {
        targetOfferId = offerId;
    }

    receive() external payable {
        if (!attempted && targetOfferId != 0) {
            attempted = true;
            try market.acceptOffer(targetOfferId) {} catch {}
        }
    }
}

