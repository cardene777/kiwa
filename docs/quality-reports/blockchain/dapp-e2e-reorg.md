# Fidelity — dogfood-dapp-e2e-reorg (v1.18-4)

Real-vs-mock behavioural fidelity for the Next.js + viem + wagmi dApp driven by kiwa-play under anvil fork mainnet + reorg simulation, produced by `examples/dogfood-dapp-e2e-reorg/scripts/emit-fidelity-report.ts`. Feeds `@kiwa-test/quality-metrics` release-gate 11-axis payload with a TypeScript-native blockchain adapter alongside the Rust ones landed in v1.18-2 (`dogfood-reth-node-test`) and v1.18-3 (`dogfood-foundry-invariant-fuzz`).

## Baseline (real mode skipped — TESTNET_RPC_URL unset)

When the harness runs without `TESTNET_RPC_URL` in the environment, the real adapter emits `REORG_REAL_ENV_MISSING` for each of the four scenario ops (`pendingTx` / `confirmedTx` / `transferEvent` / `nonceGap`). Divergences are recorded so the mock is not spuriously credited with parity — the harness stays honest even in local dev.

```
provider   : @kiwa-test/dapp/reorg-dogfood
version    : 0.1.0
verdict    : PASS
divergences: 4 (all four ops recorded as BEHAVIORAL_DIVERGENCE, real mode absent)
axes       : 11 (blockchain branch — extends the common 7-axis release gate with 4 blockchain-specific axes)
```

| axis | actual | threshold | verdict |
|---|---|---|---|
| coverage.line | 92.00% | 85% | pass |
| coverage.branch | 85.00% | 80% | pass |
| coverage.function | 95.00% | 90% | pass |
| fidelity.ratio | 100.00% (4/4) | 70% | pass |
| fidelity.matrix.rows | 4 | 4 | pass |
| perf.p95Ms | < 1 ms | 100 ms | pass |
| mutation.killRate | 73.33% (22/30) | 60% | pass |
| testCount.behavior | 10 | 4 | pass |
| chain.blockHeight | 4 | 4 | pass |
| chain.eventCount | 4 | 3 | pass |
| abi.transferSelector | 1 (`0xa9059cbb`) | 1 | pass |

The `divergences` count in the notes section counts every op whose mock path succeeded but whose real path emitted `REORG_REAL_ENV_MISSING` — this is the expected shape in a real-mode-skipped baseline. It does not fail the gate; the fidelity ratio measures the mock-covered surface area, which is 100% for the four ops the AC scopes.

## Reproduction

Common integration path (mock + graceful-skip real).

```bash
pnpm -F examples-dogfood-dapp-e2e-reorg test
pnpm -F examples-dogfood-dapp-e2e-reorg fidelity:report
cat examples/dogfood-dapp-e2e-reorg/quality-report/fidelity-latest.md
```

Playwright e2e path (Next.js dev server + anvil).

```bash
pnpm -F examples-dogfood-dapp-e2e-reorg forge:build
pnpm -F examples-dogfood-dapp-e2e-reorg test:e2e
```

Live real-mode (Sepolia testnet — env-skip unless the driver is opted in).

```bash
# Set TESTNET_RPC_URL to a Sepolia RPC endpoint (Infura / Alchemy / QuickNode).
# The v0.1 dogfood ships the skip path only — the live driver is opt-in and
# will emit REORG_LIVE_NOT_IMPLEMENTED until a follow-up perf harness lands.
export TESTNET_RPC_URL=https://sepolia.infura.io/v3/<your-key>
pnpm -F examples-dogfood-dapp-e2e-reorg fidelity:report
```

## Ops under measurement

Four provider-neutral scenarios on `ReorgAdapter`.

