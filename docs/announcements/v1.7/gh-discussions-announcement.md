# 🌱 kiwa v1.7 — polyglot continues (Rust tower-http + Go Fiber, 6 web frameworks total)

The v1.7 milestone (**6/6 GitHub Issues resolved**) just landed. Rust `tower-http` (middleware chain + 6 helper) and Go Fiber (fasthttp base) extend the v1.5 4-web-framework polyglot to **6 web frameworks**.

If v1.5 was "polyglot promise on the Web layer" and v1.6 was "adapter parity lockdown", v1.7 is **"polyglot goes wider"** — Rust web middleware + Go fasthttp architecture.

## 1. Rust tower-http (`kiwa-test-rs` v0.4)

```rust
use kiwa_test_rs::tower_http::{test_chain, cors, timeout, auth};
use tower_http::cors::CorsLayer;
use tower::ServiceBuilder;

// Chain helper: apply Layer stack to axum Router
let layers = ServiceBuilder::new()
    .layer(CorsLayer::permissive())
    .layer(TimeoutLayer::new(Duration::from_secs(5)));
let app = test_chain(layers, router);

// Individual middleware helpers
let resp = cors::test_cors(cors_layer, request).await;
cors::assert_preflight_ok(&resp);

let auth_req = auth::with_bearer("token123", request);
```

- `test_chain(layers, router)` — `ServiceBuilder` Layer stack applied to axum Router, shares TestApp contract with v1.5 axum feature
- 6 middleware helpers:
  - `cors::{test_cors, assert_preflight_ok, assert_actual_allow_origin}`
  - `trace::{test_trace, assert_trace_layer_active}`
  - `compression::{test_compression, assert_compressed}`
  - `auth::{with_bearer, with_basic}` (base64 encoding internal)
  - `rate_limit::exhaust` (Clone-safe driver)
  - `timeout::{test_timeout, assert_timed_out}`
- PoC ... `examples/rust-tower-http-poc/` (axum + tower-http 6-middleware ProfileStore + profile_chain example)
- Feature opt-in: `--features tower-http` (default OFF, auto-enables `axum` feature)

## 2. Go Fiber (`kiwa-test-go` v0.4)

```go
import (
    kiwa "github.com/cardene777/kiwa-test-go"
    kiwa_fiber "github.com/cardene777/kiwa-test-go/fiber"
    "github.com/gofiber/fiber/v2"
)

func TestHealth(t *testing.T) {
    app := fiber.New()
    app.Get("/health", func(c *fiber.Ctx) error {
        return c.SendString("ok")
    })

    srv := kiwa_fiber.NewTestServer(t, app)
    resp := srv.Request(kiwa.MethodGET, "/health").Send()
    kiwa.AssertEqual(t, resp.StatusCode(), 200)
}

// fasthttp compat API
req := &fasthttp.Request{}
req.SetRequestURI("/api/data")
recorded := kiwa_fiber.NormalizeRequest(req)
// recorded is now kiwa.RecordedRequest, field-by-field parity with gin/echo/mock_server
```

- `kiwa-test-go/fiber` subpackage — `*fiber.App` driven via `fasthttp.RequestCtx` in-process dispatch (`httptest.NewRecorder` not compatible with fasthttp)
- `NormalizeRequest(*fasthttp.Request)` + `NormalizeResponse(*fasthttp.Response)` — normalize fasthttp direct API to kiwa contract
- Contract parity guaranteed with gin/echo/mock_server: header lowercase, body defensive copy, path composition, Set-Cookie wire-order
- PoC ... `examples/go-fiber-poc/` (fasthttp-based real-world example)

## 3. Layer 1 spec + skill chain (2 new layers)

`/kiwa-design` gains 2 layers:

```bash
/kiwa-design --layer rust-tower-http --module counter-api
/kiwa-design --layer go-fiber --module counter-api
```

Layer 2 skills gain new `--mode` flags:

```bash
/kiwa-rust --module counter-api --mode tower-http
/kiwa-go --module counter-api --mode fiber
```

`/kiwa-review` covers all 6 web framework layers + 4 polyglot base = 10 layers total.

## 4. v1.4 → v1.7 progression

| Axis | v1.4 | v1.7 |
|---|---|---|
| Languages | 5 (TS / Python / Solidity / Rust / Go) | 5 |
| Web frameworks | 0 Rust/Go (v1.1-v1.3 had 7 Node) | **6 Rust/Go + 7 Node = 13** |
| Rust middleware helpers | 0 | 6 (Cors / Trace / Compression / Auth / RateLimit / Timeout) |
| Cross-language packages | 3 | 3 |
| Claude Code skills | 27 | 27 |
| Layer 1 spec layers | 13 | **19** |
| Plugin version | 1.4.0 | **1.7.0** |

## 5. Codex adversarial review

- **v1.7-1 (tower-http chain)** ... blocking issues 0
- **v1.7-2 (6 middleware)** ... 2 self-review fixes (UTF-8 boundary panic in `timeout::assert_timed_out`, GitGuardian credential flag)
- **v1.7-3 (PoC + docs)** ... blocking issues 0
- **v1.7-4 (Fiber subpackage)** ... 2 findings fixed in-chain: H1 Stop contract drift (Fiber `OnShutdown` hook side-effect removed to match gin/echo bit-flip-only), M1 Timeout coverage weakness (slow-handler regression trap added)
- **v1.7-5 (fasthttp compat)** ... blocking issues 0, parity guardrail tests confirm field-by-field match
- **v1.7-6 (skill chain)** ... docs-only PR, self-review pass

## 6. Claude Code plugin — 27 skills

```bash
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

## v1.8 — scope under discussion

Candidates:

- **A** — New layers (auth / job queue / cache test adapters)
- **B** — Rust contract layer (Foundry-rs / alloy.rs — now stable)
- **C** — Storybook integration (v2.0 pull-forward)
- **D** — Go Iris + Chi (Chi is net/http compatible, could reuse mock_server)

Drop priorities on the [Discussions board](https://github.com/cardene777/kiwa/discussions).

## Try it

```bash
# Claude Code plugin (recommended)
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace

# Rust tower-http (v0.4)
cargo add --dev kiwa-test-rs --features tower-http

# Go Fiber (v0.4)
go get github.com/cardene777/kiwa-test-go/fiber
```

Repo ... https://github.com/cardene777/kiwa

v1.5 shipped polyglot on the Web layer. v1.6 locked down adapter parity. v1.7 **widens the polyglot** — 6 web frameworks (+ Rust web middleware + Go fasthttp architecture) from one Layer 1 spec.

— [@cardene777](https://github.com/cardene777)
