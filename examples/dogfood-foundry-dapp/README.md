# dogfood-foundry-dapp

Dogfood app 3 (v1.11-4) — a Solidity ERC20 project driven from Rust through `kiwa-test-rs`'s `contract::foundry` + `contract::alloy` adapters. Provides a real-vs-mock harness that runs against the Foundry CLI when installed (`KIWA_MODE=real`) and against kiwa's graceful skip shape otherwise (`KIWA_MODE=mock`). Feeds behavioural fidelity into `@kiwa/quality-metrics` via a JSON snapshot.

## Layout

```
Cargo.toml                        -- Rust crate manifest (workspace member)
foundry.toml                      -- Foundry project descriptor (src/out/test)
contracts/DogfoodToken.sol        -- ERC20 contract
test/DogfoodToken.t.sol           -- Foundry Solidity test
src/lib.rs                        -- adapters (mock + real) + fidelity harness
tests/
  e2e_mock_mode.rs                -- 8 mock-mode tests (deterministic)
  fidelity_report.rs              -- 3 harness tests (real graceful skip)
  emit_fidelity_report.rs         -- writes quality-report/fidelity-latest.{md,json}
```

## Adapters

- `MockAdapter` — never invokes the Foundry CLI. Skips `run_forge_test`, parses ABI from an inline JSON blob, returns a deterministic `Provider::Http` / `Signer::LocalWallet`. Baseline for the fidelity diff.
- `RealAdapter` — uses `FoundryEnv::detect` to decide whether to actually invoke Foundry. When the CLI is missing every CLI-dependent op returns `FOUNDRY_ENV_MISSING`; the encoding + provider / signer ops still work so the harness measures a mixed divergence set.

## Run

```bash
cargo test -p dogfood-foundry-dapp
cat quality-report/fidelity-latest.md
```

Optional — when Foundry CLI is available:

```bash
forge test --root examples/dogfood-foundry-dapp
```

## Related

- v1.10-5 `kiwa::contract::foundry` (feature `contract-foundry`)
- v1.10-6 `kiwa::contract::alloy` (feature `contract-alloy`)
- v1.11-1 `@kiwa/quality-metrics`
- v1.11-2 dogfood-supabase-saas-app / v1.11-3 dogfood-rabbitmq-worker-app (adapter template origin)
- v1.11 milestone parent [#680](https://github.com/cardene777/kiwa/issues/680), this sub [#684](https://github.com/cardene777/kiwa/issues/684)
