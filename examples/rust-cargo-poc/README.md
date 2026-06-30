# examples/rust-cargo-poc — kiwa-test-rs v0.1 usage example

Minimal cargo crate that wires [`kiwa-test-rs`](../../kiwa-rs/) into `cargo test`.
4 tests cover the public API surface of v0.1:

1. `setup_env` default (Mock mode, no seed / label).
2. `setup_env` with explicit `Live` mode + seed + label.
3. `assert_kiwa_eq!` against integer domain output (`add`).
4. `assert_kiwa_close!` against floating-point domain output (`mean`).

## Run

```bash
cd examples/rust-cargo-poc
cargo test
```

Expected output:

```
running 4 tests
test mean_returns_value_within_tolerance_via_assert_kiwa_close ... ok
test setup_env_default_is_mock ... ok
test setup_env_live_with_seed_and_label ... ok
test add_returns_expected_sum_via_assert_kiwa_eq ... ok

test result: ok. 4 passed; 0 failed; ...
```

## Layout

```
examples/rust-cargo-poc/
  Cargo.toml          # path dep on ../../kiwa-rs
  src/lib.rs          # toy domain: add() + mean()
  tests/poc.rs        # 4 tests using kiwa::unit + assert macros
  README.md
```

The `kiwa-test-rs` dep is `path = "../../kiwa-rs"` so this PoC works pre-publish.
After `cargo publish` (planned during v1.4 close-out) the dep can switch to
`kiwa-test-rs = "0.1"` for clean external users.

## Related

- Sibling — [`kiwa-rs/`](../../kiwa-rs/) (the adapter crate)
- Issue — [#576 (v1.4-1)](https://github.com/cardene777/kiwa/issues/576)
- Parent — [#575 (v1.4 polyglot)](https://github.com/cardene777/kiwa/issues/575)
