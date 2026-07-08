1/ kiwa v1.18 is out — Blockchain 深化 milestone. After v1.17's Observability v2 (Grafana + AlertManager + trace flame + log correlation), v1.18 lands the Rust blockchain testing stack every dApp production team already ships: Reth (Rust EL client) + Foundry-rs invariant + Alloy encoder helpers + dApp e2e reorg.

2/ `kiwa-test-rs` v0.5 (minor bump from v0.4.2) — 3 additional axes on top of the v0.4 `kiwa::contract::foundry` + `kiwa::contract::alloy` foundation. Zero breaking changes; the v0.4 public re-export paths stay identical (`foundry.rs` moves to `foundry/mod.rs` etc, but every `use kiwa::contract::foundry::FoundryEnv;` caller does not touch a line).

3/ `kiwa::contract::reth` — new module behind feature `contract-reth` (default OFF). `RethBinary::detect` PATH check + `RethNode::spawn` Drop-based `reth node --dev` handle + `reth_reorg(endpoint, blocks)` for `debug_setHead` N-block reorg + `fidelity_matrix()` 7-row anvil ↔ reth JSON-RPC expectation table. Pure Rust; no alloy crate family dep.

4/ `kiwa::contract::foundry::invariant` — new submodule under `contract-foundry`. 10_000 forge run gate + fuzz seed determinism (`FOUNDRY_INVARIANT_SEED` env + Cargo.toml row) + counter-example shrink parser (`InvariantCounterExample { calls, revert }`) + `coverage_feed()` translates lcov into 7-axis release gate JSON.

5/ `kiwa::contract::alloy::helpers` — new submodule under `contract-alloy`. `Eip712TypedData::build(domain, primary_type, message)` 4-layer digest + `Multicall3::encode(calls)` `aggregate3(Call3[])` calldata + `Permit2::permit_witness_transfer_from(spec)` SignatureTransfer + witness verify. Pure Rust; no alloy crate dep — consumers plug encoded bytes into whichever Provider they build outside kiwa.

6/ dogfood apps — `dogfood-reth-node-test` (Reth NodeBuilder dev chain + alloy Provider ERC-20 drive + 3-block reorg × fidelity harness, 32 cargo test), `dogfood-foundry-invariant-fuzz` (ERC-20 + Vault + Router × invariant 10_000 run + fuzz + shrink parser + coverage feed, 21 cargo test), `dogfood-dapp-e2e-reorg` (Next.js 15 + viem + wagmi + `@kiwa/dapp` reorg fixture + anvil fork mainnet + 4 reorg scenario, 26 Playwright test). All 3 hit 7-axis release gate PASS.

7/ `@kiwa/dapp` reorg helpers — 2 new named exports `snapshotChain(client)` + `revertChain(client, snapshotId)` over `anvil_snapshot` + `anvil_revert`. Reused by the reorg dogfood app + tutorial 27 in one `import`. Package version unchanged.

8/ docs — 3 tutorials (25 Reth / 26 Foundry invariant / 27 dApp reorg) + additive migration v1.17 → v1.18 + concept doc `blockchain-testing.md` (chain state / EL client integration / fuzz shrinker / reorg semantics — 4 additional axes × 6 semantic axis SSOT). VitePress + gh-pages published. Roadmap: https://github.com/cardene777/kiwa#roadmap — v1.11 → v1.12 → v1.13 → v1.14 → v1.15 → v1.16 → v1.17 → v1.18: 8 milestones in a row.
