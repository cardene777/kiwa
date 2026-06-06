// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Minimal ERC721 mint dApp for kiwa example
/// 標準準拠の ERC721 を OpenZeppelin に依存せず実装 (例として bytecode を小さく保つ)
contract MintNft {
    string public name = "DappE2eNFT";
    string public symbol = "DE2E";
    uint256 public totalSupply;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    error NotOwner();
    error AlreadyMinted();
    error InvalidRecipient();

    function balanceOf(address owner) external view returns (uint256) {
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "ERC721: nonexistent");
        return owner;
    }

    function mint(address to) external returns (uint256 tokenId) {
        if (to == address(0)) revert InvalidRecipient();
        tokenId = totalSupply + 1;
        if (_owners[tokenId] != address(0)) revert AlreadyMinted();
        _owners[tokenId] = to;
        _balances[to] += 1;
        totalSupply = tokenId;
        emit Transfer(address(0), to, tokenId);
    }

    function transferFrom(address from, address to, uint256 tokenId) external {
        if (_owners[tokenId] != from) revert NotOwner();
        if (
            msg.sender != from &&
            _tokenApprovals[tokenId] != msg.sender &&
            !_operatorApprovals[from][msg.sender]
        ) revert NotOwner();
        if (to == address(0)) revert InvalidRecipient();
        delete _tokenApprovals[tokenId];
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;
        emit Transfer(from, to, tokenId);
    }

    function approve(address to, uint256 tokenId) external {
        address owner = _owners[tokenId];
        if (msg.sender != owner && !_operatorApprovals[owner][msg.sender]) revert NotOwner();
        _tokenApprovals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }

    function getApproved(uint256 tokenId) external view returns (address) {
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) external {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address owner, address operator) external view returns (bool) {
        return _operatorApprovals[owner][operator];
    }
}
