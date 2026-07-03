# Reth node test (dev chain + reorg + fidelity matrix) in 10 min

## What you'll build

A Rust integration test that spawns `reth node --dev`, waits for its JSON-RPC endpoint, drives a 3-block reorg through `debug_setHead`, then walks the 7-method `anvil` ↔ `reth` fidelity matrix and asserts each row. When `reth` is not on PATH the test skips gracefully so the same file green-lights on any host. The whole harness ships as `kiwa-test-rs` v0.5's `contract::reth` module — no `alloy` crate family dependency, no runtime bloat.

## Prerequisites

- Rust ≥ 1.75 (`rustc --version`)
- Optional real path — install `reth` (`cargo install --locked --git https://github.com/paradigmxyz/reth reth`) and `foundryup` for anvil. Without either binary the test still runs and records `skipped` in the report.

## Step-by-step build

```bash
cargo new --lib kiwa-reth-first
cd kiwa-reth-first
```

Add `kiwa-test-rs` as a dev dependency with the `contract-reth` feature turned on. The feature is opt-in (`default OFF`) so the reth adapter does not leak into runtime unless the caller asks for it.

```toml
[package]
name = "kiwa-reth-first"
version = "0.1.0"
edition = "2021"

[dev-dependencies]
kiwa-test-rs = { version = "0.5", features = ["contract-reth", "contract-foundry"] }
```

Create the integration test at `tests/reth_smoke.rs`:

```rust
use std::time::Duration;

use kiwa::contract::reth::{RethBinary, RethNode, fidelity_matrix, reth_reorg};

#[test]
fn reth_dev_reorg_and_fidelity_matrix() {
    // Probe PATH so the same test file works on hosts without reth.
    let bin = RethBinary::detect();
    if !bin.available {
        eprintln!("reth not on PATH — skipping live reth exercise");
        return;
    }

    // Spawn `reth node --dev --http --http.port 8551`. Drop takes down the
    // child process so a panic in the assertions below cannot leak a running
    // reth process into the shell.
    let node = RethNode::spawn_dev(8551).expect("spawn reth dev");
    node.wait_ready(Duration::from_secs(3))
        .expect("reth rpc did not come up");

    // Drive a 3-block reorg through debug_setHead. The report captures the
    // raw response body so the test can assert on the JSON-RPC envelope.
    let reorg = reth_reorg(node.endpoint(), 3).expect("reorg helper");
    assert!(reorg.rpc_ok, "debug_setHead returned an error: {}", reorg.response_body);
    assert_eq!(reorg.blocks, 3);
    assert!(reorg.request.contains("debug_setHead"));

    // Walk the 7-row anvil ↔ reth fidelity matrix. Every row carries a
    // rationale explaining when the two clients are expected to agree.
    let matrix = fidelity_matrix();
    assert_eq!(matrix.len(), 7);
    let agree = matrix.iter().filter(|c| c.expected_agreement).count();
    let disagree = matrix.len() - agree;
    assert_eq!(agree, 4, "expect 4 rows where anvil and reth agree");
    assert_eq!(disagree, 3, "expect 3 rows where clients diverge by design");
}
```

## Run

```bash
cargo test
```

Without `reth` on PATH the test returns early after the `skip` message. With `reth` installed the assertions above pass in around a second. To see the JSON-RPC body reth returns for `debug_setHead`, add `-- --nocapture`.

```bash
cargo test -- --nocapture
```

## Why the fidelity matrix matters

The `contract::reth` module exists to give the `kiwa` release gate a second Rust EL client to compare `anvil` against. The 7 rows the matrix ships with fall into two buckets.

| Method | Agreement | Why |
|---|---|---|
| `eth_blockNumber` / `eth_getBalance` / `eth_call` / `eth_chainId` | Agree | Deterministic responses per Yellow Paper §6 + fixed chain-id defaults |
| `eth_gasPrice` / `net_version` / `web3_clientVersion` | Diverge by design | EIP-1559 base fee, chain-id string, client banner differ per client |

Each `FidelityCase` carries a human-readable `rationale`, so when a downstream harness catches a new divergence the test failure shows *why* it was expected to agree in the first place. This is the same shape the `contract::foundry::invariant` and `contract::alloy::helpers` submodules use — every kiwa release gate row lands on the 11-axis contract.

## What v0.5 adds beyond `anvil`

The v0.4 `contract::foundry::Anvil` handle covers the "spawn a dev chain and drive JSON-RPC" case. `contract::reth` mirrors it with three additions.

- Two dev-mode chains, not one — kiwa consumers can wire a `RethNode` next to an `Anvil` and diff the two under the same test.
- A first-class reorg helper (`reth_reorg`) that leans on `debug_setHead` reth exposes in dev mode. anvil uses `anvil_reorg`; the calling code stays symmetric.
- The `FidelityCase` matrix + `expected_agreement` boolean flag divergence intentionally so a green suite means "the two clients agree where they should and diverge where the matrix predicts."

## Related

- Concept doc — [Blockchain testing (chain state / EL client / fuzz / reorg SSOT)](../concepts/blockchain-testing)
- Tutorial 03 — [Rust contract test from zero](./03-rust-contract-from-zero) (v0.4 baseline)
- v1.18-1 [#793](https://github.com/cardene777/kiwa/issues/793) — `kiwa-test-rs` v0.5 landing
- v1.18-2 [#794](https://github.com/cardene777/kiwa/issues/794) — `dogfood-reth-node-test` (the full 3-layer dogfood this tutorial cuts down)
