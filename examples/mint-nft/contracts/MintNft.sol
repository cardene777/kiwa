// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC2981 {
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        returns (address receiver, uint256 royaltyAmount);
}

/// @notice Minimal ERC721 mint dApp for dapp-e2e example
/// 標準準拠の ERC721 を OpenZeppelin に依存せず実装 (例として bytecode を小さく保つ)
contract MintNft is IERC2981 {
    string public name = "DappE2eNFT";
    string public symbol = "DE2E";
    uint256 public constant MAX_SUPPLY = 10;
    uint96 public constant ROYALTY_BPS = 500;
    uint256 public totalSupply;
    address public immutable royaltyReceiver;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    mapping(address => mapping(uint256 => uint256)) private _ownedTokens;
    mapping(uint256 => uint256) private _ownedTokensIndex;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    error NotOwner();
    error AlreadyMinted();
    error InvalidRecipient();
    error MaxSupplyReached(uint256 maxSupply);
    error OwnerIndexOutOfBounds();

    constructor() {
        royaltyReceiver = msg.sender;
    }

    function balanceOf(address owner) external view returns (uint256) {
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "ERC721: nonexistent");
        return owner;
    }

    function mint(address to) external returns (uint256 tokenId) {
        tokenId = _mintNext(to);
    }

    function batchMint(address to, uint256 count) external returns (uint256[] memory tokenIds) {
        if (to == address(0)) revert InvalidRecipient();
        if (totalSupply + count > MAX_SUPPLY) revert MaxSupplyReached(MAX_SUPPLY);

        tokenIds = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            tokenIds[i] = _mintNext(to);
        }
    }

    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256) {
        if (index >= _balances[owner]) revert OwnerIndexOutOfBounds();
        return _ownedTokens[owner][index];
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
        _removeTokenFromOwnerEnumeration(from, tokenId);
        _balances[from] -= 1;
        _addTokenToOwnerEnumeration(to, tokenId);
        _balances[to] += 1;
        _owners[tokenId] = to;
        emit Transfer(from, to, tokenId);
    }

    function royaltyInfo(uint256, uint256 salePrice)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        receiver = royaltyReceiver;
        royaltyAmount = (salePrice * ROYALTY_BPS) / 10_000;
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

    function _mintNext(address to) internal returns (uint256 tokenId) {
        if (to == address(0)) revert InvalidRecipient();
        tokenId = totalSupply + 1;
        if (tokenId > MAX_SUPPLY) revert MaxSupplyReached(MAX_SUPPLY);
        if (_owners[tokenId] != address(0)) revert AlreadyMinted();
        _owners[tokenId] = to;
        _addTokenToOwnerEnumeration(to, tokenId);
        _balances[to] += 1;
        totalSupply = tokenId;
        emit Transfer(address(0), to, tokenId);
    }

    function _addTokenToOwnerEnumeration(address to, uint256 tokenId) internal {
        uint256 length = _balances[to];
        _ownedTokens[to][length] = tokenId;
        _ownedTokensIndex[tokenId] = length;
    }

    function _removeTokenFromOwnerEnumeration(address from, uint256 tokenId) internal {
        uint256 lastTokenIndex = _balances[from] - 1;
        uint256 tokenIndex = _ownedTokensIndex[tokenId];

        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _ownedTokens[from][lastTokenIndex];
            _ownedTokens[from][tokenIndex] = lastTokenId;
            _ownedTokensIndex[lastTokenId] = tokenIndex;
        }

        delete _ownedTokensIndex[tokenId];
        delete _ownedTokens[from][lastTokenIndex];
    }
}
