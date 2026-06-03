// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Minimal ERC20 + delegate (Compound 風 simplified voting power)
contract VoteToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => address) public delegates;
    mapping(address => uint256) public votes;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event DelegateChanged(
        address indexed delegator,
        address indexed fromDelegate,
        address indexed toDelegate
    );
    event DelegateVotesChanged(address indexed delegate, uint256 previous, uint256 current);

    constructor(string memory n, string memory s, uint256 initialSupply, address recipient) {
        name = n;
        symbol = s;
        totalSupply = initialSupply;
        balanceOf[recipient] = initialSupply;
        emit Transfer(address(0), recipient, initialSupply);
    }

    /// @notice 自分自身または別 address に投票権を委任
    function delegate(address to) external {
        address current = delegates[msg.sender];
        delegates[msg.sender] = to;
        emit DelegateChanged(msg.sender, current, to);

        uint256 amount = balanceOf[msg.sender];
        if (current != address(0)) {
            uint256 prev = votes[current];
            votes[current] = prev - amount;
            emit DelegateVotesChanged(current, prev, votes[current]);
        }
        if (to != address(0)) {
            uint256 prev = votes[to];
            votes[to] = prev + amount;
            emit DelegateVotesChanged(to, prev, votes[to]);
        }
    }

    function getVotes(address account) external view returns (uint256) {
        return votes[account];
    }

    function transfer(address to, uint256 value) external returns (bool) {
        require(balanceOf[msg.sender] >= value, "insufficient");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        // delegate 先の votes も移動
        address fromDel = delegates[msg.sender];
        address toDel = delegates[to];
        if (fromDel != address(0)) votes[fromDel] -= value;
        if (toDel != address(0)) votes[toDel] += value;
        return true;
    }
}
