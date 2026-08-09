// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../contracts/ERC20.sol";
import "../../contracts/Router.sol";

/// @title Router Handler
/// @notice Bounded swap driver. Each actor holds a supply of TOKEN_A
///         (the entry token) and pre-approves the router. Fuzzer picks a
///         `(startIdx, endIdx, amountIn)` triple bounded to reachable
///         values.
contract RouterHandler {
    ERC20[3] public tokens;
    Router public router;
    address[] public actors;
    uint256 public swapsExecuted;

    constructor(ERC20[3] memory _tokens, Router _router, address[] memory _actors) {
        tokens = _tokens;
        router = _router;
        for (uint256 i = 0; i < _actors.length; i++) {
            actors.push(_actors[i]);
            // Seed each actor with 1M TOKEN_A so swaps have inventory.
            tokens[0].mint(_actors[i], 10 ** 24);
            vm_prank(_actors[i]);
            tokens[0].approve(address(router), type(uint256).max);
        }
        // Seed the router with TOKEN_B / TOKEN_C so its pool has inventory
        // to release on swaps.
        tokens[1].mint(address(router), 10 ** 27);
        tokens[2].mint(address(router), 10 ** 27);
    }

    function _pickActor(uint256 idx) internal view returns (address) {
        return actors[idx % actors.length];
    }

    function swap(uint256 actorIdx, uint256 amount) external {
        address actor = _pickActor(actorIdx);
        uint256 balance = tokens[0].balanceOf(actor);
        if (balance == 0) return;
        amount = amount % (balance + 1);
        if (amount == 0) return;
        // Always start at token A (idx 0); the invariant only cares about
        // the A -> C direction so we fix startIdx = 0, endIdx = 2.
        vm_prank(actor);
        try router.swap(0, 2, amount) {
            swapsExecuted += 1;
        } catch {
            // Reverts on dust are acceptable transitions.
        }
    }

    function vm_prank(address caller) internal {
        (bool ok,) = address(uint160(uint256(keccak256("hevm cheat code")))).call(
            abi.encodeWithSignature("prank(address)", caller)
        );
        require(ok, "prank");
    }
}

/// @title InvariantRouter
/// @notice Three router invariants — each locks a property the multi-hop
///         swap must respect.
contract InvariantRouter is Test {
    ERC20 public tokenA;
    ERC20 public tokenB;
    ERC20 public tokenC;
    Router public router;
    RouterHandler public handler;

    function setUp() public {
        tokenA = new ERC20("Alpha", "ALP", 0);
        tokenB = new ERC20("Bravo", "BRV", 0);
        tokenC = new ERC20("Charlie", "CHR", 0);
        // 9500 bps = 0.95x — small slippage each hop so the invariant
        // asserts against a non-trivial rate product.
        router = new Router(tokenA, tokenB, tokenC, 9500, 9500);
        address[] memory actors = new address[](3);
        actors[0] = address(0xA11CE);
        actors[1] = address(0xB0B);
        actors[2] = address(0xCA401);
        ERC20[3] memory tokens = [tokenA, tokenB, tokenC];
        handler = new RouterHandler(tokens, router, actors);
        targetContract(address(handler));
    }

    /// @notice The router never keeps intermediate token B tokens between
    ///         swaps. A well-formed multi-hop unwinds the intermediate leg
    ///         within one call, so B reserves should always equal the
    ///         seeded initial amount.
    function invariant_routerHoldsSeededTokenBReserve() public view {
        // Router was seeded with 10 ** 27 of B/C. Since the router never
        // acquires B from users (swaps pull A and push C), the B reserve
        // stays at exactly the seeded amount.
        assertEq(router.reserve(1), 10 ** 27, "router B reserve drifted");
    }

    /// @notice Total token A held by users + router equals the amount
    ///         initially minted. Router pulls A from users on each swap so
    ///         the sum stays constant.
    function invariant_tokenAConservationAcrossActors() public view {
        uint256 usersA = tokenA.balanceOf(address(0xA11CE))
            + tokenA.balanceOf(address(0xB0B))
            + tokenA.balanceOf(address(0xCA401));
        uint256 routerA = router.reserve(0);
        // Each actor was seeded with 10 ** 24. Router starts with 0 A.
        assertEq(usersA + routerA, 3 * 10 ** 24, "token A total supply drifted");
    }

    /// @notice Every swap pays out at most `amountIn * rateAB * rateBC` in
    ///         C tokens. Reserve C only decreases; router never mints C
    ///         out of thin air.
    function invariant_routerCReserveOnlyDecreases() public view {
        // Router seeded with 10 ** 27 of C. Only outflow is `swap` pushing
        // C to callers, so reserve <= 10 ** 27.
        assertLe(router.reserve(2), 10 ** 27, "router C reserve grew beyond seed");
    }

    /// @notice A swap the handler recorded as successful must have released
    ///         token C from the router.
    ///
    ///         The three invariants above are relations that also hold when
    ///         nothing happens: B stays seeded, A sums to its mint, and C is
    ///         `<=` its seed at equality. Replacing `Router.swap` with a body
    ///         that returns 0 without transferring leaves all three passing
    ///         (measured), so they say nothing about whether swapping works.
    ///
    ///         `swapsExecuted` counts calls that did not revert, which is the
    ///         handler's record that a swap was supposed to have happened. Held
    ///         against the reserve, the pair fails exactly when the router
    ///         claims success and moves nothing.
    function invariant_recordedSwapsReleasedTokenC() public view {
        if (handler.swapsExecuted() == 0) return;
        assertLt(
            router.reserve(2),
            10 ** 27,
            "swaps were recorded but the router released no token C"
        );
    }

    /// @notice The campaign has to have swapped at least once.
    ///
    ///         Every invariant above, including the one right before this,
    ///         holds when no swap ever succeeded — the reserves stay seeded and
    ///         `swapsExecuted` stays 0, which sends that one down its early
    ///         return. A `swap` that always reverts therefore passes the whole
    ///         suite (measured), and the handler swallows the revert by design
    ///         because dust reverts are a legitimate transition.
    ///
    ///         Invariant functions cannot make this assertion: they run after
    ///         the first call too, when nothing has succeeded yet and zero is
    ///         correct. `afterInvariant` runs once at the end of the campaign,
    ///         which is the only point where "nothing ever worked" is knowable.
    function afterInvariant() public view {
        assertGt(handler.swapsExecuted(), 0, "no swap succeeded in the whole campaign");
    }
}
