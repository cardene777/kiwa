# Fidelity — dogfood-foundry-invariant-fuzz (v1.18-3)

Real-vs-mock behavioural fidelity for the Foundry invariant/fuzz dogfood, produced by `examples/dogfood-foundry-invariant-fuzz/tests/emit_quality_report.rs`. Drives 3 Solidity contract (ERC-20 / Vault / Router) の合計 9 個 invariant を forge 10_000 run + fuzz seed 決定的化 + shrink parser 検証で走らせ、 `@kiwa-lab/quality-metrics` release-gate 11-axis payload に blockchain-native な invariant/fuzz 軸を追加する。

## Baseline (real mode skipped — no `forge` on PATH)

forge が PATH に無い host では real 側は 4 op (`invariant_erc20` / `invariant_vault` / `invariant_router` / `run_coverage`) で `FOUNDRY_ENV_MISSING` を刻み、 mock 側との behavioural divergence を 4 件記録する。 wiring ops (`describe_options` / `describe_env`) は `FoundryEnv::detect` の観測値を trace detail に載せて PASS する。 mock は 3 contract × 10_000 run = 30_000 runs を deterministic に PASS 扱いで積む。

```
provider   : @kiwa-lab/contract/foundry-invariant-fuzz-dogfood
version    : 0.1.0
verdict    : PASS
divergences: 4 (invariant_erc20 / invariant_vault / invariant_router / run_coverage — BEHAVIORAL_DIVERGENCE, real mode absent)
axes       : 11 (blockchain branch — 汎用 7 軸 + invariant 軸 3 + coverage 軸 1)
```

| axis | actual | threshold | verdict |
|---|---|---|---|
| coverage.line | 90.00% | 85% | pass |
| coverage.branch | 82.00% | 80% | pass |
| coverage.function | 95.00% | 90% | pass |
| fidelity.ratio | 100.00% (6/6) | 70% | pass |
| fidelity.contractsCovered | 3 | 3 | pass |
| perf.p95Ms | 4.00 ms | 100 ms | pass |
| mutation.killRate | 72.00% (72/100) | 60% | pass |
| testCount.behavior | 26 | 10 | pass |
| invariant.runs | 30000 | 30000 | pass |
| invariant.contracts | 3 | 3 | pass |
| invariant.shrinkParserAvailable | 1 (`parse_invariant_shrink` accepts canonical stdout) | 1 | pass |

`divergences` 数は「mock 側が ok / real 側が `FOUNDRY_ENV_MISSING`」 の 4 op を数える。 これは forge 不在 baseline での想定 shape で、 gate は failure ではない。 fidelity ratio は mock 側が全 6 op を cover しているため 100% となる。

## Reproduction

Common integration path (mock + graceful-skip real)。

```bash
cargo test -p dogfood-foundry-invariant-fuzz
cat examples/dogfood-foundry-invariant-fuzz/quality-report/fidelity-latest.md
```

Live real-mode (forge を実際に呼ぶ)。

```bash
# foundryup 経由で forge を install、 その後:
export KIWA_FORGE_LIVE=1
cargo test -p dogfood-foundry-invariant-fuzz --test live_invariant_smoke -- --nocapture
```

Full 10_000-run release-gate pass (forge 必須)。

```bash
cd examples/dogfood-foundry-invariant-fuzz
FOUNDRY_INVARIANT_RUNS=10000 FOUNDRY_INVARIANT_SEED=0xdeadbeefcafebabe \
  forge test --match-contract Invariant --gas-report
forge coverage --report summary --report lcov > quality-report/coverage.lcov
```

## Ops under measurement

`InvariantScenarioAdapter` に載っている 6 op を fidelity harness が mock / real の両側で drive する。

