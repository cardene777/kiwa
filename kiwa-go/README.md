# kiwa-test-go — Go `testing.T` adapter

Port of [kiwa](https://github.com/cardene777/kiwa) `@kiwa-test/core` to the Go
ecosystem. Provides a deterministic fixture (`SetupUnitEnv`) with mode
selection (`Mock` / `Live`), automatic cleanup via `t.Cleanup`, and
diff-aware assertion helpers (`AssertEqual` / `AssertClose`).

## Install

```bash
go get github.com/cardene777/kiwa-test-go@v0.1.0
```

Requires Go >= 1.21. The module has zero runtime dependencies (only the
standard library).

## Usage

### `SetupUnitEnv(t, opts)` — deterministic fixture

```go
import (
    "testing"

    "github.com/cardene777/kiwa-test-go"
)

func TestExample(t *testing.T) {
    env := kiwa.SetupUnitEnv(t, kiwa.UnitOpts{
        Mode:  kiwa.ModeMock,
        Seed:  kiwa.Seed(42),
        Label: "example",
    })

    kiwa.AssertEqual(t, env.Mode(), kiwa.ModeMock)
    kiwa.AssertEqual(t, *env.Seed(), uint64(42))
    // env.Stop() runs automatically when t finishes (t.Cleanup).
}
```

`SetupUnitEnv` registers `env.Stop` with `t.Cleanup` so tests cannot forget
cleanup — the fixture is released even when assertions short-circuit the
test with `t.Fatalf`.

### `AssertEqual` / `AssertClose`

```go
kiwa.AssertEqual(t, 2+2, 4)
kiwa.AssertEqual(t, []int{1, 2, 3}, []int{1, 2, 3}, "sequence")
kiwa.AssertClose(t, 1.0, 1.0+1e-9, 1e-6)
kiwa.AssertClose(t, 1.0, 2.0, 1e-6, "floating drift hint")
```

Failure messages include `got` / `want` / `delta` / `tol` / `hint` so
`go test -v` output is diff-friendly. Both helpers call `t.Helper()` so the
stack frame surfaced by Go's testing package points at the caller, not at
the helper.

`AssertEqual` uses `reflect.DeepEqual`, so structs, slices, maps, and
pointer targets are all compared by value. `AssertClose` fails on `NaN` on
either side.

### Mode selection

| `Mode` | Purpose | Downstream adapters |
|---|---|---|
| `ModeMock` (default) | Fully deterministic in-process fixture, no network / filesystem. | API mock helpers planned for v0.2 (integration adapter). |
| `ModeLive` | Real-resource fixture, opt-in. | Same adapters, hitting real endpoints. |

`UnitEnv` is intentionally not safe for cross-goroutine sharing — fixtures
are scoped to the test goroutine that created them. The monotonic `ID()` is
atomic so parallel `SetupUnitEnv` calls from `t.Parallel` tests still
receive distinct ids.

### `testing.TB` accepted

`SetupUnitEnv`, `AssertEqual`, and `AssertClose` all accept `testing.TB`, so
they work inside `*testing.T`, `*testing.B`, and `*testing.F` bodies. The
same helpers can be reused in benchmarks and fuzz tests without rewrite.

## Roadmap

- v0.1 (this release) — `SetupUnitEnv` + `Mode` (Mock / Live) + `AssertEqual`
  / `AssertClose` + `t.Cleanup`-based auto-stop, shipped via Issue
  [#578](https://github.com/cardene777/kiwa/issues/578).
- v0.2 — `net/http/httptest` integration helper (`kiwa.MockServer`) + request
  recorder, tracked in Issue
  [#579](https://github.com/cardene777/kiwa/issues/579).
- v0.3+ — Layer 1 spec → `_test.go` codegen (kiwa-design polyglot extension,
  Issue [#580](https://github.com/cardene777/kiwa/issues/580)) and Layer 2
  `kiwa-go` skill chain (Issue
  [#581](https://github.com/cardene777/kiwa/issues/581)).

## Related

- Parent v1.4 milestone — [#575](https://github.com/cardene777/kiwa/issues/575)
- PoC — [`examples/go-testing-poc/`](../examples/go-testing-poc)
- TypeScript core — [`@kiwa-test/core`](../packages/core)
- Rust sibling — [`kiwa-test-rs`](../kiwa-rs)
- Python sibling — [`kiwa-test-py`](../kiwa-py)

## Publish (maintainers)

```bash
git tag kiwa-go/v0.1.0
git push --tags
# pkg.go.dev auto-indexes the new tag within minutes.
```

The git tag prefix follows the standard Go monorepo convention
(`<module-dir>/vX.Y.Z`) so `go get` resolves the module without ambiguity.

## License

MIT