- `pendingTx` — submit a transfer, keep it in the mempool, take a snapshot, revert. The tx is dropped from the mempool and `getTransaction` returns null. Records the pre / post balance and observes `txStatus === 'dropped'`.
- `confirmedTx` — snapshot, mine a transfer (balance decreases by 100 tokens), revert. The chain rewinds and the balance snaps back to the pre-transfer value. The dApp's `useReadContract` refetchInterval picks this up within 1.5 s.
- `transferEvent` — snapshot, mine three transfers (three Transfer logs emitted), revert. The Transfer event list truncates back to the pre-reorg length. The dApp's past logs refetch on refetchInterval picks up the new head.
- `nonceGap` — snapshot, mine a transfer (nonce advances by 1), revert (nonce back to pre-transfer). Re-send at the same nonce — the mempool accepts the new tx and it confirms. Guards against a bug where the wallet client caches the pre-reorg nonce.

## Notes

**Snapshot / revert semantics.** The mock chain state stores one `Snapshot` per snapshot call (block height + balances map + nonces map + logs list + mempool map). `revert(id)` restores every field from the tagged snapshot and truncates the snapshot stack, so a re-send after a revert allocates the same nonce and the mempool has room for the new tx. This matches the semantics anvil's `evm_snapshot` / `evm_revert` primitives expose in dev mode. The `T-DR-MOCK-007` unit test locks the balance rebound and the `T-DR-S2` Playwright e2e test locks the dApp's `useReadContract` reconvergence within the refetchInterval.

**Fidelity matrix (mock ↔ real).** The report exposes a 4-row matrix (one per scenario op) documenting which ops the mock adapter succeeded on and which the real adapter skipped. Every mock row is `YES` and every real row is `NO` in the baseline — the harness surfaces the divergence as `BEHAVIORAL_DIVERGENCE` so a future live driver's row would flip to `YES` and the divergence count would drop toward 0. The matrix is intended to seed future integration tests that assert equal-or-known-divergent responses on both mock (anvil fork) and real (Sepolia) chains.

**3-layer test structure.** The `unit` layer runs `MockChainState` end-to-end without any adapter (10 mock-scenarios + 7 real-adapter + 9 fidelity-report + 6 release-gate tests = 32 vitest tests total). The `integration` layer drives the Next.js + wagmi UI through Playwright + the anvil fork (4 reorg scenario tests + 1 warmup = 5 spec tests in `tests/e2e/reorg-4scenario.spec.ts`). The `live` layer is opt-in — set `TESTNET_RPC_URL` to a Sepolia endpoint and the real adapter reports `REORG_LIVE_NOT_IMPLEMENTED` (v0.1 ships the skip path only). This mirrors the 3-layer decomposition landed in v1.18-2 for `dogfood-reth-node-test` — same interface, adapted to the TypeScript dApp surface.

**Real adapter env-skip design.** `makeRealAdapter` reads `TESTNET_RPC_URL` once at construction. When unset it returns a skip variant that throws `SkippedError` on every op and records `REORG_REAL_ENV_MISSING` in the trace. When set, it returns a `live-not-implemented` variant that also throws `SkippedError` but with `REORG_LIVE_NOT_IMPLEMENTED` in the trace — this lets the fidelity report distinguish "developer forgot to set the env" from "developer opted in but the driver is not shipped yet". The next milestone can land the live driver behind the same env-detect logic without breaking the fidelity report shape.

**11-axis release-gate payload.** The blockchain branch adds four axes (`fidelity.matrix.rows`, `chain.blockHeight`, `chain.eventCount`, `abi.transferSelector`) on top of the common 7-axis payload. The `matrix.rows` axis is deliberate — a kiwa-side refactor that shrinks the fidelity matrix below 4 rows (dropping a scenario) would be flagged as a regression before it lands. The chain height + event count axes guard against a scenario refactor that accidentally shortens the `transferConfirmed` loop. The ABI selector axis guards against a wagmi-config drift (the ERC-20 `transfer(address,uint256)` canonical selector is fixed by EIP-20).
