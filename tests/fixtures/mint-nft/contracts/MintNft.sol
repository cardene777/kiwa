// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC2981 {
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        returns (address receiver, uint256 royaltyAmount);
}

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data)
        external
        returns (bytes4);
}

/// @notice Minimal ERC721 mint dApp for kiwa example
/// 標準準拠の ERC721 を OpenZeppelin に依存せず実装 (例として bytecode を小さく保つ)
contract MintNft is IERC2981 {
    bytes4 private constant INTERFACE_ID_ERC165 = 0x01ffc9a7;
    bytes4 private constant INTERFACE_ID_ERC721 = 0x80ac58cd;
    bytes4 private constant INTERFACE_ID_ERC721_ENUMERABLE = 0x780e9d63;
    bytes4 private constant INTERFACE_ID_ERC2981 = 0x2a55205a;

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
    error TokenIndexOutOfBounds();
    error UnsafeRecipient();

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
        if (count > MAX_SUPPLY - totalSupply) revert MaxSupplyReached(MAX_SUPPLY);

        tokenIds = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            tokenIds[i] = _mintNext(to);
        }
    }

    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256) {
        if (index >= _balances[owner]) revert OwnerIndexOutOfBounds();
        return _ownedTokens[owner][index];
    }

    function tokenByIndex(uint256 index) external view returns (uint256) {
        if (index >= totalSupply) revert TokenIndexOutOfBounds();
        return index + 1;
    }

    function transferFrom(address from, address to, uint256 tokenId) external {
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public {
        _transfer(from, to, tokenId);
        _checkOnERC721Received(from, to, tokenId, data);
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == INTERFACE_ID_ERC165 || interfaceId == INTERFACE_ID_ERC721
            || interfaceId == INTERFACE_ID_ERC721_ENUMERABLE || interfaceId == INTERFACE_ID_ERC2981;
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

    function _transfer(address from, address to, uint256 tokenId) internal {
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

    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory data)
        internal
    {
        if (to.code.length == 0) return;
        try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) returns (
            bytes4 retval
        ) {
            if (retval != IERC721Receiver.onERC721Received.selector) revert UnsafeRecipient();
        } catch {
            revert UnsafeRecipient();
        }
    }
}
