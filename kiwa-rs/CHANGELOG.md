# kiwa-test-rs

このファイルは [Keep a Changelog](https://keepachangelog.com/) スタイルで、
`kiwa-test-rs` crate の破壊的変更 / 追加機能 / 修正を release 単位で追う。

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
