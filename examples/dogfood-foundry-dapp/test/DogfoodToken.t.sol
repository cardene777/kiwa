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

    // ---- ここから下は `/kiwa-design --layer contract --module dogfood-token` が
    // 未覆と判定した 15 件 (TC-001 / 002 / 003 / 005 / 006 / 007 / 008 / 009 / 011 / 012 /
    // 013 / 015 / 016 / 017 / 018)。
    // spec = tests/spec/contract/test-spec-dogfood-token.ja.md
    //
    // 既存 3 件 (TC-004 / 010 / 014 に対応) は中身を読んで重複と判断したため書いていない。
    // 追記先を別 contract に分けないのは setUp が contract 単位で、 分けると前提を組み直すことに
    // なるため (`existing-test-reuse.md` § 3)。

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function test_TC001_constructorSetsTotalSupply() public {
        DogfoodToken fresh = new DogfoodToken(1_000_000e18);
        assertEq(fresh.totalSupply(), 1_000_000e18);
    }

    function test_TC002_constructorGivesSupplyToDeployer() public {
        DogfoodToken fresh = new DogfoodToken(1_000_000e18);
        assertEq(fresh.balanceOf(address(this)), 1_000_000e18);
    }

    function test_TC003_constructorEmitsTransferEvent() public {
        address freshAddress = vm.computeCreateAddress(address(this), vm.getNonce(address(this)));
        vm.expectEmit(true, true, false, true, freshAddress);
        emit Transfer(address(0), address(this), 1_000_000e18);
        new DogfoodToken(1_000_000e18);
    }

    function test_TC005_transferEmitsTransferEvent() public {
        vm.expectEmit(true, true, false, true, address(token));
        emit Transfer(alice, bob, 100e18);
        vm.prank(alice);
        token.transfer(bob, 100e18);
    }

    function test_TC006_transferReturnsTrue() public {
        vm.prank(alice);
        assertTrue(token.transfer(bob, 100e18));
    }

    function test_TC007_approveSetsAllowance() public {
        vm.prank(alice);
        token.approve(bob, 500e18);
        assertEq(token.allowance(alice, bob), 500e18);
    }

    function test_TC008_approveEmitsApprovalEvent() public {
        vm.expectEmit(true, true, false, true, address(token));
        emit Approval(alice, bob, 500e18);
        vm.prank(alice);
        token.approve(bob, 500e18);
    }

    function test_TC009_approveReturnsTrue() public {
        vm.prank(alice);
        assertTrue(token.approve(bob, 500e18));
    }

    // 既存 `test_transferFromRespectsAllowance` は名前に allowance を含むが、 assertion は
    // balance 2 件だけで allowance を 1 度も読んでいない。 名前で判定していたら既覆に倒れていた。
    function test_TC011_transferFromReducesAllowance() public {
        vm.prank(alice);
        token.approve(bob, 500e18);
        vm.prank(bob);
        token.transferFrom(alice, bob, 400e18);
        assertEq(token.allowance(alice, bob), 100e18);
    }

    function test_TC012_transferFromEmitsTransferEvent() public {
        vm.prank(alice);
        token.approve(bob, 500e18);
        vm.expectEmit(true, true, false, true, address(token));
        emit Transfer(alice, bob, 400e18);
        vm.prank(bob);
        token.transferFrom(alice, bob, 400e18);
    }

    function test_TC013_transferFromReturnsTrue() public {
        vm.prank(alice);
        token.approve(bob, 500e18);
        vm.prank(bob);
        assertTrue(token.transferFrom(alice, bob, 400e18));
    }

    function test_TC015_transferFromRevertsOnInsufficientBalance() public {
        vm.prank(alice);
        token.approve(bob, 10_000e18);
        vm.prank(bob);
        vm.expectRevert(bytes("balance"));
        token.transferFrom(alice, bob, 5_000e18);
    }

    function test_TC016_transferFromRevertsOnInsufficientAllowance() public {
        vm.prank(alice);
        token.approve(bob, 100e18);
        vm.prank(bob);
        vm.expectRevert(bytes("allowance"));
        token.transferFrom(alice, bob, 200e18);
    }

    function test_TC017_transferAcceptsExactBalance() public {
        vm.prank(alice);
        token.transfer(bob, 1_000e18);
        assertEq(token.balanceOf(alice), 0);
    }

    function test_TC018_transferFromAcceptsExactAllowance() public {
        vm.prank(alice);
        token.approve(bob, 500e18);
        vm.prank(bob);
        token.transferFrom(alice, bob, 500e18);
        assertEq(token.allowance(alice, bob), 0);
    }
}
