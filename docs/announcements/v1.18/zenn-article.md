---
title: "kiwa v1.18 released — Blockchain 深化 (Reth + Foundry invariant/fuzz + Alloy helpers + dApp e2e reorg)"
emoji: "🌱"
type: "tech"
topics: ["oss", "rust", "solidity", "ethereum", "kiwa"]
published: true
---

# kiwa v1.18 released

v1.18 は kiwa の 8 milestone 目です。 v1.17 (Observability v2 縦軸、 `@kiwa-lab/observability` v2.0 で Grafana / AlertManager / trace flame / log correlation を統一 mock harness に land) の後、 v1.18 は 2026 dApp production team が実運用で必要な **Rust blockchain testing stack (Reth (Rust EL client) integration + Foundry-rs invariant / fuzz runner 深化 + Alloy encoder helpers (EIP-712 / Multicall3 / Permit2) + dApp e2e reorg 拡張) を 1 統一 harness に land** しました。

v1.10 で land した `kiwa::contract::foundry` + `kiwa::contract::alloy` (Rust contract layer) を基盤に、 Reth EL client + Foundry invariant / fuzz + Alloy helpers + dApp reorg の 4 追加軸を minor bump として重ねる縦軸思想です。

## 主な追加

### `kiwa-test-rs` v0.5.0 (minor bump from v0.4.2)

v0.4 の `kiwa::contract::foundry` (forge / cast / anvil subprocess + Anvil Drop cleanup) + `kiwa::contract::alloy` (SolAbi JSON parser + built-in keccak-256 selector + Signer 4 種 + Provider 3 種 + ContractCall encoding) 基盤の上に、 3 追加軸を統一 API で扱う contract test harness に発展。 v0.4 の source 互換性は 100% 維持 (`foundry.rs` → `foundry/mod.rs` / `alloy.rs` → `alloy/mod.rs` の module 再編は行うが、 全 public re-export path 不変)。

```rust
use kiwa::contract::foundry::{Anvil, FoundryEnv};        // v0.4 → v0.5 変更なし
use kiwa::contract::foundry::invariant::{InvariantEnv, InvariantCounterExample}; // v0.5 追加
use kiwa::contract::alloy::{SolAbi, Signer, keccak256};  // v0.4 → v0.5 変更なし
use kiwa::contract::alloy::helpers::{Eip712TypedData, Multicall3, Permit2};       // v0.5 追加
use kiwa::contract::reth::{RethBinary, RethNode, reth_reorg, fidelity_matrix};    // v0.5 new module
```

`kiwa::contract::reth` module (feature `contract-reth`、 default OFF) は Ethereum Execution client を 2 系統 (anvil + reth) で扱う second dev chain 経路。 `RethBinary::detect` で reth CLI の PATH 存在確認、 `RethNode::spawn` で `reth node --dev` を subprocess spawn + `Drop`-based tear-down、 `reth_reorg(endpoint, blocks)` で `debug_setHead` JSON-RPC 経由の N-block reorg simulation、 `fidelity_matrix()` で anvil ↔ reth の 7 JSON-RPC method (`eth_blockNumber` / `eth_chainId` / `eth_getBalance` / `eth_gasPrice` / `eth_call` / `net_version` / `web3_clientVersion`) 期待突合 case 集を提供。 pure Rust、 alloy crate family 依存なし (subprocess plumbing は `std::process`、 JSON-RPC payload は hand-encoded string)、 reth binary 不在時は `skipped` shape で graceful degradation。

`kiwa::contract::foundry::invariant` submodule (`contract-foundry` feature 配下) は forge invariant runner の 10_000 run gate + fuzz seed 決定的化 + shrink parser + coverage feed の 4 軸を統合。 seed は `FOUNDRY_INVARIANT_SEED` env var + Cargo.toml `[profile.default.invariant]` seed row の両経路で feed、 counter-example 発火時の shrink 出力を `InvariantCounterExample { calls: Vec<Call>, revert: Option<String> }` shape に parse、 `coverage_feed()` で lcov output を `@kiwa-lab/quality-metrics` release gate 7 軸 JSON に変換。

`kiwa::contract::alloy::helpers` submodule (`contract-alloy` feature 配下) は Web3 auth / batch / permit の 3 領域 encoder。 `Eip712TypedData::build(domain, primary_type, message)` は EIP-712 の 4 layer (domain separator + typeHash + structHash + digest) を pure Rust で組立、 `Multicall3::encode(calls)` は Multicall3 contract (`0xcA11bde05977b3631167028862bE2a173976CA11`) 向け `aggregate3(Call3[])` calldata で N call を 1 tx に集約、 `Permit2::permit_witness_transfer_from(spec)` は Permit2 (`permit2.uniswap.org`) の SignatureTransfer + witness verify pattern を encode。 pure Rust、 alloy crate 依存なし、 consumer は encoded bytes を自前の Provider に投入。

### `@kiwa-lab/dapp` reorg helpers (v0.x additive)

