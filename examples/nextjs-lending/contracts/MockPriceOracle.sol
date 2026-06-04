// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockPriceOracle {
    mapping(address => uint256) public price;

    event PriceUpdated(address indexed asset, uint256 price);

    error InvalidPrice();
    error PriceNotSet(address asset);

    function setPrice(address asset, uint256 newPrice) external {
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
