# go-testing-poc — `kiwa-test-go` PoC

This example exercises the [`kiwa-test-go`](../../kiwa-go) adapter against
trivial domain packages to demonstrate the v0.1 fixture, assertion, and
integration helper contracts end-to-end.

## Run

```bash
cd examples/go-testing-poc
go test ./...
```

The PoC is split into two sibling packages:

### `./` — unit fixture + assertions (5 tests)

Exercises `SetupUnitEnv`, `AssertEqual`, and `AssertClose` against a tiny
domain package (`Add`, `Average`).

1. Default `SetupUnitEnv` returns a `Mock` fixture with auto-cleanup.
2. `SetupUnitEnv` round-trips `Seed` / `Label` options.
3. `AssertEqual` on an integer return (`Add`).
4. `AssertClose` on a float return with rounding noise (`Average`).
5. Nested `t.Run` subtests run `Stop` independently via `t.Cleanup`.

### `./integration` — `NewMockServer` HTTP mock (4 tests)

Exercises `kiwa.NewMockServer` driving a `http.Client` against a domain
`UsersClient` that wraps a `/users` endpoint.

1. `ListUsers` decodes a mocked JSON array (happy path).
2. `CreateUser` POSTs a JSON body and parses a 201 response (request body
   capture + status override).
3. `ListUsers` surfaces a 5xx response as a non-2xx error, and the failing
   request is still captured by the recorder.
4. Each test isolates its own server / recorder / ephemeral port.

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
