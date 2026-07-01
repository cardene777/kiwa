# kiwa-test-rs

このファイルは [Keep a Changelog](https://keepachangelog.com/) スタイルで、
`kiwa-test-rs` crate の破壊的変更 / 追加機能 / 修正を release 単位で追う。

## v0.4.0 — v1.7 milestone (unreleased)

`kiwa-test-rs` v0.4.0 は v1.7 polyglot 継続深化 release。 tower-http middleware
chain test helper を追加、 v1.5 axum feature と同じ `TestApp` 契約を継続する。

### 破壊的変更

- なし。 v0.3 との source compatibility は維持 (既存 `test_app` / `TestApp` /
  `TestResponse` API 変更なし、 tower-http は新 module + 新 feature の追加のみ)。

### 追加機能

- `kiwa::tower_http::test_chain(layers, router)` 追加 — tower の `ServiceBuilder`
  layer stack を `axum::Router` に適用し、 v1.5 axum feature と同じ `TestApp`
  handle を返す middleware chain test helper
  ([#622](https://github.com/cardene777/kiwa/issues/622))。 内部で
  `Router::layer(layers)` を呼び `kiwa::axum::test_app` に delegate、 中間 layer
  (CorsLayer / TraceLayer / TimeoutLayer / CompressionLayer / SetResponseHeaderLayer /
  Auth / RateLimit 等) を in-process `oneshot` 経路で drive する。 `tower-http`
  feature で opt-in、 default OFF、 feature 内部で `axum` feature を自動有効化する
  ため tower-http 単独指定で ServiceBuilder + Router が完動する。
- `tower-http` feature 追加 — `axum` feature に依存する上乗せ opt-in flag。
  `Cargo.toml` の [features] section で `tower-http = ["axum"]` として宣言、
  build tree に tower-http crate を直接 depend せず、 test 側で
  `dev-dependencies` に `tower` + `tower-http` を指定する構成を採る (kiwa 側は
  middleware 実装を持たず薄い adapter に留める)。 v1.7-2 で構成変更、
  `tower-http` crate を feature-gated optional runtime dep に昇格
  (下記 v1.7-2 参照)。
- v1.7-2 (Issue [#623](https://github.com/cardene777/kiwa/issues/623)) —
  6 middleware 専用 helper 追加。 v1.7-1 の raw `test_chain` primitive の上に、
  intent-revealing な constructor + assertion を用意する 6 sibling submodule
  (`cors` / `trace` / `compression` / `auth` / `rate_limit` / `timeout`)。
  各 helper は tower-http 0.6 の具体 Layer 型 (`CorsLayer`, `TimeoutLayer`,
  `TraceLayer`, `CompressionLayer`, `ValidateRequestHeaderLayer` (auth),
  `RequestBodyLimitLayer` (rate_limit)) を signature に受け、 `test_chain`
  経路に delegate する。 assertion helper は observable な副作用
  (`Access-Control-Allow-Origin`, `Content-Encoding`, 408 / 503 timeout
  status, span header stamp) を single-call で検証する。
  - `kiwa::tower_http::cors::test_cors(layer, router)` +
    `assert_preflight_ok(&resp, expected_origin)` +
    `assert_actual_allow_origin(&resp, expected_origin)`
  - `kiwa::tower_http::trace::test_trace(layer, router)` +
    `assert_trace_layer_active(&resp, header)`
    (span 直接観測は tracing_test crate に外出し、 kiwa は sibling
    `SetResponseHeaderLayer` の header stamp を SSOT として検証する)
  - `kiwa::tower_http::compression::test_compression(layer, router)` +
    `assert_compressed(&resp, encoding)` (content-encoding + non-empty
    body を two-fold で assert)
  - `kiwa::tower_http::auth::with_bearer(token)` +
    `with_basic(user, pass)` — request-side の `Authorization` header pair
    を返す helper (base64 encoding は kiwa 側で行い consumer は base64
    crate 不要)
  - `kiwa::tower_http::rate_limit::exhaust(app, method, path, n)` —
    n 回 send loop で最後の response を返す driver。 layer 構築は caller
    の `ServiceBuilder` chain に任せて Clone-not-implemented な
    `RateLimitLayer` / `RequestBodyLimitLayer` 双方に対応
  - `kiwa::tower_http::timeout::test_timeout(layer, router)` +
    `assert_timed_out(&resp, expected_status)` (`REQUEST_TIMEOUT` /
    `SERVICE_UNAVAILABLE` 等 caller 指定 status を検証)
- 構成変更 (v1.7-2) — `tower-http` crate を optional runtime dep に昇格。
  6 middleware helper の public signature が `CorsLayer` / `TimeoutLayer` /
  `TraceLayer` / `CompressionLayer` 型名を露出するため、 `tower-http`
  feature を有効にすると tower-http v0.6 (features `cors + trace + timeout
  + set-header + compression-gzip + validate-request + limit + auth`) が
  transitive に build tree へ入る。 default feature 使用時は従来通り
  tower-http は含まれない。 auth helper が `base64` を必要とするため
  `dep:base64` も feature に追加している。

## v0.3.0 — v1.6 milestone (unreleased)

`kiwa-test-rs` v0.3.0 は v1.5 Codex adversarial review の findings 5 件を
消化する品質固め release。 Rust 側は source-compatible (v0.2 との破壊的変更なし)、
Go 側 (`kiwa-test-go` v0.3.0) にのみ Send() panic → t.Fatalf 移行の破壊的変更が
存在する。

### 破壊的変更

- なし。 v0.2 との source compatibility は維持。

### 追加機能

- Multi-value response header の `Vec<String>` 保持 — `Set-Cookie` 等の複数 value
  header が last-value 上書きされず `Vec<String>` として保持される
  ([#607](https://github.com/cardene777/kiwa/issues/607))。 従来の
  `TestResponse::headers()` (`HashMap<String, String>` を返す single-value 版)
  は既存 test の互換性維持のため **戻り値型も含めそのまま保持**、 新たに
  `TestResponse::headers_all()` (`HashMap<String, Vec<String>>` を返す) と
  `TestResponse::headers_all_values(key)` (`Option<Vec<String>>`) を追加した。
  `Set-Cookie` の全 value を取りたい場合は `headers_all_values("set-cookie")`
  を使う。 同 API は `RecordedRequest` にも `headers` (single) + `headers_all`
  (multi) 両方の field として反映されている。
- `TestApp::stop()` lifecycle activation — post-stop `send()` 呼出は
  `panic!("kiwa: TestApp already stopped")` で明示 panic 化
  ([#609](https://github.com/cardene777/kiwa/issues/609))。 従来は no-op flag のみ
  で post-stop invoke が silent success していた。 Rust では `t.Fatalf` 相当が
  存在しないため panic で test 失敗を強制する (Go の `t.Fatalf` と対比、 test
  runtime が正しく test 失敗として扱う)。
- `fold_headers` helper で response header dedup logic を統合
  ([#611](https://github.com/cardene777/kiwa/issues/611))。 `axum.rs` / `actix.rs` /
  `integration.rs` の 3 か所で重複していた header 集約 logic を `recorder.rs` の
  `fold_headers` に 1 か所集約。 public API surface 変更なし。

### 修正

- v1.4 + v1.5 全 adapter で body defensive copy 徹底
  ([#608](https://github.com/cardene777/kiwa/issues/608))。 `TestResponse::body()` /
  `RecordedRequest::body` の両側で buffer reuse safety を確保。

## v0.2.0 — v1.5 milestone

- `kiwa::axum::test_app` 追加 — in-process axum `Router` adapter via
  `tower::ServiceExt::oneshot` ([#592](https://github.com/cardene777/kiwa/issues/592))。
  `axum` feature で opt-in、 default OFF。
- `kiwa::actix::test_app` 追加 — in-process actix-web `App` adapter via
  `actix_web::test::call_service` ([#593](https://github.com/cardene777/kiwa/issues/593))。
  `actix-web` feature で opt-in、 default OFF。 `App<T>` の non-`Clone` 制約に
  対応するため **factory closure** (`Fn() -> App<T>`) 受入。

## v0.1.0 — v1.4 milestone

- `setup_env` + `Mode` (`Mock` / `Live`) + `assert_kiwa_eq!` /
  `assert_kiwa_close!` macro + `Drop` cleanup + `kiwa::integration::mock_server`
  (hyper-based) + request recorder + 404 fallback
  ([#577](https://github.com/cardene777/kiwa/issues/577))。 `integration` feature
  は default ON。
