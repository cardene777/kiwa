# Blockchain testing — chain state / EL client integration / fuzz shrinker / reorg semantics (SSOT)

> **Three of the four axes have no implementation.** #1864 removed the Rust harness, so every `kiwa::contract::*` type and every `cargo` command below describes what v1.18 shipped rather than what is installable now. Axis 4 (reorg) is TypeScript and still runs — see [`@kiwa-lab/dapp`](../libraries/foundation/dapp/) and [Tutorial 27](../tutorials/27-dapp-e2e-reorg). The semantics the other three record are kept because they are what a replacement has to reproduce; see § Test count baseline for where each stands.

kiwa's v1.10 `kiwa::contract::foundry` + `kiwa::contract::alloy` covered the "compile a contract, spawn anvil, drive JSON-RPC" case. v1.18 adds four axes on top of that base — the ones production dApp teams hit once their `forge test` suite is green but production still breaks. This concept doc is the SSOT for those four axes; the tutorials and dogfood apps are the concrete implementations.

## Axis 1 — Chain state simulation

Real chains are stateful. Every test that mutates the chain leaks state into the next test unless the harness explicitly rewinds. anvil ships `evm_snapshot` / `evm_revert` for exactly this reason, and reth's `debug_setHead` covers the same shape with block-depth granularity.

kiwa surfaces the pattern in three places.

- `@kiwa-lab/dapp` — `snapshotChain(client)` / `revertChain(client, snapshotId)` wrap the raw JSON-RPC calls through the viem `PublicClient` request path, returning the typed `Hex` snapshot id and anvil's boolean revert response.
- `kiwa::contract::foundry` — `Anvil::spawn(port)` returns a `Drop`-terminated handle so shell panics do not leak anvil processes.
- `kiwa::contract::reth` — `RethNode::spawn_dev(port)` mirrors the `Anvil` handle. `reth_reorg(endpoint, blocks)` drives `debug_setHead` for depth-N rewinds.

The **contract** each harness enforces is symmetric — every `snapshot` returns an id, every `revert` consumes one, and downstream operations observe the pre-snapshot state after revert. Mock adapters (`MockChainState`) implement the same shape so a fidelity harness can diff mock vs real on the same 6-op trace.

### Why chain state matters more than fresh anvil

The classic pattern "`beforeEach` restarts anvil" costs 500 ms per test and hides one important class of bug — state accumulated by test N + 1 that only reproduces because test N left it behind. `snapshot` / `revert` isolates state without paying the boot cost, and — critically — makes leaked state observable when a downstream test starts asserting on a value the previous test wrote.

## Axis 2 — Execution-layer client integration

Ethereum has multiple production EL clients — geth, nethermind, besu, erigon, reth. kiwa consumers who want release-gate confidence run the same JSON-RPC calls against two clients and diff. The v0.4 baseline covered anvil (Foundry's Rust dev EL). v0.5 adds reth (Paradigm's Rust production EL, dev mode).

The **`FidelityCase` matrix** is how kiwa records the divergence contract.

```rust
pub struct FidelityCase {
    pub method: String,           // eth_blockNumber / eth_gasPrice / …
    pub params_json: String,      // "[]" or serialized JSON
    pub expected_agreement: bool, // true = clients must agree, false = divergence-by-design
    pub rationale: String,        // human-readable — surfaces in test failures
}
```

The `fidelity_matrix()` function in `kiwa::contract::reth` ships 7 canonical rows.

| Method | Agreement | Rationale |
|---|---|---|
| `eth_blockNumber` | agree | Both dev modes emit 1 block/s |
| `eth_chainId` | agree | Fixed defaults per client |
| `eth_getBalance` | agree | Zero for non-existent accounts (Yellow Paper §6) |
| `eth_call` | agree | Empty call to zero address returns 0x |
| `eth_gasPrice` | diverge | anvil defaults to 1 gwei, reth follows EIP-1559 base fee |
| `net_version` | diverge | anvil returns 31337, reth dev returns 1337 |
| `web3_clientVersion` | diverge | Banner strings differ by design |

When a downstream harness catches a *new* divergence (a row that used to agree stops agreeing), the test failure surfaces the `rationale` so reviewers know why the row was on the matrix in the first place. This is the same shape the observability v2 axes use — the assertion carries its own explanation.

## Axis 3 — Fuzz shrinker semantics

`forge test` runs unit tests that pick primitive inputs deterministically. `forge test --match-contract Invariant*` runs Foundry's state-explorer that walks the target contract set with random handlers until it finds a counter-example or the run budget elapses.

The **shrinker** is what makes invariant tests useful. When the state-explorer finds a break at run 4 823 with a 47-step sequence, Foundry shrinks the sequence until it cannot remove another step without losing the counter-example. The `[FAIL. Reason: …]` header + `sequence:` stanza is what teams paste into a bug report.

kiwa's `kiwa::contract::foundry::invariant` surfaces the shrink as a structured `ShrinkResult`.

```rust
pub struct ShrinkResult {
    pub test_name: String,                // invariant_totalSupplyEqSumOfBalances
    pub reason: String,                   // "Assertion failed"
    pub sequence: Vec<ShrinkStep>,        // ordered (target, sig, calldata)
}

pub struct ShrinkStep {
    pub target: String,     // contract address
    pub signature: String,  // transfer(address,uint256)
    pub calldata: String,   // 0x-prefixed ABI-encoded blob
}
```

