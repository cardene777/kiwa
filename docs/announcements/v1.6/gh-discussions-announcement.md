# 🌱 kiwa v1.6 — All-adapter parity, v1.5 Codex findings consumed

The v1.6 milestone (**6/6 GitHub Issues resolved**) just landed. This is a **quality-first milestone** — the ~65 Codex adversarial review findings surfaced during v1.5 (polyglot web deepening) are now consumed into 6 topics, and every adapter (v1.4 mock_server + Rust axum/actix + Go gin/echo) meets **v1.4 mock_server parity**.

If v1.5 was "polyglot promise on the Web layer", v1.6 is "polyglot promise, locked down".

## 1. Multi-value response header retention (#607)

```go
// Before v1.6
resp.Headers()["set-cookie"]  // "session=xyz" only

// After v1.6
resp.HeadersAll("Set-Cookie")  // ["auth=abc", "session=xyz"]
resp.Cookies()                 // convenience alias
```

- All 5 adapters (v1.4 mock_server + Rust axum/actix + Go gin/echo) gained `HeadersAll(key)` and `Cookies()`
- Backward compat: `Headers()` still last-value-wins
- Rust: `TestResponse::headers_all` + `cookies`, `MockResponse::with_header_values`

## 2. Body defensive copy everywhere (#608)

`Response.Body()` and `recordRequest.Body` now return defensive copies across every adapter. v1.5-3/-4 inline-fixed gin/echo; v1.6-2 extended to v1.4 mock_server + Rust axum/actix.

## 3. Stop() lifecycle activation (#609)

```go
srv.Stop()
srv.Request(kiwa.MethodGET, "/x").Send()  // BEFORE: silently succeeded, AFTER: t.Fatalf
```

- `Stop()` was a no-op flag in v1.5. In v1.6, `Send()` checks `stopped` and fails explicitly:
  - Rust: `send()` panics with `"kiwa-{axum,actix}: send after stop"`
  - Go: `Send()` calls `t.Fatalf("kiwa-{gin,echo}: send after stop")` and returns `nil`
- `Drop` routes through `stop()` in Rust for idempotency

## 4. Go Send panic → t.Fatalf (#610)

Go gin/echo `Send()` no longer panics on `http.NewRequest` failure — it now calls `t.Fatalf` via the `testing.TB` stored on `TestServer` (groundwork laid in #609). Failure ergonomics now match v1.4 `NewMockServer`.

**Breaking change for Go**: tests using `recover()` around `Send()` need updating.

## 5. recordRequest deduplication = recorder factor (#611)

- **Go**: `kiwa-go/internal/recorder/` extracts `Snapshot` / `FromServer` / `FromClient` / `Log` as SSOT. gin / echo / integration.go all delegate to `recorder.Log`.
- **Rust**: `kiwa-rs/src/recorder.rs` (crate-private) provides `fold_headers` generic helper. axum / actix / mock_server share one header-conversion loop.
- Bonus: v1.6-2 (#608) post-merge Codex review surfaced 5 additional hazards (MockResponse aliasing / snapshot deep copy / Request.Body ingress alias / Rust test theater / Go integration test theater). All consumed in v1.6-5.

## 6. Docs consistency (#612)

- Echo per-instance logger wording fixed (previous "once in package init" vs "per instance" contradiction)
- README + rustdoc + godoc API surface consistency pass
- `docs/announcements/v1.5/gh-discussions-announcement.md § 5` updated to reflect v1.6 close-out
- CHANGELOG entries for `kiwa-test-rs` v0.3 / `kiwa-test-go` v0.3

## v1.5 → v1.6 delta

| Axis | v1.5 | v1.6 |
|---|---|---|
| Adapter count | 5 | 5 |
| Parity state | ~65 semantics drifts | ✅ All adapters at v1.4 mock_server parity |
| Multi-value header | last-value-wins only | array retention + `HeadersAll` / `Cookies` |
| Stop lifecycle | no-op flag | Active, post-Stop explicit error |
| Go Send() failure | panic (stack trace) | `t.Fatalf` (diagnostic) |
| recordRequest dedup | 4 independent implementations | Go internal/recorder + Rust src/recorder.rs |
| Plugin version | 1.5.0 | **1.6.0** |

## Breaking changes

- **Go** (`kiwa-test-go` v0.3): `Send()` panic → `t.Fatalf`; tests using `recover()` need updating.
- **Rust** (`kiwa-test-rs` v0.3): source-compatible (recorder factor is `pub(crate)` internal).

## Codex adversarial review notes

Each v1.6 sub-Issue went through Codex adversarial review. Notable results:

- v1.6-4 (Send t.Fatalf): 2 review passes, both `no blocking issues`
- v1.6-2 (body defensive copy): 2 MAJOR + 3 MINOR + 2 hazards detected post-merge → consumed in v1.6-5
- v1.6-5 (recorder factor): 5 v1.6-2 hazards + core dedup all closed in one PR

## v1.7 — scope under discussion

Candidates:

- **A** — Polyglot deepening (Rust tower-http middleware / Go Fiber)
- **B** — New layers (auth / job queue / cache test adapters)
- **C** — Rust contract layer (Foundry-rs / alloy.rs once 1.0 stabilizes)
- **D** — Storybook integration (v2.0 pull-forward)

Drop priorities on the [Discussions board](https://github.com/cardene777/kiwa/discussions).

## Try it

```bash
# Claude Code plugin (recommended)
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace

# Rust (v0.3, source-compatible)
cargo add --dev kiwa-test-rs --features axum
cargo add --dev kiwa-test-rs --features actix-web

# Go (v0.3, Send() panic → t.Fatalf breaking change)
go get github.com/cardene777/kiwa-test-go/gin@v0.3.0
go get github.com/cardene777/kiwa-test-go/echo@v0.3.0
```

Repo ... https://github.com/cardene777/kiwa

v1.5 shipped polyglot on the Web layer. v1.6 **locks down** the contract drifts that surfaced during v1.5 — one step back from feature-add mode, deliberately positioned as a **quality-assurance milestone**.

— [@cardene777](https://github.com/cardene777)
