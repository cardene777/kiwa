# dogfood-dapp-e2e-reorg

Dogfood app (v1.18-4) — Next.js 15 + viem + wagmi ERC-20 UI driven through `@kiwa-lab/dapp` (kiwa-play) fixtures under anvil fork mainnet + reorg simulation. Four reorg scenarios (pending / balance rollback / event history / nonce gap) exercised through a provider-neutral adapter shape so the fidelity harness diffs mock vs real on the same call surface.

## Layout

```
package.json                        -- Next.js 15 + wagmi + Playwright + Vitest
foundry.toml                        -- Foundry project descriptor (contracts/forge-out)
contracts/ReorgToken.sol            -- minimal ERC-20 used by the harness
app/
  layout.tsx / providers.tsx        -- RainbowKit + wagmi + react-query wiring
  page.tsx                          -- ERC-20 transfer UI + Transfer event history
lib/wagmi.ts                        -- anvil chain config + ReorgToken ABI + wagmi injector
src/
  adapters/interface.ts             -- provider-neutral ReorgAdapter contract + 4 ops
  adapters/mock.ts                  -- MockChainState (snapshot / revert / mempool / logs)
  adapters/real.ts                  -- env-skip (TESTNET_RPC_URL) + live-not-implemented variant
  flows/scenarios.ts                -- runAllScenarios walks all 4 ops
  flows/fidelity.ts                 -- runFidelityHarness + emitMarkdown / emitJson + 11-axis release gate
scripts/emit-fidelity-report.ts     -- writes quality-report/fidelity-latest.{md,json}
tests/
  unit/mock-scenarios.test.ts       -- 10 mock adapter tests
  unit/real-adapter.test.ts         -- 7 env-skip variant tests
  unit/fidelity-report.test.ts      -- 9 fidelity harness tests
  unit/release-gate.test.ts         -- 6 release-gate 11-axis contract tests
  e2e/reorg-4scenario.spec.ts       -- 5 Playwright specs (warmup + 4 reorg scenarios)
  fixture.ts / prepare-env.ts       -- @kiwa-lab/dapp fixture + prepare-env glue
  global-setup.ts / global-teardown.ts
```

## 3-layer test structure

- **unit** — `MockChainState` + adapters walked entirely in-process by Vitest (32 tests). Deterministic on every host. Tests in `tests/unit/`.
- **integration** — Next.js dev + wagmi + anvil fork mainnet driven by Playwright (5 specs). Boots the anvil chain, deploys `ReorgToken`, exercises the transfer UI, then reverts via `evm_snapshot` / `evm_revert`. Tests in `tests/e2e/`.
- **live** — opt-in through `TESTNET_RPC_URL` (Sepolia). Records `REORG_LIVE_NOT_IMPLEMENTED` in v0.1 — a follow-up driver behind the same env-detect logic will land the actual Sepolia round-trip.

## Adapters

- `makeMockAdapter` — never touches the network. Every scenario mutates a shared `MockChainState` (block height + balances map + nonces map + Transfer log list + snapshot stack + mempool map). `revert` walks the snapshot stack back to a saved id so the balance sheet + event log + nonce + mempool all roll back atomically.
- `makeRealAdapter` — probes `TESTNET_RPC_URL`. Ships two variants: `skipped` (env unset, throws `SkippedError` with `REORG_REAL_ENV_MISSING`) and `live-not-implemented` (env set, throws `SkippedError` with `REORG_LIVE_NOT_IMPLEMENTED`). Both record traces so the fidelity harness observes the divergence.

## Run

Unit tests + fidelity report.

```bash
pnpm -F examples-dogfood-dapp-e2e-reorg test
pnpm -F examples-dogfood-dapp-e2e-reorg fidelity:report
cat examples/dogfood-dapp-e2e-reorg/quality-report/fidelity-latest.md
```

Playwright e2e (Next.js dev + anvil fork).

```bash
pnpm -F examples-dogfood-dapp-e2e-reorg forge:build
pnpm -F examples-dogfood-dapp-e2e-reorg test:e2e
```

Live real-mode (Sepolia, env-skip).

```bash
export TESTNET_RPC_URL=https://sepolia.infura.io/v3/<your-key>
pnpm -F examples-dogfood-dapp-e2e-reorg fidelity:report
```

## Related

- v1.18-1 `kiwa-test-rs v0.5` — the `contract::reth` / `contract::foundry` / `contract::alloy` Rust surface (this dogfood is the TypeScript peer, feeds the same 11-axis payload).
- v1.18-2 `dogfood-reth-node-test` — Rust dogfood (real vs mock, same JSON schema).
- v1.18-3 `dogfood-foundry-invariant-fuzz` — Rust invariant / fuzz dogfood.
- v1.11-4 `dogfood-foundry-dapp` — the trace / adapter / fidelity report shape this dogfood mirrors.
- Milestone parent [#792](https://github.com/cardene777/kiwa/issues/792), this sub [#796](https://github.com/cardene777/kiwa/issues/796).
