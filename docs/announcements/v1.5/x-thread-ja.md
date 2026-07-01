# x.com 投稿用下書き — 日本語 thread (v1.5 polyglot 縦深化 voice)

> 投稿先 ... [@cardene777](https://x.com/cardene777)
> Voice ... 本人名義 / 個人 dev 視点 / 「v1.4 の Web 拡張版」 maker トーン
> 動画 ... `assets/kiwa-promo-ja.mp4` (再利用) を 1 ツイート目に添付
> 全 8 ツイート、 番号 [1/8] 付き

---

## [1/8] (動画添付)

polyglot test toolchain 「kiwa」 v1.5 (6/6 resolved) が land しました。

Rust + Go の **4 大 web framework (axum / actix-web / Gin / Echo)** adapter を追加、 v1.4 の polyglot 5 言語を「Web layer で実用可能」 まで縦深化。

https://github.com/cardene777/kiwa

#OSS #testing

---

## [2/8]

v1.5 で増えたもの。

- Rust web framework ... 0 → 2 (axum + actix-web)
- Go web framework ... 0 → 2 (Gin + Echo)
- Layer 1 spec layer ... 13 → 17 (+4 web layer)
- plugin version ... 1.4.0 → 1.5.0

---

## [3/8]

Rust (kiwa-test-rs v0.2) ...

- `axum` feature ... `tower::ServiceExt::oneshot` 経由で in-process invoke (real port bind なし)
- `actix-web` feature ... `actix_web::test::call_service` 経由で同様
- 両方 feature opt-in (default OFF)、 unit-only 利用者は影響なし

---

## [4/8]

Go (kiwa-test-go v0.2) ...

- `kiwa-test-go/gin` subpackage ... `gin.Engine` を test server bind
- `kiwa-test-go/echo` subpackage ... `echo.Echo` を test server bind
- 両方 `httptest.NewRecorder` + `ServeHTTP` 経由で in-process invoke
- Gin / Echo で TestServer 契約 1:1 mirror

---

## [5/8]

`/kiwa-design` に 4 layer 追加 (`rust-axum` / `rust-actix-web` / `go-gin` / `go-echo`)。

1 機能を 4 web framework で同時 spec → `/kiwa-rust --mode {axum|actix-web}` + `/kiwa-go --mode {gin|echo}` で並列 test 生成。

---

## [6/8]

Codex adversarial review が build 出来上がりから 10 review angle 並列で ~70 findings 検出。

`Header canonicalize` / `Body defensive copy` / `recordRequest body copy` 等の主要 fix は inline 反映、 Set-Cookie collapse / Stop lifecycle / Send t.Fatalf は v0.3+ follow-up。

---

## [7/8]

polyglot Web の意義 ...

Rust crypto / Go gateway / TS SPA / Python service / Solidity contract の混在は普通の状況。 v1.5 で kiwa は **5 言語 × 4 web framework** を 1 spec から並列生成できる範囲まで到達。

---

## [8/8]

v1.6 候補 = Rust tower-http / Go Fiber / Rust contract layer (Foundry-rs / alloy.rs 待ち) / 新 layer (auth + job queue + cache) / Storybook integration。

要望は Discussions で。

https://github.com/cardene777/kiwa/discussions

#testing #rust #golang
