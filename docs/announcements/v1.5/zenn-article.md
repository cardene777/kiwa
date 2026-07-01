---
title: "kiwa v1.5 — Rust + Go の web framework adapter (axum / actix-web / Gin / Echo) が揃った"
emoji: "🌱"
type: "tech"
topics: ["testing", "oss", "rust", "go", "webframework"]
published: false
---

# 概要

polyglot test toolchain `kiwa` の v1.5 milestone (6/6 Issue resolved) が land しました。

v1.4 で land した Rust + Go の unit + integration MVP を、 **4 大 web framework (axum / actix-web / Gin / Echo)** に拡張。 「polyglot 5 言語完成」 (v1.4) から「polyglot 5 言語 × Web layer」 (v1.5) に進化しました。

```bash
# Rust
cargo add --dev kiwa-test-rs --features axum
cargo add --dev kiwa-test-rs --features actix-web

# Go
go get github.com/cardene777/kiwa-test-go/gin
go get github.com/cardene777/kiwa-test-go/echo
```

## v1.5 で land した 2 つの軸

### 1. Rust web framework adapter (`kiwa-test-rs` v0.2)

```rust
use kiwa_test_rs::axum::{test_app, HttpMethod};
use axum::{Router, routing::get};

#[tokio::test]
async fn health_returns_ok() {
    let router = Router::new().route("/health", get(|| async { "ok" }));
    let app = test_app(router);
    let resp = app.request(HttpMethod::GET, "/health").send().await;
    assert_kiwa_eq!(resp.status_code(), 200);
    assert_kiwa_eq!(resp.body_string(), "ok");
}
```

axum + actix-web を **feature flag opt-in** で提供 (default OFF)、 `tower::ServiceExt::oneshot` / `actix_web::test::call_service` 経由で **in-process invoke** (real port bind なし)。

### 2. Go web framework adapter (`kiwa-test-go` v0.2)

```go
import (
    "testing"
    kiwa_gin "github.com/cardene777/kiwa-test-go/gin"
    kiwa "github.com/cardene777/kiwa-test-go"
)

func TestCounter(t *testing.T) {
    engine := gin.New()
    engine.GET("/count", handler)
    srv := kiwa_gin.NewTestServer(t, engine)
    resp := srv.Request(kiwa.MethodGET, "/count").Send()
    kiwa.AssertEqual(t, resp.StatusCode(), 200)
}
```

Gin + Echo を subpackage で提供 (`kiwa-test-go/gin` / `kiwa-test-go/echo`)、 `httptest.NewRecorder` + `ServeHTTP` 経由で **in-process invoke**。 `TestServer` 契約は Gin/Echo で 1:1 mirror、 同じ builder API (`.Header().Body().JSON().Send()`)。

## Layer 1 spec + skill chain も 4 layer 拡張

`/kiwa-design --layer rust-axum` / `--layer rust-actix-web` / `--layer go-gin` / `--layer go-echo` の 4 layer を追加。

```bash
# 1 機能を 4 web framework で同時 spec → test
/kiwa-design --layer rust-axum --module counter-api
/kiwa-design --layer rust-actix-web --module counter-api
/kiwa-design --layer go-gin --module counter-api
/kiwa-design --layer go-echo --module counter-api

# Layer 2 skill で mode flag 指定して並列生成
/kiwa-rust --module counter-api --mode axum
/kiwa-rust --module counter-api --mode actix-web
/kiwa-go --module counter-api --mode gin
/kiwa-go --module counter-api --mode echo
```

`/kiwa-review` も 4 layer 対応、 spec vs test 整合 review を統一経路で扱えます。

## 統計

| 軸 | v1.4 | v1.5 | 差分 |
|---|---|---|---|
| 対応言語 | 5 (TS / Python / Solidity + Rust + Go) | 5 | (継続) |
| Rust web framework | 0 | 2 (axum + actix-web) | +2 |
| Go web framework | 0 | 2 (Gin + Echo) | +2 |
| Cross-language package | 3 (PyPI + crates.io + pkg.go.dev) | 3 | (継続) |
| Claude Code skill | 27 | 27 | (継続、 既存拡張) |
| Layer 1 spec layer | 13 | 17 | +4 (4 web layer) |
| plugin version | 1.4.0 | **1.5.0** | minor bump |

## v1.6 候補

- Rust tower-http middleware test helper — v0.3+
- Go Fiber adapter (fasthttp 別 architecture) — v0.3+
- Rust contract layer (Foundry-rs / alloy.rs) — alloy.rs v1.0 安定後
- 新 layer (auth / job queue / cache) — 主軸候補
- Storybook integration — v2.0 繰上げ

要望は [GitHub Discussions](https://github.com/cardene777/kiwa/discussions) で集めます。

## 試す

```bash
# Claude Code plugin (推奨)
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace

# Rust web framework
cargo add --dev kiwa-test-rs --features axum
cargo add --dev kiwa-test-rs --features actix-web

# Go web framework
go get github.com/cardene777/kiwa-test-go/gin
go get github.com/cardene777/kiwa-test-go/echo
```

repo ... https://github.com/cardene777/kiwa

v1.4 で「polyglot 5 言語完成」 と書いた次の一歩、 **Web layer で実用可能** な状態まで縦深化しました。
