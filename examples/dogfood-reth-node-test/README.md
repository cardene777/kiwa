# dogfood-reth-node-test

Dogfood app (v1.18-2) — Reth NodeBuilder dev chain driven from Rust through `kiwa-test-rs`'s `contract::reth` + `contract::alloy` + `contract::foundry` adapters. Three ERC-20 scenarios (transfer / 3-block reorg / event history) exercised through a provider-neutral adapter shape so the fidelity harness diffs mock vs real on the same call surface.

## Layout

```
Cargo.toml                        -- Rust crate manifest (workspace member)
src/
  lib.rs                          -- adapters (mock + real) + fidelity harness + ABI helpers
  scenarios.rs                    -- 3 shared scenarios (erc20_transfer / reorg_3block / event_history)
tests/
  scenarios_mock.rs               -- 10 mock-mode scenario tests (unit layer)
  fidelity_report.rs              -- 5 harness tests (real graceful skip + JSON-RPC matrix)
  emit_fidelity_report.rs         -- writes quality-report/fidelity-latest.{md,json}
  release_gate.rs                 -- 4 release-gate tests covering the 11-axis payload
  live_reth_smoke.rs              -- live-mode smoke (KIWA_RETH_LIVE=1 opt-in)
```

## 3-layer test structure

- **unit** — `MockChainState` + `MockRethAdapter` walked entirely in-process. Deterministic on every host. Tests in `scenarios_mock.rs`.
- **integration** — both `MockRethAdapter` and `RealRethAdapter` driven through the same 6-op sequence. The real adapter records `RETH_ENV_MISSING` when `reth` is not on PATH and the fidelity harness surfaces the divergence. Tests in `fidelity_report.rs` + `release_gate.rs`.
- **live** — `RethNode::spawn_dev` actually spawns `reth node --dev`, waits for the JSON-RPC endpoint, and hits `debug_setHead`. Opt-in through `KIWA_RETH_LIVE=1` + `reth` binary on PATH. Test in `live_reth_smoke.rs`.

## Adapters

- `MockRethAdapter` — never touches the network. Every scenario mutates a shared `MockChainState` (block height + per-account balances + `Transfer` event log + snapshot stack). `reorg` walks the snapshot stack back N blocks so the balance sheet and event log both roll back atomically.
- `RealRethAdapter` — probes `reth` on PATH via `RethBinary::detect`. Ships two constructors: `RealRethAdapter::new` (never spawns, only used by the integration layer) and `RealRethAdapter::spawn_when_available` (returns `Some` only when reth + `KIWA_RETH_LIVE=1` are both present). Records `RETH_ENV_MISSING` in the trace when the binary is missing so the fidelity harness observes the divergence.

## Run

```bash
# All layers except live (unit + integration + release-gate)
cargo test -p dogfood-reth-node-test
cat quality-report/fidelity-latest.md
```

Live layer (spawns a real reth subprocess).

```bash
export KIWA_RETH_LIVE=1
cargo test -p dogfood-reth-node-test --test live_reth_smoke -- --nocapture
```

## Related

- v1.18-1 `kiwa::contract::reth` (feature `contract-reth`) — the `RethBinary::detect`, `RethNode::spawn_dev`, `reth_reorg`, and `fidelity_matrix()` surface this crate drives.
- v1.10-6 `kiwa::contract::alloy` (feature `contract-alloy`) — the `ContractCall` + `SolAbi` primitives used to encode the ERC-20 `transfer` call.
- v1.11-4 `dogfood-foundry-dapp` — the trace / adapter / fidelity report shape this crate mirrors so both Rust dogfoods diff on the same JSON schema.
- v1.18 milestone parent [#792](https://github.com/cardene777/kiwa/issues/792), this sub [#794](https://github.com/cardene777/kiwa/issues/794).
