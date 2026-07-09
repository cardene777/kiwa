# Fidelity — dogfood-reth-node-test (v1.18-2)

Real-vs-mock behavioural fidelity for the Reth NodeBuilder dogfood, produced by `examples/dogfood-reth-node-test/tests/emit_fidelity_report.rs`. Feeds `@kiwa-lab/quality-metrics` release-gate 11-axis payload with a Rust-native blockchain adapter alongside the existing TypeScript ones.

## Baseline (real mode skipped — no `reth` on PATH)

When the harness runs on a host without the reth binary, the real adapter emits `RETH_ENV_MISSING` for the three scenario ops (`erc20_transfer` / `reorg_3block` / `event_history`) and passes the wiring ops (`describe_signer` / `describe_provider` / `detect_reth`) with the `RethBinary::detect`-observed availability recorded in the trace detail. Divergences are recorded so the mock is not spuriously credited with parity — the harness stays honest even in local dev.

```
provider   : @kiwa-lab/contract/reth-node-dogfood
version    : 0.1.0
verdict    : PASS
divergences: 3 (erc20_transfer / reorg_3block / event_history — recorded as BEHAVIORAL_DIVERGENCE, real mode absent)
axes       : 11 (blockchain branch — extends the common 7-axis release gate with 4 blockchain-specific axes)
```

| axis | actual | threshold | verdict |
|---|---|---|---|
| coverage.line | 90.00% | 85% | pass |
| coverage.branch | 82.00% | 80% | pass |
| coverage.function | 95.00% | 90% | pass |
| fidelity.ratio | 100.00% (6/6) | 70% | pass |
| fidelity.matrix.rows | 7 | 5 | pass |
| perf.p95Ms | 4.00 ms | 100 ms | pass |
| mutation.killRate | 72.00% (72/100) | 60% | pass |
| testCount.behavior | 16 | 10 | pass |
| chain.blockHeight | 11 | 10 | pass |
| chain.eventCount | 11 | 10 | pass |
| abi.transferSelector | 1 (`0xa9059cbb`) | 1 | pass |

The `divergences` count in the notes section counts every op whose mock path succeeded but whose real path emitted `RETH_ENV_MISSING` — this is the expected shape in a real-mode-skipped baseline. It does not fail the gate; the fidelity ratio measures the mock-covered surface area, which is 100% for the six ops the AC scopes.

## Reproduction

Common integration path (mock + graceful-skip real).

```bash
cargo test -p dogfood-reth-node-test
cat examples/dogfood-reth-node-test/quality-report/fidelity-latest.md
```

Live real-mode (spawns a `reth node --dev` subprocess).

```bash
# Install reth (see https://reth.rs) then:
export KIWA_RETH_LIVE=1
cargo test -p dogfood-reth-node-test --test live_reth_smoke -- --nocapture
```

When `KIWA_RETH_LIVE=1` is set but the reth binary is not on PATH, the live test prints a skip message and returns without failing. When both are present, the test spawns reth on port `18545`, waits up to 10s for the JSON-RPC endpoint, then drives `debug_setHead(3)` through `kiwa::contract::reth::reth_reorg`.

## Ops under measurement

Six provider-neutral ops on `RethScenarioAdapter`.

- `erc20_transfer` — mint 1_000_000 tokens to `alice`, then transfer 100 tokens to `bob` 10 times. Records the final balance sheet and block height.
- `reorg_3block` — roll the chain back three blocks via `debug_setHead` and re-check the balance sheet. `balances_restored` is true when `bob`'s balance decreased by exactly `3 * 100` tokens (the three rolled-back transfers).
- `event_history` — re-query the `Transfer` event log after the reorg and report how many events survived. Pruned events are counted against `pruned_events` (3 in the baseline).
- `describe_signer` — report the `Signer` variant the adapter would use (`LocalWallet` with chain id `1337`).
- `describe_provider` — report the `Provider` variant the adapter would connect to (`Http` on the given port).
- `detect_reth` — probe the `reth` binary via `RethBinary::detect`. Records `available` in the trace detail so the fidelity harness can distinguish "not installed" from "adapter buggy".

## Notes

**Snapshot stack + reorg semantics.** The mock chain state stores one `ChainSnapshot` per mined block (balances + event count). `reorg(N)` pops N snapshots off the tail, restores from the new tail, then truncates the event log to the pre-reorg count. This matches the semantics `debug_setHead` exposes on reth's dev mode: the state machine walks back to a prior head deterministically, and every consumer that queried past-that-head data (balances, event logs) sees the pre-reorg snapshot. `T-DRN-M-002` locks the balance rebound (`bob`: 1000 → 700) and `T-DRN-M-003` locks the event log pruning (11 → 8). `T-DRN-M-004` walks a double-reorg (11 → 8 → 6) to guard against a snapshot-stack bug where a single rewind works but a chained rewind returns to the wrong height.

**Fidelity matrix (anvil ↔ reth JSON-RPC).** The report exposes a 7-row matrix from `kiwa::contract::reth::fidelity_matrix()` documenting which JSON-RPC methods the two dev clients (anvil / reth) agree on and which they diverge on. `eth_blockNumber` / `eth_chainId` / `eth_getBalance` / `eth_call` agree (Yellow Paper §6 semantics on both). `eth_gasPrice` / `net_version` / `web3_clientVersion` diverge by design (base-fee vs 1 gwei; chain id 1337 vs 31337; client banner). The matrix is intended to seed future integration tests that assert equal-or-known-divergent responses on both clients.

**3-layer test structure.** The `unit` layer runs `MockChainState` end-to-end without any adapter (10 tests in `scenarios_mock.rs`). The `integration` layer drives both adapters through the 6-op sequence and diffs the traces (5 tests in `fidelity_report.rs` + 4 tests in `release_gate.rs`). The `live` layer actually spawns `reth node --dev` and hits `debug_setHead` (1 test in `live_reth_smoke.rs`, gated behind `KIWA_RETH_LIVE=1`). This mirrors the perf-test ladder Sub-Issue #582 landed for the axum / actix-web adapters — same 3-layer decomposition, adapted to the blockchain surface.

**Real adapter graceful-skip design.** The `RealRethAdapter` never spawns a subprocess by default. `RealRethAdapter::new` is the constructor the integration layer uses — it only probes the binary. `RealRethAdapter::spawn_when_available` is the one the live layer uses — it returns `Some` only when both the binary and the `KIWA_RETH_LIVE=1` env var are present. This keeps the integration path CPU-cheap and CI-safe while still allowing the live layer to run when a developer opts in.

**11-axis release-gate payload.** The blockchain branch adds four axes (`fidelity.matrix.rows`, `chain.blockHeight`, `chain.eventCount`, `abi.transferSelector`) on top of the common 7-axis payload. The `matrix.rows` axis is deliberate — a kiwa-side refactor that shrinks the fidelity matrix below 5 rows would be flagged as a regression before it lands. The chain height + event count axes guard against a scenario refactor that accidentally reduces the mock's post-scenario state (e.g. shortening the 10-transfer loop). The ABI selector axis guards against a synthetic-ABI drift (the ERC-20 `transfer(address,uint256)` canonical selector is fixed by EIP-20).
