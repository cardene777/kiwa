# x.com draft — English thread (v1.7 polyglot deepening voice)

> Posting from ... [@cardene777](https://x.com/cardene777)
> Voice ... first-person / solo dev / "v1.5 extension" maker tone
> Limit ... 280 chars / tweet, thread of 8

---

## [1/8]

kiwa v1.7 just landed (6/6 Issue resolved). Rust **tower-http middleware chain** + Go **Fiber (fasthttp)** — polyglot goes to **6 web frameworks** (axum + actix + tower-http + gin + echo + fiber).

https://github.com/cardene777/kiwa

#OSS #testing

---

## [2/8]

What grew in v1.7:

- Web frameworks: 4 → 6 (+ tower-http + fiber)
- Adapter count: 5 → 7
- Rust middleware helpers: 0 → 6 (Cors / Trace / Compression / Auth / RateLimit / Timeout)
- Layer 1 spec layers: 17 → 19
- Plugin version: 1.6.0 → 1.7.0

---

## [3/8]

Rust tower-http (kiwa-test-rs v0.4):

- `test_chain(layers, router)` — apply `ServiceBuilder` Layer stack to axum Router
- 6 dedicated middleware helpers — Cors / Trace / Compression / Auth / RateLimit / Timeout
- `--features tower-http` opt-in, default OFF

---

## [4/8]

Go Fiber (kiwa-test-go v0.4):

- `kiwa-test-go/fiber` subpackage — fasthttp.RequestCtx in-process dispatch
- fasthttp compat API — `NormalizeRequest` / `NormalizeResponse` normalize fasthttp direct API to kiwa contract
- Field-by-field parity guaranteed with gin/echo/mock_server

---

## [5/8]

Example — tower-http Cors helper:

```rust
let resp = cors::test_cors(cors_layer, request).await;
cors::assert_preflight_ok(&resp);
```

Middleware unit tests in one line. Same pattern across all 6 middleware.

---

## [6/8]

Example — Fiber test:

```go
app := fiber.New()
app.Get("/health", handler)
srv := kiwa_fiber.NewTestServer(t, app)
resp := srv.Request(kiwa.MethodGET, "/health").Send()
```

fasthttp underneath but same API surface as gin/echo.

---

## [7/8]

Codex adversarial review caught 2 findings in v1.7-4 (Fiber) — Stop contract drift + weak Timeout coverage, both fixed in-chain. v1.7-5 was no-blocking. All 6 subs passed review.

---

## [8/8]

v1.8 candidates: new layers (auth + job queue + cache) / Rust contract layer (alloy.rs stable) / Storybook / Go Iris + Chi.

Drop requests on Discussions:

https://github.com/cardene777/kiwa/discussions

#testing #rustlang #golang
