# Foundry invariant + fuzz runner (10 000 runs + deterministic seed + shrink parser) in 12 min

## What you'll build

A Rust integration test that drives Foundry's invariant runner from `kiwa-test-rs` v0.5, using a 10 000-run budget with a fixed seed for full determinism. The test asserts that a small `ERC-20` contract's classic invariant — `sum(balances) == totalSupply` — holds under Foundry's stateful state-explorer, then swaps in a broken contract and verifies the harness parses the shrink summary Foundry emits when the run fails. The whole flow lives behind a `forge`-not-on-PATH graceful skip, so the same test file passes on hosts without Foundry installed.

## Prerequisites

- Rust ≥ 1.75
- Optional real path — `foundryup` (`curl -L https://foundry.paradigm.xyz | bash && foundryup`). Without `forge` on PATH the harness records `Skipped` and the test still returns green.

## Step-by-step build

```bash
cargo new --lib kiwa-invariant-first
cd kiwa-invariant-first
```

Turn on the `contract-foundry` feature in `Cargo.toml`.

```toml
[package]
name = "kiwa-invariant-first"
version = "0.1.0"
edition = "2021"

[dev-dependencies]
kiwa-test-rs = { version = "0.5", features = ["contract-foundry"] }
```

Add a Foundry project descriptor `foundry.toml` at the repo root.

```toml
[profile.default]
src = "contracts"
test = "test"
out = "forge-out"

[invariant]
runs = 256
depth = 15
fail_on_revert = false

[fuzz]
runs = 256
```

Ship the ERC-20 contract at `contracts/ERC20.sol`.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ERC20 {
    mapping(address => uint256) public balanceOf;
    uint256 public totalSupply;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "insufficient");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}
```

Add the invariant test at `test/InvariantERC20.t.sol`. Foundry's state-explorer discovers `invariant_*` functions on any contract whose name starts with `Invariant`.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "../contracts/ERC20.sol";

contract InvariantERC20 is Test {
    ERC20 internal token;
    address[4] internal actors;

    function setUp() public {
        token = new ERC20();
        actors = [address(0xA1), address(0xA2), address(0xA3), address(0xA4)];
        for (uint256 i = 0; i < actors.length; i++) {
            token.mint(actors[i], 1_000 ether);
        }
    }

    function invariant_totalSupplyEqSumOfBalances() public view {
        uint256 sum;
        for (uint256 i = 0; i < actors.length; i++) {
            sum += token.balanceOf(actors[i]);
        }
        assertEq(sum, token.totalSupply());
    }
}
```

Wire the Rust runner at `tests/invariant_run.rs`. `kiwa-test-rs` renders the CLI, sets the deterministic seed env vars Foundry reads at startup, captures stdout / stderr, and parses Foundry's shrink summary when a counter-example lands.

```rust
use std::path::PathBuf;

use kiwa::contract::foundry::{
    FoundryEnv, InvariantOutcome,
    invariant::{InvariantOptions, invariant_run},
};

fn project_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
}

#[test]
fn erc20_invariant_holds_under_10000_runs() {
    let env = FoundryEnv::detect();
    let report = invariant_run(
        &env,
        &project_root(),
        &InvariantOptions {
            runs: 10_000,
            seed: Some(0xdead_beef),
            match_contract: Some("InvariantERC20".to_string()),
            match_test: None,
            extra_forge_args: Vec::new(),
        },
    )
    .expect("invariant_run I/O");

    if report.skipped {
        eprintln!("forge not on PATH — skipping live invariant exercise");
        return;
    }

    assert_eq!(report.outcome, InvariantOutcome::Passed);
    assert_eq!(report.seed, Some(0xdead_beef));
    assert!(report.command.contains("--match-contract InvariantERC20"));
}
```

## Run

```bash
cargo test
```

Without `forge` on PATH the report skips and the test returns. With Foundry installed, the runner reads `FOUNDRY_INVARIANT_RUNS=10000` and `FOUNDRY_INVARIANT_SEED=0x00000000deadbeef` from the environment — those env vars override any `foundry.toml` value, so parallel test invocations do not race on the shared config file.

## Force a failure and read the shrink

Add a broken variant of the invariant test to see the shrink parser in action. Copy `test/InvariantERC20.t.sol` to `test/InvariantERC20Broken.t.sol` and replace the invariant body with `assertEq(sum, token.totalSupply() + 1)`. Then run.

```rust
let report = invariant_run(
    &env,
    &project_root(),
    &InvariantOptions {
        runs: 256, // small budget — Foundry finds the counter-example on run 1
        seed: Some(0xcafe),
        match_contract: Some("InvariantERC20Broken".to_string()),
        ..Default::default()
    },
)?;

if !report.skipped {
    assert_eq!(report.outcome, InvariantOutcome::Failed);
    let shrink = report.shrink.expect("shrink summary parsed");
    assert!(shrink.reason.contains("Assertion failed"));
    assert!(!shrink.sequence.is_empty());
    for step in &shrink.sequence {
        eprintln!("step: {} -> {} ({} bytes calldata)", step.target, step.signature, step.calldata.len());
    }
}
```

The `ShrinkResult` carries three fields — the failing `test_name`, the one-line `reason` string parsed from Foundry's `[FAIL. Reason: ...]` header, and the ordered `sequence` of `ShrinkStep` triples (`target` / `signature` / `calldata`) Foundry settles on after shrinking.

## Why deterministic seeding matters

Foundry's default fuzz / invariant behaviour picks a fresh RNG seed per invocation. That means the same test can pass locally on Monday and fail in CI on Tuesday when a boundary condition finally surfaces — the *test* did not change, only the seed did.

`InvariantOptions::seed = Some(u64)` forwards the value as `FOUNDRY_INVARIANT_SEED` + `FOUNDRY_FUZZ_SEED`, so every run visits exactly the same state graph. When a bug surfaces you keep the seed on the diff so the fix reproduces the shrink verbatim; when you want fresh exploration you flip to `seed: None`.

## Related

- Concept doc — [Blockchain testing (chain state / EL client / fuzz / reorg SSOT)](../concepts/blockchain-testing)
- Tutorial 25 — [Reth node test (dev chain + reorg + fidelity matrix)](./25-reth-node-test)
- v1.18-1 [#793](https://github.com/cardene777/kiwa/issues/793) — `kiwa-test-rs` v0.5 landing
- v1.18-3 [#795](https://github.com/cardene777/kiwa/issues/795) — `dogfood-foundry-invariant-fuzz` (3 contracts × 9 invariants, the full harness this tutorial cuts down to one)