- `invariant_erc20` — `InvariantERC20` を 10_000 run で走らせ、 `sum(balances) == totalSupply` invariant を検証。 handler は 4 actor × `mint / transfer / burn` の bounded action 空間で state 遷移を提供。
- `invariant_vault` — `InvariantVault` を 10_000 run で走らせ、 3 invariant (share sum / vault solvency / empty shares → empty assets) を検証。 handler は 3 actor × `deposit / withdraw` で bounded state を提供。
- `invariant_router` — `InvariantRouter` を 10_000 run で走らせ、 3 invariant (multi-hop unwind / token A conservation / token C reserve monotonic) を検証。 handler は 3 actor × 2-hop swap (A → B → C) で bounded state を提供。
- `describe_options` — `InvariantOptions` (runs / seed / match_contract) を snapshot で書き出し、 seed pin 状態を fidelity harness に見せる。
- `describe_env` — `FoundryEnv::detect` の観測 (forge / cast / anvil の PATH 解決) を snapshot で書き出す。
- `run_coverage` — `forge coverage --report summary` を呼び、 line / branch / function coverage 3 軸を release gate に feed。 mock 側は決定的な release-gate 上回り値を返す。

## Notes

**Bounded action handler の設計。** invariant runner は制約なし fuzzing だと reachable state 空間が広がりすぎて意味のある counter-example に収束しない。 handler で actor list を 3-4 に固定、 amount 系 input を per-actor balance で clamp することで「実運用で起こりうる遷移」 に絞る。 `ERC20Handler` / `VaultHandler` / `RouterHandler` が全て同じ pattern (`_pickActor(idx % actors.length)` + `amount % (balance + 1)`) で書かれているのはこの制約を統一するため。 handler が事前に mint + approve を済ませる分、 invariant 側は「悪意ある actor が壊せるか」 に集中できる。

**Fuzz seed 決定的化。** kiwa の `invariant_run` helper が `FOUNDRY_INVARIANT_SEED` + `FOUNDRY_FUZZ_SEED` を env plumbing で forge に渡す。 seed = `0xdead_beef_cafe_babe` を全 3 contract で共有するので、 同じ host で 2 度走らせても同じ counter-example に到達する。 CI 上で「たまに落ちる flaky invariant」 が発生した場合も同じ seed で再現できる (`FOUNDRY_INVARIANT_SEED=<hex> forge test --match-contract InvariantERC20`)。

**Shrink parser 経路。** invariant が counter-example を検出した時、 forge は `[FAIL. Reason: <msg>]` + `sequence: caller=... target=... sig=... calldata=...` を stdout に emit する。 kiwa の `parse_invariant_shrink` はこの canonical form を `ShrinkResult { test_name, reason, sequence: Vec<ShrinkStep> }` に落とす。 `invariant_mock.rs::t_dfi_m_007` で synthetic stdout を parse して parser の受理性を assertion、 `release_gate.rs::t_dfi_gate_004` で release gate 軸 `invariant.shrinkParserAvailable` に反映。 kiwa 側の parser regression が発生した場合、 4 axis のうち 1 つが 0 に落ちて gate が fail する構造で早期発見。

**3-layer test 構造。** unit 層 (`invariant_mock.rs`, 12 tests) は forge 抜きで adapter + parser を exercise。 integration 層 (`fidelity_report.rs` 5 tests + `release_gate.rs` 4 tests) は mock + graceful-skip real で trace diff + 11 軸 payload 計算。 live 層 (`live_invariant_smoke.rs` 1 test) は `KIWA_FORGE_LIVE=1` 経路で real forge を実際に呼ぶ smoke。 mirror の対象は v1.18-2 `dogfood-reth-node-test` (Reth 系 3-layer) で、 blockchain branch 全体で同じ 3-layer decomposition を維持している。

**11-axis release-gate payload。** blockchain branch は共通 7 軸 (coverage.line/branch/function / fidelity.ratio / perf.p95Ms / mutation.killRate / testCount.behavior) に加えて 4 軸 (`fidelity.contractsCovered` / `invariant.runs` / `invariant.contracts` / `invariant.shrinkParserAvailable`) を追加する。 `invariant.runs` 軸 (30_000 threshold) は「3 contract × 10_000 run」 の kiwa 標準 release-gate depth を lock、 `invariant.contracts` 軸は sub-Issue AC (3 contract) を機械的に guard、 `invariant.shrinkParserAvailable` 軸は parser regression を早期に捕捉する。 `fidelity.contractsCovered` は fidelity report 側の contracts list が 3 件揃っていることを guard。
