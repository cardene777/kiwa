// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Test-only oracle implementation for local example deployments.
contract MockPriceOracle {
    address public immutable owner;
    mapping(address => uint256) public price;

    event PriceUpdated(address indexed asset, uint256 price);

    error InvalidPrice();
    error PriceNotSet(address asset);
    error NotOwner();

    constructor() {
        owner = msg.sender;
    }

    function setPrice(address asset, uint256 newPrice) external {
        if (msg.sender != owner) revert NotOwner();
        if (newPrice == 0) revert InvalidPrice();
        price[asset] = newPrice;
        emit PriceUpdated(asset, newPrice);
    }

    function getPrice(address asset) external view returns (uint256) {
        uint256 currentPrice = price[asset];
        if (currentPrice == 0) revert PriceNotSet(asset);
        return currentPrice;
    }
}
