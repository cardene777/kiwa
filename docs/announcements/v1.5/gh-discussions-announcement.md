# 🌱 kiwa v1.5 — polyglot Web frameworks land (axum / actix-web / Gin / Echo)

The v1.5 milestone (**6/6 GitHub Issues resolved**) just landed. Rust and Go now have working web framework adapters, extending the v1.4 5-language polyglot into **actually usable Web-layer testing**.

If v1.4 was "the polyglot promise fulfilled", v1.5 is "the polyglot promise on the Web layer".

## 1. Rust web framework adapters (`kiwa-test-rs` v0.2)

```rust
use kiwa_test_rs::axum::{test_app, HttpMethod};
use kiwa_test_rs::actix::{test_app as actix_test_app};

// axum
let router = Router::new().route("/health", get(|| async { "ok" }));
let app = test_app(router);
let resp = app.request(HttpMethod::GET, "/health").send().await;

// actix-web
let app = actix_test_app(|| App::new().route("/health", web::get().to(handler)));
let resp = app.request(HttpMethod::GET, "/health").send().await;
```

- `axum` feature — `tower::ServiceExt::oneshot` for in-process invoke (no real port bind)
- `actix-web` feature — `actix_web::test::call_service` for the same shape
- Both opt-in via `--features axum` / `--features actix-web`, default OFF
- Shared `TestApp` / `RequestBuilder` / `TestResponse` contract with v1.4 mock_server

## 2. Go web framework adapters (`kiwa-test-go` v0.2)

```go
import (
    kiwa "github.com/cardene777/kiwa-test-go"
    kiwa_gin "github.com/cardene777/kiwa-test-go/gin"
    kiwa_echo "github.com/cardene777/kiwa-test-go/echo"
)

// Gin
srv := kiwa_gin.NewTestServer(t, ginEngine)
resp := srv.Request(kiwa.MethodGET, "/health").Send()

// Echo
srv := kiwa_echo.NewTestServer(t, echoInstance)
resp := srv.Request(kiwa.MethodGET, "/health").Send()
```

- `kiwa-test-go/gin` subpackage wraps `*gin.Engine`
- `kiwa-test-go/echo` subpackage wraps `*echo.Echo`
- Both use `httptest.NewRecorder` + `ServeHTTP` (in-process, stdlib only for the core)
- `TestServer` contract mirrors 1:1 across Gin/Echo

## 3. Layer 1 spec + skill chain (4 web layers)

`/kiwa-design` gains 4 web layers:

```bash
/kiwa-design --layer rust-axum --module counter-api
/kiwa-design --layer rust-actix-web --module counter-api
/kiwa-design --layer go-gin --module counter-api
/kiwa-design --layer go-echo --module counter-api
```

Layer 2 skills gain `--mode` flags:

```bash
/kiwa-rust --module counter-api --mode axum
/kiwa-rust --module counter-api --mode actix-web
/kiwa-go --module counter-api --mode gin
/kiwa-go --module counter-api --mode echo
```

`/kiwa-review` covers the 4 new layers in spec-vs-test consistency review.

## 4. v0.5 → v1.5 progression

| Axis | v0.5 | v1.5 |
|---|---|---|
| Languages | 3 | **5 (+ Rust + Go)** |
| Web frameworks (server-side) | 0 (npm-only) | 4 Rust/Go + 7 Node (v1.1-v1.3) = **11** |
| npm packages | 11 | 20 |
| Cross-language packages | 1 (PyPI) | **3 (PyPI + crates.io + pkg.go.dev)** |
| Claude Code skills | 15 | 27 |
| Layer 1 spec layers | 6 | **17** |
| Runtimes | Node | Node / Bun / Deno / Edge |

## 5. Codex adversarial review notes

Codex reviewed the Rust + Go web framework code across 10 angles once the initial builds passed. It flagged ~70 findings; 5 were inlined before merge:

- Header canonicalization (`http.CanonicalHeaderKey` + Rust equivalent)
- Defensive body copy on `Response.Body()`
- Defensive body copy in `recordRequest` (buffer reuse safety)
- Go module floor consistency (`go 1.25.0`)
- Import alias correctness (`kiwa_gin` / `kiwa_echo` matching actual `package` names)

The remaining findings go to v0.3+ follow-up:

- Multi-value response header collapse (Set-Cookie loses all but the last value)
- `Stop()` lifecycle activation (currently a no-op flag)
- `Send()` panic → `t.Fatalf` migration (needs `testing.TB` plumbing)
- `recordRequest` deduplication vs `integration.go`
- v0.2 docs wording for per-instance Echo logger config

## 6. Claude Code plugin — 27 skills

```bash
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

## v1.6 — scope under discussion

Candidates:

- **A** — Rust tower-http middleware test helper
- **B** — Go Fiber adapter (fasthttp architecture, needs separate mock)
- **C** — Rust contract layer (Foundry-rs / alloy.rs once 1.0 stabilizes)
- **D** — New layers (auth / job queue / cache test adapters)
- **E** — Storybook integration (v2.0 pull-forward)

Drop priorities in the [Discussions board](https://github.com/cardene777/kiwa/discussions).

## Try it

```bash
# Claude Code plugin (recommended)
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace

# Rust web frameworks
cargo add --dev kiwa-test-rs --features axum
cargo add --dev kiwa-test-rs --features actix-web

# Go web frameworks
go get github.com/cardene777/kiwa-test-go/gin
go get github.com/cardene777/kiwa-test-go/echo
```

Repo ... https://github.com/cardene777/kiwa

v1.4 shipped the polyglot promise. v1.5 makes it **usable on the web layer** — 5 languages × 4 web frameworks from one Layer 1 spec.

— [@cardene777](https://github.com/cardene777)
