// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice minimum ERC721、誰でも mint 可能
contract GateNFT {
    string public constant name = "GateNFT";
    string public constant symbol = "GATE";

    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;
    uint256 public totalSupply;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    function mint() external returns (uint256 tokenId) {
        tokenId = totalSupply + 1;
        ownerOf[tokenId] = msg.sender;
        balanceOf[msg.sender] += 1;
        totalSupply = tokenId;
        emit Transfer(address(0), msg.sender, tokenId);
    }
}
