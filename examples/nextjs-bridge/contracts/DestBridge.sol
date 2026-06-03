// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IDestToken {
    function mint(address to, uint256 value) external;
    function burn(address from, uint256 value) external;
    function balanceOf(address owner) external view returns (uint256);
}

/// @notice dest chain (L2 sim) で operator が mint、ユーザーが burn で round-trip
contract DestBridge {
    IDestToken public immutable destToken;
    address public immutable operator;
    uint256 public mintNonce;
    uint256 public burnNonce;

    event Minted(uint256 indexed l1Nonce, address indexed to, uint256 amount);
    event Burned(uint256 indexed nonce, address indexed from, address indexed l1Recipient, uint256 amount);

    error NotOperator();

    constructor(address token, address op) {
        destToken = IDestToken(token);
        operator = op;
    }

    function relayMint(uint256 l1Nonce, address to, uint256 amount) external {
        if (msg.sender != operator) revert NotOperator();
        destToken.mint(to, amount);
        mintNonce++;
        emit Minted(l1Nonce, to, amount);
    }

    function bridgeBurn(uint256 amount, address l1Recipient) external returns (uint256 currentNonce) {
        destToken.burn(msg.sender, amount);
        currentNonce = burnNonce++;
        emit Burned(currentNonce, msg.sender, l1Recipient, amount);
    }
}
