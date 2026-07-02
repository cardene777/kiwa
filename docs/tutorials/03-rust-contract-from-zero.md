# Rust contract test from zero

## What you'll build

A Rust integration test that detects the Foundry toolchain, spawns a deterministic anvil node, runs `forge test` on a small Solidity contract, and captures the coverage report. When Foundry is not installed, the test skips gracefully so CI is happy on any host.

## Prerequisites

- Rust ≥ 1.75 (`rustc --version`)
- Optional: `foundryup` for the real path (`curl -L https://foundry.paradigm.xyz | bash && foundryup`)

## Step-by-step build

```bash
cargo new --lib kiwa-foundry-first
cd kiwa-foundry-first
```

Add kiwa-test-rs as a dev dependency in `Cargo.toml`:

```toml
[package]
name = "kiwa-foundry-first"
version = "0.1.0"
edition = "2021"

[dependencies]
kiwa-test-rs = { version = "0.4", features = ["contract-foundry", "contract-alloy"] }
```

Add a Solidity contract at `contracts/Counter.sol` (Foundry layout):

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Counter {
    uint256 public count;

    function increment() external {
        count += 1;
    }
}
```

Add `test/Counter.t.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/Counter.sol";

contract CounterTest is Test {
    function test_incrementUpdatesCount() public {
        Counter c = new Counter();
        c.increment();
        assertEq(c.count(), 1);
    }
}
```

Add a Rust integration test at `tests/counter.rs`:

```rust
use std::path::PathBuf;
use std::time::Duration;

use kiwa::contract::foundry::{Anvil, FoundryEnv};

#[test]
fn t_counter_run_forge_test_or_skip() {
    let env = FoundryEnv::detect();
    if !env.all_available() {
        eprintln!("Foundry CLI missing — skipping the real test path");
        return;
    }

    let anvil = Anvil::spawn_deterministic(8545).expect("anvil spawn");
    anvil.wait_ready(Duration::from_secs(3)).expect("anvil ready");

    let root = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let out = env.forge_test(&root).expect("forge test");
    assert!(out.success, "forge test failed:\n{}", out.stderr);
    assert_eq!(out.tests_failed, Some(0));
}
```

Add a `foundry.toml` at the repo root:

```toml
[profile.default]
src = "contracts"
test = "test"
out = "out"
solc = "0.8.20"
```

Run:

```bash
cargo test -p kiwa-foundry-first
```

## Explanation

- `FoundryEnv::detect()` probes `forge`, `cast`, and `anvil` on PATH and returns a shape with `bool` flags. When any binary is missing, the test bails cleanly rather than failing.
- `Anvil::spawn_deterministic(port)` spawns `anvil --port … --deterministic` and returns a handle whose `Drop` impl kills the child + reaps it — no zombie processes.
- `env.forge_test(root)` shells out to `forge test`, parses the stdout summary, and returns the pass / fail counts. When the CLI returns non-zero, the assertion fails with the stderr appended.

## Troubleshoot

- **`forge not on PATH`** — Install Foundry with `foundryup` and reopen the terminal so `~/.foundry/bin` is on PATH.
- **`anvil did not start within 3s`** — Another process is holding `:8545`. Use a different port or `lsof -i :8545` to find the culprit.
- **`No test target matched`** — Foundry test discovery walks `test/` — make sure your test file ends in `.t.sol`.

## Next steps

- [Next.js Server Actions with kiwa-nextjs](./04-nextjs-server-actions.md) covers the web framework side.
- The alloy helper adds a `SolAbi::parse_foundry_out` you can layer on top — see [`kiwa-rs/src/contract/alloy.rs`](../../kiwa-rs/src/contract/alloy.rs).
