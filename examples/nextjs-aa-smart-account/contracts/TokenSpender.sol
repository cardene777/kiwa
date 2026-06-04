// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IMockToken {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract TokenSpender {
    event Pulled(address indexed token, address indexed from, address indexed to, uint256 amount);

    error TransferFailed();

    function pull(address token, address from, address to, uint256 amount) external {
        bool ok = IMockToken(token).transferFrom(from, to, amount);
        if (!ok) revert TransferFailed();

        emit Pulled(token, from, to, amount);
    }
}
