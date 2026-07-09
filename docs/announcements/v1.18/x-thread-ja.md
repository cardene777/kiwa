1/ kiwa v1.18 released。 Blockchain 深化 milestone です。 v1.17 (Observability v2 縦軸、 Grafana + AlertManager + trace flame + log correlation) の後、 v1.18 は Rust blockchain testing stack (Reth (Rust EL client) + Foundry-rs invariant / fuzz + Alloy encoder helpers + dApp e2e reorg) を 1 統一 harness に land しました。

2/ `kiwa-test-rs` v0.5 (v0.4.2 からの minor bump) — v0.4 で land した `kiwa::contract::foundry` + `kiwa::contract::alloy` 基盤に、 3 追加軸を land。 v0.4 の source 互換性は 100% 維持 (`foundry.rs` → `foundry/mod.rs` / `alloy.rs` → `alloy/mod.rs` の module 再編は行うが、 全 public re-export path は不変、 `use kiwa::contract::foundry::FoundryEnv;` を触る必要なし)。

3/ `kiwa::contract::reth` — feature `contract-reth` (default OFF) 配下の new module。 `RethBinary::detect` で reth CLI の PATH 存在確認 + `RethNode::spawn` で `reth node --dev` の subprocess spawn + `Drop`-based tear-down + `reth_reorg(endpoint, blocks)` で `debug_setHead` JSON-RPC 経由の N-block reorg + `fidelity_matrix()` で anvil ↔ reth の 7 JSON-RPC method 期待突合。 pure Rust、 alloy crate family 依存なし。

4/ `kiwa::contract::foundry::invariant` — `contract-foundry` feature 配下の new submodule。 forge invariant runner の 10_000 run gate + fuzz seed 決定的化 (`FOUNDRY_INVARIANT_SEED` env + Cargo.toml row) + counter-example shrink parser (`InvariantCounterExample { calls, revert }`) + `coverage_feed()` で lcov を 7 軸 release gate JSON に変換。

5/ `kiwa::contract::alloy::helpers` — `contract-alloy` feature 配下の new submodule。 `Eip712TypedData::build(domain, primary_type, message)` で EIP-712 の 4 layer digest (domain separator + typeHash + structHash + digest) + `Multicall3::encode(calls)` で `aggregate3(Call3[])` calldata (N call を 1 tx に集約) + `Permit2::permit_witness_transfer_from(spec)` で SignatureTransfer + witness verify。 pure Rust、 alloy crate 依存なし。

6/ dogfood app 3 種 — `dogfood-reth-node-test` (Reth NodeBuilder dev chain + alloy Provider ERC-20 drive + 3-block reorg × fidelity harness、 32 cargo test)、 `dogfood-foundry-invariant-fuzz` (ERC-20 + Vault + Router × invariant 10_000 run + fuzz seed 決定的化 + shrink parser 検証 + coverage feed、 21 cargo test)、 `dogfood-dapp-e2e-reorg` (Next.js 15 + viem + wagmi + `@kiwa-lab/dapp` reorg fixture + anvil fork mainnet + 4 reorg scenario、 26 Playwright test)。 全 3 app が 7 軸 release gate PASS。

7/ `@kiwa-lab/dapp` reorg helper — 2 new named export `snapshotChain(client)` + `revertChain(client, snapshotId)` (`anvil_snapshot` + `anvil_revert` の JSON-RPC 経由 wrap)。 reorg dogfood app + tutorial 27 が 1 `import` で共有。 package version は変更なし。

8/ docs — tutorial 3 本 (25 Reth / 26 Foundry invariant / 27 dApp reorg) + additive migration v1.17 → v1.18 + concept doc `blockchain-testing.md` (chain state / EL client integration / fuzz shrinker / reorg semantics の 4 追加軸 × 6 semantic axis SSOT)。 VitePress sidebar + gh-pages 反映済。 Roadmap: https://github.com/cardene777/kiwa#roadmap — v1.11 → v1.12 → v1.13 → v1.14 → v1.15 → v1.16 → v1.17 → v1.18 の 8 milestone 連続完遂。
