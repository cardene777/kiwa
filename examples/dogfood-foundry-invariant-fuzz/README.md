# dogfood-foundry-invariant-fuzz

Dogfood app (v1.18-3) — 3 Solidity contract (ERC-20 / Vault / Router) の Foundry invariant/fuzz drive を `kiwa-test-rs::contract::foundry::invariant` で 10_000 run + fuzz seed 決定的化 + shrink result assertion + coverage feed する harness。 `forge` が PATH に無い host でも graceful skip して trace に `FOUNDRY_ENV_MISSING` を刻み、 release gate は mock 側で 11 軸 pass を計算する。

## Layout

```
Cargo.toml                        -- Rust crate manifest (workspace member)
foundry.toml                      -- Foundry profile + [invariant] / [fuzz] budget
contracts/
  ERC20.sol                       -- mint + burn + transfer + approve + transferFrom
  Vault.sol                       -- deposit + withdraw + share accounting
  Router.sol                      -- multi-hop swap (A -> B -> C, 2 rates)
test/
  invariant/
    InvariantERC20.t.sol          -- sum(balances) == totalSupply
    InvariantVault.t.sol          -- vault solvency + share conservation
    InvariantRouter.t.sol         -- token conservation + reserve monotonicity
src/
  lib.rs                          -- kiwa 4 adapter (mock + real + trace + fidelity)
tests/
  invariant_mock.rs               -- 12 mock-mode unit tests
  fidelity_report.rs              -- 5 fidelity harness tests
  release_gate.rs                 -- 4 release-gate 11-axis tests
  emit_quality_report.rs          -- writes quality-report/fidelity-latest.{md,json}
  live_invariant_smoke.rs         -- live-mode smoke (KIWA_FORGE_LIVE=1 opt-in)
```

## 3-layer test structure

- **unit** — `MockInvariantAdapter` + `parse_synthetic_shrink` の parser を forge 抜きで exercise する層。 決定的で全ホスト共通、 `tests/invariant_mock.rs` (12 tests)。
- **integration** — `MockInvariantAdapter` と `RealInvariantAdapter` を同じ 6 op で drive し、 fidelity harness で trace を diff。 forge 不在時は real 側が `FOUNDRY_ENV_MISSING` を刻み、 mock 側との behavioural divergence を 4 op ぶん記録する。 `tests/fidelity_report.rs` (5 tests) + `tests/release_gate.rs` (4 tests)。
- **live** — real forge を実際に呼ぶ smoke 層。 `KIWA_FORGE_LIVE=1` + `forge` on PATH 両方揃った時のみ実行、 それ以外は skip message を出して抜ける。 `tests/live_invariant_smoke.rs` (1 test)。

## Invariants

3 contract × 3 invariant で合計 9 個。 各 handler は bounded action driver として forge invariant runner に食わせる。

### `InvariantERC20`

- `invariant_totalSupplyEqSumOfBalances` — 4 actor の balance 合計は常に `totalSupply` に一致する
- `invariant_totalSupplyMatchesMintMinusBurn` — handler が刻んだ `totalMinted - totalBurned` は `totalSupply` に一致する

### `InvariantVault`

- `invariant_totalSharesEqSumOfActorShares` — 3 actor の share 合計は常に `totalShares` に一致する
- `invariant_vaultBalanceMatchesTotalAssets` — vault が物理的に保持する ERC-20 balance は `totalAssets` accounting field に一致する (solvency lock)
- `invariant_emptySharesImpliesEmptyAssets` — `totalShares == 0` の時 `totalAssets == 0` (dust 蓄積の禁止)

### `InvariantRouter`

- `invariant_routerHoldsSeededTokenBReserve` — router は intermediate token B を保持し続けない (multi-hop unwind 検証)
- `invariant_tokenAConservationAcrossActors` — 全 actor + router が保持する token A の総量は初期 supply に一致する
- `invariant_routerCReserveOnlyDecreases` — token C の router reserve は初期 seed を超えない (mint 禁止)

## Run

```bash
# Common — mock + graceful-skip real (forge unavailable path).
cargo test -p dogfood-foundry-invariant-fuzz
cat examples/dogfood-foundry-invariant-fuzz/quality-report/fidelity-latest.md
```

Live layer (spawns forge, requires `forge` on PATH).

```bash
# Install foundry via foundryup, then:
export KIWA_FORGE_LIVE=1
cargo test -p dogfood-foundry-invariant-fuzz --test live_invariant_smoke -- --nocapture
```

Full 10_000-run release-gate pass (forge required).

```bash
# 3 invariant contract を順に走らせる。 kiwa harness が
# FOUNDRY_INVARIANT_RUNS=10000 + FOUNDRY_INVARIANT_SEED=0xdeadbeefcafebabe を
# env に設定するので、 決定的な shrink result が期待できる。
cd examples/dogfood-foundry-invariant-fuzz
FOUNDRY_INVARIANT_RUNS=10000 FOUNDRY_INVARIANT_SEED=0xdeadbeefcafebabe \
  forge test --match-contract Invariant --gas-report
forge coverage --report summary --report lcov > quality-report/coverage.lcov
```

## Fuzz seed 決定的化

`InvariantOptions::seed = Some(0xdead_beef_cafe_babe)` を全 3 contract で pin。 kiwa harness が `FOUNDRY_INVARIANT_SEED` + `FOUNDRY_FUZZ_SEED` を env plumbing で forge に渡すため、 同じ host で 2 度走らせても同じ shrink 結果に到達する。 shrink parser (`kiwa::contract::foundry::invariant::parse_invariant_shrink`) は `[FAIL. Reason: ...]` header + `sequence: caller=... target=... sig=... calldata=...` の canonical 形式を受理し、 `ShrinkResult` に落とす。 `invariant_mock.rs::t_dfi_m_007` で synthetic stdout を parse して parser の正しさを assertion。

## Coverage feed

`RealInvariantAdapter::run_coverage` で `forge coverage --report summary --report lcov` を呼び、 kiwa の `CoverageReport::line_coverage_pct` / `branch_coverage_pct` / `function_coverage_pct` に落として release gate に feed する。 mock 側は `line 90 / branch 82 / function 95` の release-gate 閾値を上回る値を deterministic に返す。

## Related

- v1.18-1 `kiwa::contract::foundry::invariant` (feature `contract-foundry`) — `InvariantOptions` / `InvariantRunReport` / `parse_invariant_shrink` の実装元
- v1.11-4 `dogfood-foundry-dapp` — Foundry adapter shape を確立した先行 dogfood
- v1.18-2 `dogfood-reth-node-test` — 同 v1.18 milestone の Reth 系 dogfood
- v1.18 milestone parent [#792](https://github.com/cardene777/kiwa/issues/792), this sub [#795](https://github.com/cardene777/kiwa/issues/795)
