---
title: "kiwa v1.7 — Rust tower-http + Go Fiber で polyglot 継続深化、 6 web framework 対応に到達した"
emoji: "🌱"
type: "tech"
topics: ["testing", "oss", "rust", "go", "middleware"]
published: false
---

# 概要

polyglot test toolchain `kiwa` の v1.7 milestone (6/6 Issue resolved) が land しました。

v1.5 (axum + actix-web + Gin + Echo) の polyglot 4 web framework を **6 web framework** に拡張しました。 Rust 側は **tower-http middleware chain** (Cors / Trace / Compression / Auth / RateLimit / Timeout の 6 middleware helper 付き)、 Go 側は **Fiber** (fasthttp architecture の別 mock 実装 + fasthttp 互換 API) を land。

```bash
# Rust v0.4
cargo add --dev kiwa-test-rs --features tower-http

# Go v0.4
go get github.com/cardene777/kiwa-test-go/fiber
```

## v1.7 で land した 2 つの軸

### 1. Rust tower-http (`kiwa-test-rs` v0.4)

```rust
use kiwa_test_rs::tower_http::{test_chain, cors, timeout};
use tower_http::cors::CorsLayer;
use tower::ServiceBuilder;

// middleware chain を axum Router に適用して in-process invoke
let layers = ServiceBuilder::new()
    .layer(CorsLayer::permissive())
    .layer(TimeoutLayer::new(Duration::from_secs(5)));
let app = test_chain(layers, router);

// 個別 middleware helper で assertion
let resp = cors::test_cors(cors_layer, request).await;
cors::assert_preflight_ok(&resp);
```

- **`test_chain(layers, router)`** ... `ServiceBuilder` の Layer stack を axum Router に適用、 v1.5 axum feature と同じ TestApp 契約
- **主要 6 middleware helper** ... `cors::{test_cors, assert_preflight_ok, assert_actual_allow_origin}` / `trace::{test_trace, assert_trace_layer_active}` / `compression::{test_compression, assert_compressed}` / `auth::{with_bearer, with_basic}` / `rate_limit::exhaust` / `timeout::{test_timeout, assert_timed_out}`
- **PoC** ... `examples/rust-tower-http-poc/` (axum + tower-http 6 middleware chain の real-world 例)
- feature opt-in (`--features tower-http`、 default OFF)

### 2. Go Fiber (`kiwa-test-go` v0.4)

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
```

- **`kiwa-test-go/fiber` subpackage** ... `*fiber.App` を fasthttp.RequestCtx 経由で in-process dispatch (httptest 互換不可のため fasthttp base 別 mock 実装)
- **fasthttp 互換 API** ... `NormalizeRequest(*fasthttp.Request)` + `NormalizeResponse(*fasthttp.Response)` で fasthttp 直接 API を kiwa 契約 (RecordedRequest / Response) に normalize
- **契約 parity 保証** ... gin/echo/mock_server と field-by-field 一致 (header lowercase / body defensive copy / path composition / Set-Cookie wire-order)
- **PoC** ... `examples/go-fiber-poc/` (fasthttp base の real-world 例)

## Layer 1 spec + skill chain も 2 layer 拡張

`/kiwa-design --layer rust-tower-http` / `--layer go-fiber` の 2 layer を追加。

```bash
# 1 機能を 6 web framework で並列 spec → test 生成
/kiwa-design --layer rust-axum --module counter-api
/kiwa-design --layer rust-actix-web --module counter-api
/kiwa-design --layer rust-tower-http --module counter-api  # new
/kiwa-design --layer go-gin --module counter-api
/kiwa-design --layer go-echo --module counter-api
/kiwa-design --layer go-fiber --module counter-api  # new

# Layer 2 skill で mode flag 指定して並列生成
/kiwa-rust --module counter-api --mode tower-http  # new
/kiwa-go --module counter-api --mode fiber  # new
```

`/kiwa-review` も 6 web layer + 4 polyglot base = 10 layer 対応。

## 統計

| 軸 | v1.6 | v1.7 |
|---|---|---|
| adapter 数 | 5 (v1.4 mock_server + Rust axum/actix + Go gin/echo) | 7 (+ Rust tower-http + Go fiber) |
| web framework 対応 | 4 (axum + actix + gin + echo) | **6 (+ tower-http + fiber)** |
| Rust middleware helper | 0 | 6 (Cors / Trace / Compression / Auth / RateLimit / Timeout) |
| Layer 1 spec layer | 17 | **19** (+ rust-tower-http + go-fiber) |
| plugin version | 1.6.0 | **1.7.0** |

## Codex adversarial review notes

- v1.7-4 (Fiber subpackage) ... 2 findings (H1 Stop 契約 drift / M1 Timeout coverage 貧弱) を chain 内 fix
- v1.7-5 (fasthttp 互換) ... blocking なし、 parity guardrail test で field-by-field 一致確認
- v1.7 全体 ... Rust tower-http 3 sub + Go Fiber 2 sub + Layer 1/skill 1 sub の 6 sub 連続 land、 全 sub で Codex review pass

## v1.8 候補

- 新 layer (auth / job queue / cache test adapter)
- Rust contract layer (Foundry-rs / alloy.rs v1.0 安定済)
- Storybook integration (v2.0 繰上げ)
- Go Iris / Chi 対応 (Chi は net/http 互換で mock_server 使用可)

要望は [GitHub Discussions](https://github.com/cardene777/kiwa/discussions) で集めます。

## 試す

```bash
# Claude Code plugin (推奨)
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace

# Rust tower-http
cargo add --dev kiwa-test-rs --features tower-http

# Go Fiber
go get github.com/cardene777/kiwa-test-go/fiber
```

repo ... https://github.com/cardene777/kiwa

v1.5 で「polyglot Web layer 実用化」、 v1.6 で「adapter parity 固め」、 v1.7 で **「polyglot 6 web framework 対応」** まで到達しました。 Rust middleware chain + Go fasthttp architecture の 2 大深化で、 v1.5 の 4 web framework から 50% 拡大です。
