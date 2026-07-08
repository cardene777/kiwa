# kiwa v1.18 released — Blockchain 深化 (Reth + Foundry invariant/fuzz + Alloy helpers + dApp e2e reorg)

v1.18 is out. After v1.17's Observability v2 vertical (`@kiwa/observability` v2.0 unifying Grafana dashboards + Prometheus AlertManager + trace flame graphs + log correlation), v1.18 turns to **the Rust blockchain testing stack** — Reth (Rust Ethereum Execution client) integration, Foundry-rs invariant / fuzz runner depth, Alloy encoder helpers (EIP-712 / Multicall3 / Permit2), and dApp e2e reorg semantics — four additional axes on top of the v1.10 `kiwa::contract::foundry` + `kiwa::contract::alloy` foundation.

## What shipped

- **`kiwa-test-rs` v0.5.0** (minor bump from v0.4.2). 3 additional axes over the v0.4 contract layer. Zero breaking changes to v0.4 (`kiwa::contract::foundry::Anvil` + `kiwa::contract::foundry::FoundryEnv` + `kiwa::contract::alloy::SolAbi` + `kiwa::contract::alloy::Signer` + `kiwa::contract::alloy::keccak256`) — the `foundry.rs` file moves to `foundry/mod.rs` and `alloy.rs` moves to `alloy/mod.rs`, but every public re-export path stays the same, so `use kiwa::contract::foundry::FoundryEnv;` callers do not touch a line.
  - `kiwa::contract::reth` — new module behind feature `contract-reth` (default OFF). `RethBinary::detect` performs a lightweight PATH check for the `reth` CLI; when absent, helpers return `skipped` shape so test suites gracefully skip in environments without the toolchain provisioned. `RethNode::spawn` wraps `reth node --dev` in a `Drop`-based subprocess handle. `reth_reorg(endpoint, blocks)` drives an N-block reorg through the `debug_setHead` JSON-RPC method (which reth exposes in dev mode). `fidelity_matrix()` returns a 7-row anvil ↔ reth expectation table for the JSON-RPC surface both dev chains implement (`eth_blockNumber` / `eth_chainId` / `eth_getBalance` / `eth_gasPrice` / `eth_call` / `net_version` / `web3_clientVersion`). Pure Rust — no alloy crate family dependency (subprocess plumbing lives in `std::process`, JSON-RPC payloads are hand-encoded strings).
  - `kiwa::contract::foundry::invariant` — new submodule under the existing `contract-foundry` feature. Drives `forge test --match-contract Invariant*` with a decoded 10_000 run + fuzz seed determinism gate (seed feeds through `FOUNDRY_INVARIANT_SEED` env var + Cargo.toml `[profile.default.invariant]` seed row so re-runs replay). Ships a shrink parser that maps `forge test`'s "counter-example shrunk to" output to a structured `InvariantCounterExample { calls: Vec<Call>, revert: Option<String> }` shape. `coverage_feed()` translates invariant + fuzz coverage lcov output into the `@kiwa/quality-metrics` release gate 7-axis JSON shape so the mock harness and dogfood app cross-report.
  - `kiwa::contract::alloy::helpers` — new submodule under the existing `contract-alloy` feature. `Eip712TypedData::build(domain, primary_type, message)` builds a 4-layer typed data digest (domain separator + typeHash + structHash + digest per EIP-712). `Multicall3::encode(calls)` writes `aggregate3(Call3[])` calldata that packs N `eth_call`-shaped calls into 1 transaction for the Multicall3 contract at `0xcA11bde05977b3631167028862bE2a173976CA11`. `Permit2::permit_witness_transfer_from(spec)` encodes the SignatureTransfer + witness verify pattern from `permit2.uniswap.org`. Pure Rust — same principle as the parent `alloy` module: no alloy crate dependency; consumers plug encoded bytes into whichever Provider they build outside kiwa.
