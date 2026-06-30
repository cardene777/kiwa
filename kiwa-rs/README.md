# kiwa-test-rs — Rust cargo test adapter

Port of [kiwa](https://github.com/cardene777/kiwa) `@kiwa-test/core` to the Rust ecosystem.
Provides a deterministic fixture (`setup_env`) with mode selection (`Mock` / `Live`),
automatic cleanup via `Drop`, and diff-aware assertion macros
(`assert_kiwa_eq!` / `assert_kiwa_close!`).

## Install

`Cargo.toml`:

```toml
[dev-dependencies]
kiwa-test-rs = "0.1"
```

Requires Rust >= 1.75 (edition 2021).

After publish to crates.io (planned during v1.4 close-out):

```bash
cargo install kiwa-test-rs   # only useful if a future binary helper lands; library use is via [dev-dependencies]
```

## Usage

### `setup_env(opts)` — deterministic fixture

```rust
use kiwa::unit::{setup_env, Mode, SetupOpts};

#[test]
fn my_test() {
    let env = setup_env(SetupOpts {
        mode: Mode::Mock,
        seed: Some(42),
        label: Some("my-test".into()),
    });
    assert_eq!(env.mode(), Mode::Mock);
    assert_eq!(env.seed(), Some(42));
    // env goes out of scope -> Drop runs stop() automatically.
}
```

### `assert_kiwa_eq!` / `assert_kiwa_close!`

```rust
use kiwa::{assert_kiwa_eq, assert_kiwa_close};

assert_kiwa_eq!(2 + 2, 4);
assert_kiwa_eq!(vec![1, 2, 3], vec![1, 2, 3], "sequence diverged hint");
assert_kiwa_close!(1.0_f64, 1.0 + 1e-9, 1e-6);
assert_kiwa_close!(1.0_f64, 2.0_f64, 1e-6, "floating drift hint");
```

Failure messages include `left` / `right` / `delta` / `tol` / `hint` so cargo test
output is diff-friendly.

### Mode selection

| `Mode` | Purpose | Downstream adapters |
|---|---|---|
| `Mock` (default) | Fully deterministic in-process fixture, no network / filesystem. | reqwest mock builders, hyper in-memory server (v0.2 integration adapter). |
| `Live` | Real-resource fixture, opt-in. | Same adapters, hitting real endpoints. |

`KiwaEnv` is intentionally `!Send` (interior `Cell`) — fixtures are scoped to the
test thread that created them. Cleanup runs in `Drop`, so tests cannot leak state
across cases.

## Roadmap

- v0.1 (this release) — `setup_env` + Mode (Mock / Live) + assert macros + Drop cleanup.
- v0.2 — reqwest / hyper integration helpers (`kiwa::integration::mock_server`), Issue [#577](https://github.com/cardene777/kiwa/issues/577).
- v0.3+ — proc-macro `#[kiwa_test]` (split into `kiwa-test-rs-macro` crate), Layer 1 spec → `.rs` codegen (kiwa-design polyglot extension, Issue [#580](https://github.com/cardene777/kiwa/issues/580)).

## Related

- Parent v1.4 milestone — [#575](https://github.com/cardene777/kiwa/issues/575) (Rust + Go polyglot)
- TypeScript core — [`@kiwa-test/core`](https://github.com/cardene777/kiwa/tree/main/packages/core)
- Python sibling — [`kiwa-test-py`](https://github.com/cardene777/kiwa/tree/main/kiwa-py)
- PoC — [`examples/rust-cargo-poc/`](https://github.com/cardene777/kiwa/tree/main/examples/rust-cargo-poc)

## License

MIT
