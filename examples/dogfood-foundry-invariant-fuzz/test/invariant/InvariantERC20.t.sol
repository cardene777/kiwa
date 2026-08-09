// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../contracts/ERC20.sol";

/// @title ERC20 Handler
/// @notice Bounded action handler used by the invariant runner. Every public
///         function is a candidate transition the state-explorer can call
///         with random inputs. The handler keeps a bounded actor set + a
///         bounded amount range so runs converge on a meaningful state
///         space rather than drift into unreachable regions.
contract ERC20Handler {
    ERC20 public token;
    address[] public actors;
    uint256 public totalMinted;
    uint256 public totalBurned;

    constructor(ERC20 _token, address[] memory _actors) {
        token = _token;
        for (uint256 i = 0; i < _actors.length; i++) {
            actors.push(_actors[i]);
        }
    }

    function _pickActor(uint256 idx) internal view returns (address) {
        return actors[idx % actors.length];
    }

    /// @notice Bounded mint — fuzzer picks an actor and a bounded amount.
    function mint(uint256 actorIdx, uint256 amount) external {
        address to = _pickActor(actorIdx);
        // Bound the amount so we do not blow through uint256 in short order.
        // 10 ** 24 is 1M tokens with 18 decimals — plenty of room for
        // interesting transfers while staying deterministic.
        amount = amount % (10 ** 24);
        if (amount == 0) return;
        token.mint(to, amount);
        totalMinted += amount;
    }

    /// @notice Bounded transfer between two actors.
    function transfer(uint256 fromIdx, uint256 toIdx, uint256 amount) external {
        address from = _pickActor(fromIdx);
        address to = _pickActor(toIdx);
        uint256 balance = token.balanceOf(from);
        if (balance == 0) return;
        amount = amount % (balance + 1);
        if (amount == 0) return;
        vm_prank(from);
        token.transfer(to, amount);
    }

    /// @notice Bounded burn — depletes supply.
    function burn(uint256 actorIdx, uint256 amount) external {
        address from = _pickActor(actorIdx);
        uint256 balance = token.balanceOf(from);
        if (balance == 0) return;
        amount = amount % (balance + 1);
        if (amount == 0) return;
        token.burn(from, amount);
        totalBurned += amount;
    }

    /// @dev Inline `vm.prank` — the handler uses forge-std cheat-code lib
    ///      by casting into the well-known cheat-code address. Keeps the
    ///      import surface small.
    function vm_prank(address caller) internal {
        (bool ok,) = address(uint160(uint256(keccak256("hevm cheat code")))).call(
            abi.encodeWithSignature("prank(address)", caller)
        );
        require(ok, "prank");
    }
}

/// @title InvariantERC20
/// @notice Top-level invariant: for every reachable state,
///         `sum(balances[actor]) == totalSupply`.
///
///         The runner picks 4 actors and drives them through
///         `mint / transfer / burn` up to the configured depth. When the
///         invariant fails, forge shrinks the sequence and prints the failing
///         calldata. A kiwa-side helper used to parse that shrink summary for
///         downstream assertion; #1864 removed it, so the summary is read from
///         forge's own output.
contract InvariantERC20 is Test {
    ERC20 public token;
    ERC20Handler public handler;
    address[] public actors;

    function setUp() public {
        token = new ERC20("DogfoodInv", "DGI", 0);
        actors.push(address(0xA11CE));
        actors.push(address(0xB0B));
        actors.push(address(0xCA401));
        actors.push(address(0xDEADBEEF));
        handler = new ERC20Handler(token, actors);
        targetContract(address(handler));
    }

    /// @notice `sum(balances) == totalSupply` under any reachable call
    ///         sequence.
    function invariant_totalSupplyEqSumOfBalances() public view {
        uint256 sum;
        for (uint256 i = 0; i < actors.length; i++) {
            sum += token.balanceOf(actors[i]);
        }
        assertEq(sum, token.totalSupply(), "sum(balances) != totalSupply");
    }

    /// @notice Every mint bumps `totalSupply` by exactly the minted amount,
    ///         and every burn drops it by the burned amount. Because both
    ///         are tracked on the handler side, the delta must match.
    function invariant_totalSupplyMatchesMintMinusBurn() public view {
        assertEq(
            token.totalSupply(),
            handler.totalMinted() - handler.totalBurned(),
            "totalSupply != totalMinted - totalBurned"
        );
    }

    /// @notice `mint` raises total supply and credits the recipient.
    ///
    ///         The invariant above catches a `mint` that returns without
    ///         minting, because the handler records the amount either way. It
    ///         does not catch one that always reverts: the handler drops the
    ///         record with it and `0 == 0 - 0` holds (measured).
    ///
    ///         Calling `mint` directly catches both, and does not depend on the
    ///         fuzzer generating a `mint` in the sequence it happens to build —
    ///         which it does not always do, `mint` being one of three actions.
    function test_mintRaisesSupplyAndCreditsRecipient() public {
        address to = address(0xA11CE);
        uint256 supply = token.totalSupply();
        uint256 held = token.balanceOf(to);

        token.mint(to, 1_000);

        assertEq(token.totalSupply(), supply + 1_000, "totalSupply did not move");
        assertEq(token.balanceOf(to), held + 1_000, "recipient was not credited");
    }

    /// @notice `transfer` moves balance between holders and leaves supply alone.
    function test_transferMovesBalance() public {
        address from = address(0xA11CE);
        address to = address(0xB0B);
        token.mint(from, 1_000);
        uint256 supply = token.totalSupply();
        uint256 heldTo = token.balanceOf(to);

        vm.prank(from);
        token.transfer(to, 400);

        assertEq(token.balanceOf(from), 600, "sender balance did not drop");
        assertEq(token.balanceOf(to), heldTo + 400, "recipient balance did not rise");
        assertEq(token.totalSupply(), supply, "transfer changed total supply");
    }
}