- **`examples/dogfood-reth-node-test`** — Reth NodeBuilder dev chain driven behind a provider-neutral `RethAdapter`. `makeMockAdapter` spins up an anvil dev chain over `kiwa::contract::foundry::Anvil` and drives 5 ERC-20 transactions through the alloy Provider surface; `makeRealAdapter` spawns `reth node --dev` through the new `kiwa::contract::reth::RethNode` handle and drives the same 5 tx. A 3-block reorg exercise via `reth_reorg` + `debug_setHead` closes both loops. The fidelity harness produces a `RethFidelityReport` covering the 7-row anvil ↔ reth JSON-RPC matrix. 7-axis release gate verdict PASS. 32 cargo test.
- **`examples/dogfood-foundry-invariant-fuzz`** — 3 Solidity contract fixtures (`ERC20` + `Vault` + `Router`) with a per-contract invariant runner. `Invariant_ERC20_TotalSupply` runs `invariant_total_supply_constant` for 10_000 forge runs at seed `0xdeadbeef`. `Invariant_Vault_NoUnderflow` runs `invariant_no_underflow` for 10_000 runs asserting `sum(user balances) <= totalDeposit`. `Invariant_Router_NoDrain` runs `invariant_no_drain` for 10_000 runs asserting `router.balance == 0` after each swap. When the invariant breaks, the `kiwa::contract::foundry::invariant` shrink parser decodes the counter-example call list into a structured `InvariantCounterExample`. `coverage_feed` roll up feeds the 7-axis release gate coverage row. 21 cargo test.
- **`examples/dogfood-dapp-e2e-reorg`** — Next.js 15 (App Router) frontend + viem + wagmi wallet connect + `@kiwa/dapp` Playwright fixture + anvil mainnet fork (block 20_000_000). `@kiwa/dapp` gains 2 new named exports `snapshotChain(client)` + `revertChain(client, snapshotId)` (implemented over `anvil_snapshot` + `anvil_revert` JSON-RPC methods) — the reorg dogfood app + tutorial 27 share the same reorg drivers. 4 reorg scenario specs: `pending-tx-rollback` (user tx confirmed at block N, chain reorgs to N-2, tx pending again) / `receipt-invalidation` (tx receipt fetched then chain reverts, refetch returns null) / `event-log-rewind` (subscribed logs from block N drop after reorg to N-3) / `nonce-desync` (account nonce advances to 5 then chain rewinds to nonce 3). Fidelity harness compares mock vs anvil fork behavior for each scenario. 7-axis release gate verdict PASS. 26 Playwright test.
- **docs** — 3 new tutorials (25 Reth node test / 26 Foundry invariant + fuzz / 27 dApp e2e reorg) + additive migration guide v1.17 → v1.18 + concept doc `blockchain-testing.md` documenting the **4 additional axes × 6 semantic axes** (chain state (snapshot / revert / reorg) / EL client integration (anvil ↔ reth fidelity) / fuzz shrinker (invariant counter-example decode) / reorg semantics (pending tx / receipt / event log / nonce desync)) as the SSOT. VitePress sidebar refreshed with a new `Blockchain 深化 (v1.18)` tutorial section; gh-pages published via `/docs-publish-kiwa`.

## Numbers

- **6 sub-Issues resolved** (#793-#798)
- **6 PRs merged** (#799-#803 + this publish PR)
- **1 crate minor bump** (`kiwa-test-rs` v0.4.2 → v0.5.0 with crates.io publish)
- **3 new dogfood apps** with fidelity reports feeding the 7-axis release gate
- **79 new tests** across the 3 dogfood apps (32 cargo + 21 cargo + 26 Playwright) all pass

## 8-milestone streak

v1.11 (release gate) → v1.12 (non-determinism) → v1.13 (time-axis) → v1.14 (horizontal expansion) → v1.15 (AI-LLM depth) → v1.16 (component depth) → v1.17 (Observability v2) → **v1.18 (Blockchain depth)**. Every milestone since v1.11 has landed 6 sub-Issues in full.

## v2.0 candidates

- Multi-version Vitest matrix (Vitest 1.x vs 2.x vs 3.x parity)
- Desktop (Electron / Tauri) + mobile (React Native / Expo) adapters
- Framework depth (SolidJS / Fresh / HonoJS)
- Coverage 100% milestone
- Cache / Data depth (Dragonfly / Materialize / Neon)
- L2 depth (Base / Arbitrum / Optimism / Scroll block-space fidelity)
- ZK depth (Noir / Circom / RISC Zero test harness)

Feedback welcome on which of these should land next.
