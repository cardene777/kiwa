# x.com draft — English thread (v1.5 polyglot deepening voice)

> Posting from ... [@cardene777](https://x.com/cardene777)
> Voice ... first-person / solo dev / "v1.4 web extension" maker tone
> Video ... `assets/kiwa-promo-en.mp4` (reused) attached to tweet 1
> Limit ... 280 chars / tweet, thread of 8

---

## [1/8] (video attached)

kiwa v1.5 just landed (6/6 Issue resolved) — Rust + Go web framework adapters for **axum / actix-web / Gin / Echo** are here.

v1.4 shipped 5-language polyglot; v1.5 makes it **actually usable on the web layer**.

https://github.com/cardene777/kiwa

#OSS #testing

---

## [2/8]

What grew in v1.5:

- Rust web frameworks: 0 → 2 (axum + actix-web)
- Go web frameworks: 0 → 2 (Gin + Echo)
- Layer 1 spec layers: 13 → 17 (+4 web layers)
- Plugin version: 1.4.0 → 1.5.0

---

## [3/8]

Rust (kiwa-test-rs v0.2):

- `axum` feature — in-process via `tower::ServiceExt::oneshot` (no real port bind)
- `actix-web` feature — same shape via `actix_web::test::call_service`
- Both opt-in (default OFF), unit-only users unaffected

---

## [4/8]

Go (kiwa-test-go v0.2):

- `kiwa-test-go/gin` subpackage — wraps `*gin.Engine`
- `kiwa-test-go/echo` subpackage — wraps `*echo.Echo`
- Both use `httptest.NewRecorder` + `ServeHTTP` (in-process)
- `TestServer` contract mirrors 1:1 across gin/echo

---

## [5/8]

`/kiwa-design` adds 4 layers (`rust-axum` / `rust-actix-web` / `go-gin` / `go-echo`).

Same feature → parallel spec → `/kiwa-rust --mode {axum|actix-web}` + `/kiwa-go --mode {gin|echo}` generates 4 test files.

---

## [6/8]

Codex adversarial review detected ~70 findings across 10 angles once the code was up.

`Header canonicalize` / defensive body copies / `recordRequest` copy were inlined; multi-value header collapse + Stop lifecycle + Send t.Fatalf move to v0.3+.

---

## [7/8]

Why polyglot web matters:

Real dApp/SaaS stacks mix Rust crypto libs, Go gateways, TS SPAs, Python services, Solidity contracts. v1.5 puts kiwa at **5 languages × 4 web frameworks** from one spec.

---

## [8/8]

v1.6 candidates: Rust tower-http middleware / Go Fiber / Rust contract layer (waiting on alloy.rs v1.0) / new layers (auth + job + cache) / Storybook.

Drop requests on Discussions:

https://github.com/cardene777/kiwa/discussions

#testing #rustlang #golang
