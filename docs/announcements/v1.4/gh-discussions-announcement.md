# 🌱 kiwa v1.4 — 5-language polyglot test toolchain complete (Rust + Go land)

The v1.4 milestone (**6/6 GitHub Issues resolved**) just landed. With Rust and Go adapters joining the existing TypeScript / Python / Solidity trio, kiwa now drives **5 languages from a single Layer 1 spec**.

This delivers on the "Rust / Go coming" promise from the v0.5 announcement — finally a 5-language polyglot test toolchain in one cohesive design.

## 1. Rust adapter (`kiwa-test-rs` v0.1)

```rust
use kiwa_test_rs::unit::{setup_env, UnitOpts, Mode};
use kiwa_test_rs::assertions::*;

#[test]
fn counter_increments() {
    let env = setup_env(UnitOpts { mode: Mode::Mock, ..Default::default() });
    let mut counter = Counter::new(env.seed());
    counter.increment();
    assert_kiwa_eq!(counter.value(), 1);
}
```

- `setup_env(opts)` — fixture struct + `Drop` trait auto-stop
- `assert_kiwa_eq!` / `assert_kiwa_close!` — deterministic diff macros, NaN-safe
- `integration` feature (default ON) — `mock_server(opts)` with hyper 1.x + multi-thread tokio + `RecordedRequest` recorder
- Opt-out for unit-only via `--no-default-features`

## 2. Go adapter (`kiwa-test-go` v0.1)

```go
import "github.com/cardene777/kiwa-test-go/kiwa"

func TestCounter(t *testing.T) {
    env := kiwa.SetupUnitEnv(t, kiwa.UnitOpts{Mode: kiwa.Mock})
    counter := NewCounter(env.Seed())
    counter.Increment()
    kiwa.AssertEqual(t, counter.Value(), 1)
}
```

- `SetupUnitEnv(t, opts)` — fixture bind + `t.Cleanup` auto-stop
- `AssertEqual` / `AssertClose` — `testing.TB` accept, NaN-safe diff-friendly messages
- `NewMockServer(t)` (integration) — `httptest.Server` wrap + `Route` table + `RecordedRequest`
- **stdlib zero-dep** — no external runtime dependencies, race-detector clean

## 3. Layer 1 spec + skill chain expansion

`/kiwa-design` now generates spec for 4 new polyglot layers:

```bash
/kiwa-design --layer rust-unit --module counter        # → tests/spec/unit/test-spec-counter.rs.md
/kiwa-design --layer rust-integration --module orders  # → tests/spec/integration/test-spec-orders.rs.md
/kiwa-design --layer go-unit --module counter          # → tests/spec/unit/test-spec-counter.go.md
/kiwa-design --layer go-integration --module orders    # → tests/spec/integration/test-spec-orders.go.md
```

Layer 2 generators:

```bash
/kiwa-rust --module counter   # spec → tests/counter_test.rs + cargo test auto-run
/kiwa-go --module counter     # spec → tests/counter_test.go + go test auto-run
```

`/kiwa-review` now covers 5-language spec vs test consistency in a unified pipeline (`--layer rust-unit` / `--layer go-unit` / etc).

`/kiwa-test --target {rust|go|both|all}` lets the orchestrator run Rust + Go tests alongside Solidity / TS / Python.

## 4. v0.5 → v1.4 progression

| Axis | v0.5 | v1.4 |
|---|---|---|
| Languages | 3 (TS / Python / Solidity) | **5 (+ Rust + Go)** |
| npm packages | 11 | 20 |
| Cross-language packages | 1 (PyPI) | **3 (PyPI + crates.io + pkg.go.dev)** |
| Claude Code skills | 15 | 27 |
| Layer 1 spec layers | 6 | **13** |
| Runtimes | Node | Node / Bun / Deno / Edge |

## 5. Why polyglot matters

The "scattered test stack" problem from v0.5 wasn't just about runners — it's also about **languages**. A typical dApp project has:

- Solidity contracts → Foundry / Hardhat
- TypeScript frontend → Vitest / Playwright
- Python services → pytest
- Rust crypto libs → cargo test
- Go gateways → go test

Designing tests independently for each language is impractical. kiwa's v1.4 5-language polyglot means **one feature spec → parallel generation across the languages your stack actually uses**.

## 6. Claude Code plugin — 27 skills

```bash
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

All 27 skills land under the `kiwa:` namespace. Highlights for v1.4:

- `/kiwa:kiwa-rust` — Rust test generator (cargo test integration)
- `/kiwa:kiwa-go` — Go test generator (go test integration)
- `/kiwa:kiwa-design --layer rust-unit` / `--layer go-unit` / etc — Layer 1 spec

## v1.5 — scope under discussion

Candidates:

- **A** — Rust web framework adapters (axum / actix-web)
- **B** — Go web framework adapters (Gin / Echo / Fiber)
- **C** — Rust contract layer (Foundry-rs / alloy.rs once 1.0 stabilizes)
- **D** — New layers (auth / job queue / cache test adapters)
- **E** — Storybook integration

Drop priorities in the [Discussions board](https://github.com/cardene777/kiwa/discussions).

## Try it

```bash
# Claude Code plugin (recommended)
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace

# 5 languages, install only what you need
pnpm add -D @kiwa/core              # TypeScript
pip install kiwa-test-py                 # Python
cargo add kiwa-test-rs                   # Rust (unit)
cargo add --dev kiwa-test-rs --features integration  # Rust (integration)
go get github.com/cardene777/kiwa-test-go  # Go
```

Repo ... https://github.com/cardene777/kiwa

v0.5 announcement said "Rust / Go coming". v1.4 delivers — **5-language polyglot test toolchain, one Layer 1 spec drives them all**.

— [@cardene777](https://github.com/cardene777)
