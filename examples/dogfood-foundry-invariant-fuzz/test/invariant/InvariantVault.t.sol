// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../contracts/ERC20.sol";
import "../../contracts/Vault.sol";

/// @title Vault Handler
/// @notice Bounded deposit / withdraw driver. Every actor pre-approves the
///         vault so `deposit` does not fail on allowance. Amounts are
///         bounded per-actor to keep the state space navigable.
contract VaultHandler {
    ERC20 public asset;
    Vault public vault;
    address[] public actors;
    uint256 public totalDeposited;
    uint256 public totalWithdrawn;

    constructor(ERC20 _asset, Vault _vault, address[] memory _actors) {
        asset = _asset;
        vault = _vault;
        for (uint256 i = 0; i < _actors.length; i++) {
            actors.push(_actors[i]);
            // Seed each actor with 10M tokens so deposits have room.
            asset.mint(_actors[i], 10 * 10 ** 24);
            // Pre-approve unbounded — makes the deposit path a one-liner.
            vm_prank(_actors[i]);
            asset.approve(address(vault), type(uint256).max);
        }
    }

    function _pickActor(uint256 idx) internal view returns (address) {
        return actors[idx % actors.length];
    }

    function deposit(uint256 actorIdx, uint256 amount) external {
        address actor = _pickActor(actorIdx);
        uint256 balance = asset.balanceOf(actor);
        if (balance == 0) return;
        amount = amount % (balance + 1);
        if (amount == 0) return;
        vm_prank(actor);
        try vault.deposit(amount) {
            totalDeposited += amount;
        } catch {
            // deposit can revert on "dust" — that is a valid transition.
        }
    }

    function withdraw(uint256 actorIdx, uint256 shareAmount) external {
        address actor = _pickActor(actorIdx);
        uint256 s = vault.shares(actor);
        if (s == 0) return;
        shareAmount = shareAmount % (s + 1);
        if (shareAmount == 0) return;
        vm_prank(actor);
        try vault.withdraw(shareAmount) returns (uint256 out) {
            totalWithdrawn += out;
        } catch {
            // withdraw can revert on "dust" — that is a valid transition.
        }
    }

    function vm_prank(address caller) internal {
        (bool ok,) = address(uint160(uint256(keccak256("hevm cheat code")))).call(
            abi.encodeWithSignature("prank(address)", caller)
        );
        require(ok, "prank");
    }
}

/// @title InvariantVault
/// @notice Three vault invariants — each maps to a concrete accounting
///         property the fuzzer must not violate.
contract InvariantVault is Test {
    ERC20 public asset;
    Vault public vault;
    VaultHandler public handler;
    address[] public actors;

    function setUp() public {
        asset = new ERC20("VaultAsset", "VLA", 0);
        vault = new Vault(asset);
        actors.push(address(0xA11CE));
        actors.push(address(0xB0B));
        actors.push(address(0xCA401));
        handler = new VaultHandler(asset, vault, actors);
        targetContract(address(handler));
    }

    /// @notice `sum(shares) == totalShares`.
    function invariant_totalSharesEqSumOfActorShares() public view {
        uint256 sum;
        for (uint256 i = 0; i < actors.length; i++) {
            sum += vault.shares(actors[i]);
        }
        assertEq(sum, vault.totalShares(), "sum(shares) != totalShares");
    }

    /// @notice Vault balance sheet: the ERC-20 balance the vault physically
    ///         holds is exactly the `totalAssets` accounting field. Any
    ///         drift means the vault promised more than it holds (a
    ///         solvency break).
    function invariant_vaultBalanceMatchesTotalAssets() public view {
        assertEq(
            asset.balanceOf(address(vault)),
            vault.totalAssets(),
            "vault balance != totalAssets"
        );
    }

    /// @notice When there are no shares outstanding, the vault holds no
    ///         assets. Prevents a bug where withdrawals drain shares but
    ///         leave dust behind.
    function invariant_emptySharesImpliesEmptyAssets() public view {
        if (vault.totalShares() == 0) {
            assertEq(vault.totalAssets(), 0, "totalShares==0 but totalAssets>0");
        }
    }

    /// @notice What the vault holds equals what the handler saw go in, less
    ///         what it saw come out.
    ///
    ///         The three invariants above are relations between vault fields,
    ///         and all of them hold at zero — `sum(shares) == totalShares` and
    ///         `balance == totalAssets` are both `0 == 0`. Replacing
    ///         `Vault.deposit` with a body that returns 0 without transferring
    ///         leaves all three passing (measured), so none of them can tell a
    ///         working vault from one that does nothing.
    ///
    ///         The handler's `totalDeposited` / `totalWithdrawn` are the only
    ///         record of what was supposed to happen: they advance whenever the
    ///         call did not revert. Comparing them against the vault fails
    ///         exactly when the vault reports success and moves nothing.
    ///
    ///         Written as an addition rather than `deposited - withdrawn` so a
    ///         vault that paid out more than it took in reports the mismatch
    ///         here instead of reverting on underflow.
    function invariant_totalAssetsMatchesNetDeposits() public view {
        assertEq(
            vault.totalAssets() + handler.totalWithdrawn(),
            handler.totalDeposited(),
            "totalAssets + withdrawn != deposited"
        );
    }
}
