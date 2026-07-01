# x.com 投稿用下書き — 日本語 thread (v1.7 polyglot 継続深化 voice)

> 投稿先 ... [@cardene777](https://x.com/cardene777)
> Voice ... 本人名義 / 個人 dev 視点 / 「v1.5 拡張版」 maker トーン
> 全 8 ツイート、 番号 [1/8] 付き

---

## [1/8]

polyglot test toolchain 「kiwa」 v1.7 (6/6 resolved) が land しました。

Rust **tower-http middleware chain** + Go **Fiber (fasthttp)** で polyglot 継続深化、 **6 web framework 対応** に到達 (axum + actix + tower-http + gin + echo + fiber)。

https://github.com/cardene777/kiwa

#OSS #testing

---

## [2/8]

v1.7 で増えたもの。

- web framework ... 4 → 6 (+ tower-http + fiber)
- adapter 数 ... 5 → 7
- Rust middleware helper ... 0 → 6 (Cors / Trace / Compression / Auth / RateLimit / Timeout)
- Layer 1 spec layer ... 17 → 19
- plugin version ... 1.6.0 → 1.7.0

---

## [3/8]

Rust tower-http (kiwa-test-rs v0.4) ...

- `test_chain(layers, router)` ... `ServiceBuilder` の Layer stack を axum Router に適用
- 主要 6 middleware helper ... Cors / Trace / Compression / Auth / RateLimit / Timeout 専用
- `--features tower-http` opt-in、 default OFF

---

## [4/8]

Go Fiber (kiwa-test-go v0.4) ...

- `kiwa-test-go/fiber` subpackage ... fasthttp.RequestCtx 経由 in-process dispatch
- fasthttp 互換 API ... `NormalizeRequest` / `NormalizeResponse` で fasthttp 直接 API を kiwa 契約 normalize
- gin/echo/mock_server と field-by-field parity 保証

---

## [5/8]

例 ... tower-http Cors helper

```rust
let resp = cors::test_cors(cors_layer, request).await;
cors::assert_preflight_ok(&resp);
```

middleware 単体テストが 1 行で書ける形。 6 middleware 全部同じ pattern。

---

## [6/8]

例 ... Fiber test

```go
app := fiber.New()
app.Get("/health", handler)
srv := kiwa_fiber.NewTestServer(t, app)
resp := srv.Request(kiwa.MethodGET, "/health").Send()
```

fasthttp base だが gin/echo と同じ API surface で書ける。

---

## [7/8]

Codex adversarial review が v1.7-4 (Fiber) で 2 findings 検出 → chain 内 fix (Stop 契約 drift / Timeout coverage 貧弱)、 v1.7-5 は blocking なし。 全 6 sub で review pass。

---

## [8/8]

v1.8 候補 = 新 layer (auth + job queue + cache) / Rust contract layer (alloy.rs 解禁済) / Storybook / Go Iris + Chi。

要望は Discussions で。

https://github.com/cardene777/kiwa/discussions

#testing #rust #golang
