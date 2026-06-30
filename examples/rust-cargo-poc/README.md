# examples/rust-cargo-poc — kiwa-test-rs v0.1 usage example

Minimal cargo crate that wires [`kiwa-test-rs`](../../kiwa-rs/) into `cargo test`.

Unit suite (`tests/poc.rs`) covers v0.1 unit surface — 4 tests:

1. `setup_env` default (Mock mode, no seed / label).
2. `setup_env` with explicit `Live` mode + seed + label.
3. `assert_kiwa_eq!` against integer domain output (`add`).
4. `assert_kiwa_close!` against floating-point domain output (`mean`).

Integration suite (`tests/poc_integration.rs`) covers the v0.1 integration
surface — 4 tests driving a `reqwest` blocking client through the
`UsersClient` domain wrapper against `kiwa::integration::mock_server`:

1. `list_users` decodes a mocked JSON array response.
2. `create_user` POSTs a JSON body, parses a `201 { id, name }` response, and
   the recorder captures the posted body.
3. `list_users` surfaces a mocked 5xx as a typed error.
4. Two independent mock servers each get their own ephemeral port and
   recorder.

## Run

```bash
cd examples/rust-cargo-poc
cargo test
```

Expected output:

```
running 4 tests   # tests/poc.rs (unit)
test add_returns_expected_sum_via_assert_kiwa_eq ... ok
test setup_env_default_is_mock ... ok
test setup_env_live_with_seed_and_label ... ok
test mean_returns_value_within_tolerance_via_assert_kiwa_close ... ok
test result: ok. 4 passed; 0 failed; ...

running 4 tests   # tests/poc_integration.rs (integration)
test list_users_decodes_mocked_json_array ... ok
test create_user_sends_json_body_and_parses_201_response ... ok
test list_users_surfaces_non_2xx_as_error ... ok
test each_test_isolates_its_own_recorder ... ok
test result: ok. 4 passed; 0 failed; ...
```

## Layout

```
examples/rust-cargo-poc/
  Cargo.toml                    # path dep on ../../kiwa-rs
  src/lib.rs                    # toy domain: add() + mean() + UsersClient
  tests/poc.rs                  # 4 tests using kiwa::unit + assert macros
  tests/poc_integration.rs      # 4 tests using kiwa::integration::mock_server
  README.md
```

The `kiwa-test-rs` dep is `path = "../../kiwa-rs"` so this PoC works pre-publish.
After `cargo publish` (planned during v1.4 close-out) the dep can switch to
`kiwa-test-rs = "0.1"` for clean external users.

## Related

- Sibling — [`kiwa-rs/`](../../kiwa-rs/) (the adapter crate)
- Issue — [#576 (v1.4-1 unit)](https://github.com/cardene777/kiwa/issues/576)
  + [#577 (v1.4-2 integration)](https://github.com/cardene777/kiwa/issues/577)
- Parent — [#575 (v1.4 polyglot)](https://github.com/cardene777/kiwa/issues/575)
