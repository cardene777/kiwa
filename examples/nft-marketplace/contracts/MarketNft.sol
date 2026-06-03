// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MarketNft {
    string public name = "MarketNFT";
    string public symbol = "MKT";

    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;
    mapping(uint256 => address) public getApproved;
    uint256 public totalSupply;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);

    error NotOwnerOrApproved();
    error InvalidRecipient();

    function mint(address to) external returns (uint256 tokenId) {
        if (to == address(0)) revert InvalidRecipient();
        tokenId = totalSupply + 1;
        ownerOf[tokenId] = to;
        balanceOf[to] += 1;
        totalSupply = tokenId;
        emit Transfer(address(0), to, tokenId);
    }

    function approve(address to, uint256 tokenId) external {
        address owner = ownerOf[tokenId];
        if (msg.sender != owner) revert NotOwnerOrApproved();
        getApproved[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }

    function transferFrom(address from, address to, uint256 tokenId) external {
        if (ownerOf[tokenId] != from) revert NotOwnerOrApproved();
        if (msg.sender != from && getApproved[tokenId] != msg.sender) revert NotOwnerOrApproved();
        if (to == address(0)) revert InvalidRecipient();
        delete getApproved[tokenId];
        balanceOf[from] -= 1;
        balanceOf[to] += 1;
        ownerOf[tokenId] = to;
        emit Transfer(from, to, tokenId);
    }
}
