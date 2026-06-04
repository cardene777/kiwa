// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Minimal ERC1155 game items contract for dapp-e2e example
/// 3 種 game item (Sword id=1 / Shield id=2 / Potion id=3) を 1 contract で管理
contract GameItems {
    string public constant name = "DappE2eGameItems";
    string public constant symbol = "DE2EGI";

    mapping(uint256 => mapping(address => uint256)) public balanceOf;
    mapping(uint256 => uint256) public totalSupply;
    mapping(address => mapping(address => bool)) public isApprovedForAll;

    event TransferSingle(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256 id,
        uint256 value
    );
    event TransferBatch(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256[] ids,
        uint256[] values
    );
    event ApprovalForAll(address indexed account, address indexed operator, bool approved);

    error NotAuthorized();
    error LengthMismatch();
    error InsufficientBalance();
    error InvalidRecipient();

    function mint(address to, uint256 id, uint256 amount) external {
        if (to == address(0)) revert InvalidRecipient();
        balanceOf[id][to] += amount;
        totalSupply[id] += amount;
        emit TransferSingle(msg.sender, address(0), to, id, amount);
    }

    function mintBatch(address to, uint256[] calldata ids, uint256[] calldata amounts) external {
        if (to == address(0)) revert InvalidRecipient();
        if (ids.length != amounts.length) revert LengthMismatch();
        for (uint256 i = 0; i < ids.length; i++) {
            balanceOf[ids[i]][to] += amounts[i];
            totalSupply[ids[i]] += amounts[i];
        }
        emit TransferBatch(msg.sender, address(0), to, ids, amounts);
    }

    function balanceOfBatch(address[] calldata owners, uint256[] calldata ids)
        external
        view
        returns (uint256[] memory result)
    {
        if (owners.length != ids.length) revert LengthMismatch();
        result = new uint256[](owners.length);
        for (uint256 i = 0; i < owners.length; i++) {
            result[i] = balanceOf[ids[i]][owners[i]];
        }
    }

    function setApprovalForAll(address operator, bool approved) external {
        isApprovedForAll[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function safeTransferFrom(address from, address to, uint256 id, uint256 amount) external {
        if (msg.sender != from && !isApprovedForAll[from][msg.sender]) revert NotAuthorized();
        if (to == address(0)) revert InvalidRecipient();
        if (balanceOf[id][from] < amount) revert InsufficientBalance();
        balanceOf[id][from] -= amount;
        balanceOf[id][to] += amount;
        emit TransferSingle(msg.sender, from, to, id, amount);
    }

    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts
    ) external {
        if (msg.sender != from && !isApprovedForAll[from][msg.sender]) revert NotAuthorized();
        if (to == address(0)) revert InvalidRecipient();
        if (ids.length != amounts.length) revert LengthMismatch();
        for (uint256 i = 0; i < ids.length; i++) {
            if (balanceOf[ids[i]][from] < amounts[i]) revert InsufficientBalance();
            balanceOf[ids[i]][from] -= amounts[i];
            balanceOf[ids[i]][to] += amounts[i];
        }
        emit TransferBatch(msg.sender, from, to, ids, amounts);
    }

    function burn(address account, uint256 id, uint256 amount) external {
        if (msg.sender != account && !isApprovedForAll[account][msg.sender]) revert NotAuthorized();
        if (balanceOf[id][account] < amount) revert InsufficientBalance();
        balanceOf[id][account] -= amount;
        totalSupply[id] -= amount;
        emit TransferSingle(msg.sender, account, address(0), id, amount);
    }
}
