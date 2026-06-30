# go-testing-poc — `kiwa-test-go` PoC

This example exercises the [`kiwa-test-go`](../../kiwa-go) adapter against a
trivial domain package (`Add`, `Average`) to demonstrate the v0.1 fixture +
assertion contract end-to-end.

## Run

```bash
cd examples/go-testing-poc
go test ./...
```

5 tests cover the four headline use cases:

1. Default `SetupUnitEnv` returns a `Mock` fixture with auto-cleanup.
2. `SetupUnitEnv` round-trips `Seed` / `Label` options.
3. `AssertEqual` on an integer return (`Add`).
4. `AssertClose` on a float return with rounding noise (`Average`).
5. Nested `t.Run` subtests run `Stop` independently via `t.Cleanup`.

## Local development

The module uses a `replace` directive to pull `kiwa-test-go` from the sibling
`kiwa-go/` directory in this repo. After the `v0.1.0` tag is pushed and
indexed by [pkg.go.dev](https://pkg.go.dev/github.com/cardene777/kiwa-test-go)
you can drop the replace and pin the published tag:

```bash
go mod edit -dropreplace github.com/cardene777/kiwa-test-go
go get github.com/cardene777/kiwa-test-go@v0.1.0
```

## Related

- Adapter source — [`../../kiwa-go`](../../kiwa-go)
- Parent v1.4 milestone — [#575](https://github.com/cardene777/kiwa/issues/575)
- Resolving Issue — [#578](https://github.com/cardene777/kiwa/issues/578)
- TypeScript core — [`@kiwa-test/core`](../../packages/core)
- Rust sibling — [`../../kiwa-rs`](../../kiwa-rs)
- Python sibling — [`../../kiwa-py`](../../kiwa-py)
