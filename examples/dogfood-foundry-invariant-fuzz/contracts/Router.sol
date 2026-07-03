// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ERC20.sol";

/// @title Router (invariant-fuzz dogfood)
/// @notice Multi-hop swap over a linear pool graph. Registers `n` ERC-20
///         tokens with a fixed conversion rate between adjacent tokens
///         (`token[i] -> token[i+1]` at `rate[i]` basis points). A swap
///         walks the token list from a start index to an end index,
///         accumulating the product of the rates.
///
///         The invariant harness runs against a 3-token graph
///         (`TOKEN_A -> TOKEN_B -> TOKEN_C`) and asserts:
///
///           1. `Router_INV_001` — swaps never mint tokens out of thin air.
///              After a swap, the caller's `TOKEN_C` balance minus their
///              pre-swap balance equals `expectedOut(amountIn)`.
///           2. `Router_INV_002` — path length matters. A direct
///              `TOKEN_A -> TOKEN_C` swap yields the same output as
///              `TOKEN_A -> TOKEN_B -> TOKEN_C` when the pool is fully
///              stocked (no dust from rounding).
///           3. `Router_INV_003` — router never holds tokens between calls
///              — every swap fully drains the intermediate balances.
///
///         The router owns pool liquidity: on setup, the deployer mints a
///         large supply to `address(this)` of every token so swaps have
///         inventory to draw from.
contract Router {
    ERC20[3] public tokens;
    /// @notice basis-point rate for token[i] -> token[i+1]. 10000 = 1:1.
    uint256[2] public rateBps;

    event Swap(address indexed user, uint256 amountIn, uint256 amountOut, uint8 pathLen);

    constructor(ERC20 tokenA, ERC20 tokenB, ERC20 tokenC, uint256 rateAB, uint256 rateBC) {
        tokens[0] = tokenA;
        tokens[1] = tokenB;
        tokens[2] = tokenC;
        rateBps[0] = rateAB;
        rateBps[1] = rateBC;
    }

    /// @notice Return the expected out amount for a swap from token[startIdx]
    ///         to token[endIdx] with `amountIn` inputs. Pure function so
    ///         invariants can call it without state mutation.
    function expectedOut(uint8 startIdx, uint8 endIdx, uint256 amountIn) public view returns (uint256) {
        require(startIdx < endIdx, "expectedOut: order");
        require(endIdx < 3, "expectedOut: bounds");
        uint256 out = amountIn;
        for (uint8 i = startIdx; i < endIdx; i++) {
            out = (out * rateBps[i]) / 10000;
        }
        return out;
    }

    /// @notice Swap `amountIn` of token[startIdx] for token[endIdx].
    ///         Router pulls the input tokens from `msg.sender` and returns
    ///         the output tokens. Path length is `endIdx - startIdx`.
    function swap(uint8 startIdx, uint8 endIdx, uint256 amountIn) external returns (uint256 out) {
        require(startIdx < endIdx, "swap: order");
        require(endIdx < 3, "swap: bounds");
        require(amountIn > 0, "swap: zero");
        require(tokens[startIdx].transferFrom(msg.sender, address(this), amountIn), "swap: pull");
        out = expectedOut(startIdx, endIdx, amountIn);
        require(out > 0, "swap: dust");
        require(tokens[endIdx].transfer(msg.sender, out), "swap: push");
        emit Swap(msg.sender, amountIn, out, endIdx - startIdx);
    }

    /// @notice How many tokens the router currently holds for `idx`. Used by
    ///         invariant `Router_INV_003` — the router should never keep
    ///         intermediate tokens (path is fully unwound within one call).
    function reserve(uint8 idx) external view returns (uint256) {
        require(idx < 3, "reserve: bounds");
        return tokens[idx].balanceOf(address(this));
    }
}