v1.18 で `@kiwa-lab/dapp` package に 2 named export を追加 (package version は変更なし、 既存 fixture API も無変更、 backward compatible)。

- `snapshotChain(client)` — `anvil_snapshot` JSON-RPC 経由で anvil (or anvil-fork) の chain state snapshot ID を返す
- `revertChain(client, snapshotId)` — `anvil_revert(id)` で snapshot 時点まで chain state を巻き戻す

reorg dogfood app + tutorial 27 (dApp e2e reorg) が 1 `import` で共有、 `dappE2eTest` fixture の後段に `use snapshotChain / revertChain` で 4 種の reorg scenario (pending-tx-rollback / receipt-invalidation / event-log-rewind / nonce-desync) を扱う。

## dogfood 3 app

- **`examples/dogfood-reth-node-test`** — Reth NodeBuilder dev chain + alloy Provider ERC-20 drive + 3-block reorg × fidelity harness。 `makeMockAdapter` は anvil dev chain (`kiwa::contract::foundry::Anvil`) + alloy Provider 経由で 5 ERC-20 tx drive、 `makeRealAdapter` は `kiwa::contract::reth::RethNode` 経由で `reth node --dev` を spawn + 同 5 tx drive、 `reth_reorg` で 3-block reorg 実施。 `RethFidelityReport` は 7 row anvil ↔ reth JSON-RPC matrix を出力。 32 cargo test。 7 軸 release gate PASS。
- **`examples/dogfood-foundry-invariant-fuzz`** — Solidity 3 contract (ERC20 + Vault + Router) × invariant runner。 `Invariant_ERC20_TotalSupply` で totalSupply 一定を 10_000 run 検証 (seed `0xdeadbeef`)、 `Invariant_Vault_NoUnderflow` で `sum(user balances) <= totalDeposit` を検証、 `Invariant_Router_NoDrain` で `router.balance == 0 after swap` を検証。 invariant broken 時の counter-example shrink 出力を `kiwa::contract::foundry::invariant` parser で decode、 `coverage_feed` で lcov を 7 軸 release gate JSON に変換。 21 cargo test。 7 軸 release gate PASS。
- **`examples/dogfood-dapp-e2e-reorg`** — Next.js 15 (App Router) + viem + wagmi + `@kiwa-lab/dapp` Playwright fixture + anvil mainnet fork (block 20_000_000) + reorg 4 scenario。 `snapshotChain` + `revertChain` で state 巻き戻し、 各 scenario で mock vs anvil fork fidelity 比較 — `pending-tx-rollback` (tx confirmed at N → chain reorg to N-2 → tx pending) / `receipt-invalidation` (receipt fetch → revert → refetch null) / `event-log-rewind` (subscribed log from N drop after reorg to N-3) / `nonce-desync` (nonce 5 → chain rewind → nonce 3)。 26 Playwright test。 7 軸 release gate PASS。

## docs

- tutorial 3 本 (25 Reth node test / 26 Foundry invariant + fuzz / 27 dApp e2e reorg)
- additive migration v1.17 → v1.18 (v0.4 → v0.5 の source 互換保証 + 新 module opt-in 手順)
- concept doc `blockchain-testing.md` (chain state / EL client integration / fuzz shrinker / reorg semantics の 4 追加軸 × 6 semantic axis SSOT、 dashboard / alert / flame / correlation を含む v1.17 4 軸との対比表付き)

VitePress sidebar には `Blockchain 深化 (v1.18)` セクションを追加、 gh-pages 反映済 (https://cardene777.github.io/kiwa/)。

## 数値サマリ

- **6 sub-Issues resolved** (#793-#798)
- **6 PRs merged** (#799-#803 + 本 publish PR)
- **1 crate minor bump** (`kiwa-test-rs` v0.4.2 → v0.5.0 + crates.io publish)
- **3 new dogfood app** (79 test 合計、 全 7 軸 release gate PASS)
- **4 追加軸** (chain state / EL client integration / fuzz shrinker / reorg semantics)

## 8 milestone streak

v1.11 (release gate) → v1.12 (非決定性) → v1.13 (時間軸) → v1.14 (横軸拡張) → v1.15 (AI-LLM 深化) → v1.16 (component 縦軸) → v1.17 (Observability v2) → **v1.18 (Blockchain 深化)**。 v1.11 以降の 8 milestone は全て 6 sub-Issue land 完遂。

## v2.0 candidates

- multi-version Vitest matrix (Vitest 1.x vs 2.x vs 3.x parity)
- desktop (Electron / Tauri) + mobile (React Native / Expo) adapter
- framework depth (SolidJS / Fresh / HonoJS)
- coverage 100% milestone
- cache / data depth (Dragonfly / Materialize / Neon)
- L2 depth (Base / Arbitrum / Optimism / Scroll block-space fidelity)
- ZK depth (Noir / Circom / RISC Zero test harness)

feedback 歓迎です。 どれを次に land すべきか issue で議論しましょう。
