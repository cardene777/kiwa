// SPDX-License-Identifier: MIT
// /contract-test-foundry 出力 (test-spec-defi-swap.md 由来)
// 用途: examples/defi-swap の test 後付け導入
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/SwapTokens.sol";

contract SwapTokensTest is Test {
    Erc20 public tokenA;
    Erc20 public tokenB;
    SimpleSwap public swap;

    address public alice = address(0xA1);
    address public bob = address(0xB0);
    address public lp = address(0xC0);

    uint256 constant INITIAL_SUPPLY = 1_000_000 ether;

    function setUp() public {
        tokenA = new Erc20("TokenA", "TKA", INITIAL_SUPPLY, alice);
        tokenB = new Erc20("TokenB", "TKB", INITIAL_SUPPLY, lp);
        swap = new SimpleSwap(address(tokenA), address(tokenB));

        // LP が pool に tokenB を 1000 入れる (initial liquidity)
        vm.prank(lp);
        tokenB.transfer(address(swap), 1000 ether);
    }

    // ==========================================
    // 観点 1: 正常系
    // ==========================================

    /// TC-001: transfer happy path
    function test_Transfer_HappyPath() public {
        vm.prank(alice);
        bool ok = tokenA.transfer(bob, 100 ether);
        assertTrue(ok);
        assertEq(tokenA.balanceOf(alice), INITIAL_SUPPLY - 100 ether);
        assertEq(tokenA.balanceOf(bob), 100 ether);
    }

    /// TC-002: approve happy path
    function test_Approve_HappyPath() public {
        vm.prank(alice);
        tokenA.approve(bob, 50 ether);
        assertEq(tokenA.allowance(alice, bob), 50 ether);
    }

    /// TC-003: swap happy path (1:1 rate)
    function test_Swap_HappyPath() public {
        vm.prank(alice);
        tokenA.approve(address(swap), 100 ether);

        vm.prank(alice);
        uint256 out = swap.swapAforB(100 ether, 100 ether);

        assertEq(out, 100 ether);
        assertEq(tokenA.balanceOf(alice), INITIAL_SUPPLY - 100 ether);
        assertEq(tokenB.balanceOf(alice), 100 ether);
        assertEq(tokenA.balanceOf(address(swap)), 100 ether);
        assertEq(tokenB.balanceOf(address(swap)), 900 ether);
    }

    // ==========================================
    // 観点 2: 異常系
    // ==========================================

    /// TC-004: approve なしで transferFrom → InsufficientAllowance
    function test_TransferFrom_Reverts_NoApproval() public {
        vm.prank(bob);
        vm.expectRevert(Erc20.InsufficientAllowance.selector);
        tokenA.transferFrom(alice, bob, 100 ether);
    }

    /// TC-005: balance 不足で transfer → InsufficientBalance
    function test_Transfer_Reverts_InsufficientBalance() public {
        vm.prank(bob);  // bob は 0 balance
        vm.expectRevert(Erc20.InsufficientBalance.selector);
        tokenA.transfer(alice, 100 ether);
    }

    /// TC-006: pool 流動性不足で swap → InsufficientLiquidity
    function test_Swap_Reverts_InsufficientLiquidity() public {
        vm.prank(alice);
        tokenA.approve(address(swap), 2000 ether);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(
            SimpleSwap.InsufficientLiquidity.selector,
            2000 ether,
            1000 ether  // pool 残高
        ));
        swap.swapAforB(2000 ether);
    }

    // ==========================================
    // 観点 3: 境界値
    // ==========================================

    /// TC-007: slippage で amountOut < minOutputAmount → SlippageExceeded
    function test_Swap_Reverts_Slippage() public {
        vm.prank(alice);
        tokenA.approve(address(swap), 100 ether);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(
            SimpleSwap.SlippageExceeded.selector,
            100 ether,
            101 ether
        ));
        swap.swapAforB(100 ether, 101 ether);
    }

    /// TC-008: pool tokenB ちょうど消費 → success、 pool 0
    function test_Swap_DrainsPool() public {
        vm.prank(alice);
        tokenA.approve(address(swap), 1000 ether);

        vm.prank(alice);
        uint256 out = swap.swapAforB(1000 ether, 1000 ether);

        assertEq(out, 1000 ether);
        assertEq(tokenB.balanceOf(address(swap)), 0);
    }

    /// fuzz: swap amount を 1 〜 1000 範囲で常に success
    function testFuzz_Swap_Boundary(uint256 amount) public {
        amount = bound(amount, 1 ether, 1000 ether);
        vm.prank(alice);
        tokenA.approve(address(swap), amount);

        vm.prank(alice);
        uint256 out = swap.swapAforB(amount, 0);
        assertEq(out, amount);
    }

    // ==========================================
    // 観点 4: 状態遷移
    // ==========================================

    /// TC-009: infinite approval (max uint256) は transferFrom で allowance 不変
    function test_TransferFrom_InfiniteApproval_AllowanceStays() public {
        vm.prank(alice);
        tokenA.approve(bob, type(uint256).max);

        vm.prank(bob);
        tokenA.transferFrom(alice, bob, 100 ether);

        assertEq(tokenA.allowance(alice, bob), type(uint256).max);
        assertEq(tokenA.balanceOf(bob), 100 ether);
    }

    /// TC-010: 通常 allowance は transferFrom で差分減算
    function test_TransferFrom_NormalApproval_AllowanceDecremented() public {
        vm.prank(alice);
        tokenA.approve(bob, 50 ether);

        vm.prank(bob);
        tokenA.transferFrom(alice, bob, 30 ether);

        assertEq(tokenA.allowance(alice, bob), 20 ether);
        assertEq(tokenA.balanceOf(bob), 30 ether);
    }

    // ==========================================
    // 観点 10: セキュリティ
    // ==========================================

    /// TC-011: swap 経由でも allowance 差分減算が正しく行われる (通常 approval)
    function test_Swap_DecrementsAllowance() public {
        vm.prank(alice);
        tokenA.approve(address(swap), 200 ether);

        vm.prank(alice);
        swap.swapAforB(100 ether, 0);

        assertEq(tokenA.allowance(alice, address(swap)), 100 ether);  // 200 - 100
    }
}
