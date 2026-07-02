// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/DogfoodToken.sol";

contract DogfoodTokenTest is Test {
    DogfoodToken internal token;
    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);

    function setUp() public {
        token = new DogfoodToken(1_000_000e18);
        token.transfer(alice, 1_000e18);
    }

    function test_transferReducesBalance() public {
        vm.prank(alice);
        token.transfer(bob, 100e18);
        assertEq(token.balanceOf(alice), 900e18);
        assertEq(token.balanceOf(bob), 100e18);
    }

    function test_transferFromRespectsAllowance() public {
        vm.prank(alice);
        token.approve(bob, 500e18);
        vm.prank(bob);
        token.transferFrom(alice, bob, 400e18);
        assertEq(token.balanceOf(alice), 600e18);
        assertEq(token.balanceOf(bob), 400e18);
    }

    function test_transferRevertsOnInsufficientBalance() public {
        vm.prank(alice);
        vm.expectRevert(bytes("balance"));
        token.transfer(bob, 10_000e18);
    }
}
