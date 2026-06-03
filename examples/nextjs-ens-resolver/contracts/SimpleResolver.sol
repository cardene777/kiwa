// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice ENS-like minimum resolver (forward + reverse 名前解決)
/// @dev    本来の ENS は Registry + Resolver の多段構造だが、本 example では 1 contract で完結
contract SimpleResolver {
    /// name → address (forward resolve)
    mapping(string => address) public forward;

    /// address → name (reverse lookup)
    mapping(address => string) public reverse;

    event RecordSet(string indexed nameHashIndexed, string name, address indexed addr);
    event ReverseSet(address indexed addr, string name);

    error EmptyName();
    error AlreadyRegistered();

    /// @notice name → address 登録 (caller が自分の name を登録する想定)
    /// @dev    name は ENS のような .eth サフィックス前提でなく任意の string
    function setRecord(string calldata name, address addr) external {
        if (bytes(name).length == 0) revert EmptyName();
        if (forward[name] != address(0)) revert AlreadyRegistered();
        forward[name] = addr;
        emit RecordSet(name, name, addr);
    }

    /// @notice forward resolve: name → address
    function resolve(string calldata name) external view returns (address) {
        return forward[name];
    }

    /// @notice address → name 登録 (caller 自身の reverse record を設定)
    function setReverse(string calldata name) external {
        if (bytes(name).length == 0) revert EmptyName();
        reverse[msg.sender] = name;
        emit ReverseSet(msg.sender, name);
    }

    /// @notice reverse lookup: address → name
    function reverseLookup(address addr) external view returns (string memory) {
        return reverse[addr];
    }
}
