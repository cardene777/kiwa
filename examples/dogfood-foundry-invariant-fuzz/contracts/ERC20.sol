// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ERC20 (invariant-fuzz dogfood)
/// @notice Minimal ERC-20 with `transfer` / `approve` / `transferFrom`.
///         Kept purposefully simple — the invariant harness needs a stable
///         supply model with `sum(balances) == totalSupply` as the top-level
///         invariant. Not audited, not production-grade.
contract ERC20 {
    string public name;
    string public symbol;
    uint8 public constant DECIMALS = 18;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _name, string memory _symbol, uint256 initialSupply) {
        name = _name;
        symbol = _symbol;
        totalSupply = initialSupply;
        balanceOf[msg.sender] = initialSupply;
        emit Transfer(address(0), msg.sender, initialSupply);
    }

    /// @notice Mint tokens to `to`. Left permissionless so the invariant
    ///         harness can drive the supply from any actor without a
    ///         dedicated owner wallet.
    function mint(address to, uint256 amount) external {
        require(to != address(0), "mint: zero");
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function burn(address from, uint256 amount) external {
        require(balanceOf[from] >= amount, "burn: balance");
        balanceOf[from] -= amount;
        totalSupply -= amount;
        emit Transfer(from, address(0), amount);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "transfer: balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "transferFrom: balance");
        require(allowance[from][msg.sender] >= amount, "transferFrom: allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
