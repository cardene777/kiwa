// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice dest chain で発行される token (operator 権限で mint / burn 可能)
contract DestToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    address public immutable operator;

    mapping(address => uint256) public balanceOf;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Mint(address indexed to, uint256 value);
    event Burn(address indexed from, uint256 value);

    error NotOperator();
    error InsufficientBalance();

    constructor(string memory n, string memory s, address op) {
        name = n;
        symbol = s;
        operator = op;
    }

    function mint(address to, uint256 value) external {
        if (msg.sender != operator) revert NotOperator();
        balanceOf[to] += value;
        totalSupply += value;
        emit Mint(to, value);
        emit Transfer(address(0), to, value);
    }

    function burn(address from, uint256 value) external {
        if (msg.sender != operator) revert NotOperator();
        if (balanceOf[from] < value) revert InsufficientBalance();
        balanceOf[from] -= value;
        totalSupply -= value;
        emit Burn(from, value);
        emit Transfer(from, address(0), value);
    }

    function transfer(address to, uint256 value) external returns (bool) {
        if (balanceOf[msg.sender] < value) revert InsufficientBalance();
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
}