Three properties are load-bearing.

- **Determinism via `FOUNDRY_INVARIANT_SEED` + `FOUNDRY_FUZZ_SEED`.** Every run visits the same state graph. Same seed → same shrink. Different seed → different shrink but both are valid counter-examples.
- **Env plumbing beats config mutation.** `foundry.toml` `[invariant]` fields would race under parallel test invocations. Env vars are per-process, so parallel `cargo test` workers stay isolated.
- **Structured output beats stdout scrape.** `parse_invariant_shrink(stdout)` is exposed as a pure function so tests can exercise the parser without spawning `forge`, and downstream tools can format the shrink for a code-review comment without re-parsing.

### 256 vs 10 000 runs — when to bump the budget

Foundry defaults to 256 runs per invariant. kiwa release-gate suites use 10 000. The empirical break-even is around 5 000 runs — below that, the state-explorer routinely misses depth-8 sequences that only surface once every 3 000 seeds. Above 10 000 the marginal cost per bug outweighs the compute budget on most CI runners.

For a scratch branch exploring a new invariant, 256 runs is fine. For a release-gate PR that promotes an invariant into the 11-axis fidelity report, 10 000 is the SSOT default — that budget is what `InvariantOptions::default()` returns.

## Axis 4 — Reorg semantics

Production Ethereum finality is not instant. `Transaction confirmed` is a lie the wagmi + viem UI tells you at 1 confirmation; a 3-block reorg can un-confirm it. Four failure modes cover the bulk of production bugs.

| Scenario | Trigger | Bug it catches |
|---|---|---|
| **Pending tx dropped** | Snapshot before submit → revert before mine | Tx status stuck on `pending` when the mempool entry is gone |
| **Confirmed tx balance rollback** | Snapshot before submit → mine → revert past confirmation | UI keeps showing the post-transfer balance |
| **Transfer event history disappears** | Mine N transfers → revert past all N | UI does not refetch and shows stale rows |
| **Nonce gap re-send** | Snapshot → mine → revert → re-submit at same nonce | Wallet reports `nonce too low` because the local cache leaks |

kiwa records each scenario as a `ReorgOp` in the `dogfood-dapp-e2e-reorg` interface.

```ts
export type ReorgOp =
  | 'pendingTx'
  | 'confirmedTx'
  | 'transferEvent'
  | 'nonceGap';
```

`MockChainState` implements the same 4 ops through an in-process snapshot stack, so a test suite that walks all four ops against the mock produces the same trace shape as one walking them against a live anvil fork. The **fidelity ratio** the release gate reads is the fraction of ops where the two traces agree — 1.0 means the mock reproduces the real chain, 0.0 means the mock lies. Anything below 0.7 fails the release gate.

### `evm_revert` vs `debug_setHead` — same semantics, two surfaces

anvil ships `evm_snapshot` / `evm_revert` — a snapshot id acts as a bookmark. reth ships `debug_setHead` — a block hash argument names the target. Both roll back the chain state, but anvil's contract is *revert to a marker* while reth's is *rewind by N blocks*.

The `@kiwa-lab/dapp` reorg helpers (`snapshotChain` / `revertChain`) target anvil first because Foundry ships the primitive as a first-class RPC method. The `kiwa::contract::reth::reth_reorg` helper covers `debug_setHead` for the Rust-side fidelity report. When a downstream consumer wants to walk both, the adapter contract stays open — the `ReorgAdapter` interface accepts either primitive as long as the 4-op observable behaviour matches.

## Assertion patterns

The 4 axes produce three assertion patterns.

- **Trace assertions** — every op emits a `TraceEvent` (`ok: boolean` + `errorKind: string`), and the assertion is `expect(traces.filter(e => e.op === 'confirmedTx')).toHaveLength(1)`. This catches "the mock silently returned success instead of the divergence trace".
- **Snapshot-symmetric assertions** — every `snapshotChain` matches a `revertChain`. The assertion is `expect(await rpc.getBalance(RECIPIENT)).toBe(preSnapshotBalance)`. Missing revert → leaked state → downstream test fails on an unrelated value.
- **Fidelity ratio assertions** — the release gate reads `fidelity.ratio >= 0.7`. Below the threshold the deploy is blocked. Above it the mock is trusted enough to run in unit-test frequency.

All three patterns are pure — they add no runtime overhead beyond the RPC call. The test grows one function call per assertion and gains a machine-verifiable contract.

## Test count baseline

#1864 removed the Rust harness, which drove axes 1 – 3. What remains is the TypeScript side.

- Axis 4 (reorg) — `dogfood-dapp-e2e-reorg/tests/e2e/reorg-4scenario.spec.ts` × 5 (1 warmup + 4 scenarios) + `dogfood-dapp-e2e-reorg/tests/unit/fidelity-report.test.ts` × 9 = **14 tests**

Axes 1 – 3 have no driver at present. The Solidity contracts and the Foundry configuration for
`dogfood-foundry-dapp` and `dogfood-foundry-invariant-fuzz` are still in the repository; driving
them from Foundry directly is open work.

## References

- [Tutorial 27 — dApp e2e reorg](../tutorials/27-dapp-e2e-reorg)
- [Migration v1.17 → v1.18](../migrations/v1.17-to-v1.18)
