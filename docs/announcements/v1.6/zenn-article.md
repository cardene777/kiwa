---
title: "kiwa v1.6 — 全 adapter parity 達成、 v1.5 の 65 件 findings を 6 topic に集約消化した"
emoji: "🌱"
type: "tech"
topics: ["testing", "oss", "rust", "go", "codereview"]
published: false
---

# 概要

polyglot test toolchain `kiwa` の v1.6 milestone (6/6 Issue resolved) が land しました。

v1.6 は **品質固め** milestone です。 v1.5 (polyglot 縦深化) の Codex adversarial review が検出した ~65 件 findings を 6 topic に集約消化し、 全 adapter (v1.4 mock_server + Rust axum/actix + Go gin/echo) で **v1.4 mock_server 基準の parity** を達成しました。

```bash
cargo add --dev kiwa-test-rs  # v0.3、 axum/actix feature 継続
go get github.com/cardene777/kiwa-test-go  # v0.3、 gin/echo subpackage 継続
```

## v1.6 で fix した 6 topic

### 1. multi-value response header の array 保持 (#607)

現状 `headers[strings.ToLower(k)] = v[len(v)-1]` で Set-Cookie 等 multi-value header が最後の値のみ保持されていた → array 保持に変更。 全 5 adapter で `HeadersAll` + `Cookies` API を追加、 backward compat は `Headers()` last-value-wins 維持。

```go
// Before: Set-Cookie が 2 個あっても最後の 1 個しか返らない
resp.Headers()["set-cookie"]  // "session=xyz" のみ

// After: multi-value を全部返す
resp.HeadersAll("Set-Cookie")  // ["auth=abc", "session=xyz"]
resp.Cookies()                 // 便利 alias
```

### 2. body defensive copy 全 point (#608)

`Response.Body()` / `recordRequest.Body` の defensive copy を全 adapter で徹底。 v1.5-3/-4 で inline fix 済だった gin/echo に加え、 v1.4 mock_server + Rust axum/actix にも横展開。 caller buffer 再利用による retroactive corruption を防止。

### 3. Stop() lifecycle 活性化 (#609)

現状 v0.2 で `Stop()` は no-op flag だった → Send() 側で `stopped` 判定を追加、 post-Stop Send は明示 error 化 (Rust: panic / Go: `t.Fatalf`)。 lifecycle contract を v1.4 と揃え、 build → exercise → Stop → post-Stop error を全 adapter で明示。

### 4. Send panic → t.Fatalf 移行 (#610)

Go gin/echo adapter の `Send()` が `http.NewRequest` fail 時に `panic` していたのを、 `NewTestServer` で保持する `testing.TB` 経由で `t.Fatalf` に切替。 test failure を diagnostic 化、 v1.4 mock_server と失敗経路 ergonomics 統一。

### 5. recordRequest 重複削減 = recorder factor (#611)

Rust axum/actix と Go gin/echo で `recordRequest` helper が独立実装されていた → 共通 module に factor して dedup。

- Go ... `kiwa-go/internal/recorder/` (`Snapshot` / `FromServer` / `FromClient` / `Log` を SSOT 化)
- Rust ... `kiwa-rs/src/recorder.rs` (`fold_headers` generic helper で 3 backend の header 変換 loop 統一)

同時に v1.6-2 で post-merge 検出された 5 hazards も統合 fix (MockResponse aliasing / snapshot deep copy / Request.Body ingress copy / Rust test 実質化 / Go integration test 実質化)。

### 6. docs 整合化 (#612)

- Echo per-instance logger 記述の矛盾修正
- README + rustdoc + godoc の API surface 記述整合
- v1.5 announcement の findings note を v1.6 完遂状態に update
- CHANGELOG 追加 (v0.3 breaking change 明示)

## v1.5 → v1.6 delta

| 軸 | v1.5 | v1.6 |
|---|---|---|
| adapter 数 | 5 (v1.4 mock_server + Rust axum/actix + Go gin/echo) | 5 |
| parity 状態 | contract 揺れ ~65 findings | ✅ 全 adapter v1.4 mock_server parity 達成 |
| multi-value header | last-value-wins のみ | array 保持 + `HeadersAll` / `Cookies` |
| Stop lifecycle | no-op flag | activate、 post-Stop 明示 error |
| Go Send() failure | panic (stack trace) | `t.Fatalf` (diagnostic) |
| recordRequest 重複 | 独立 4 実装 | Go internal/recorder + Rust src/recorder.rs = SSOT |
| plugin version | 1.5.0 | **1.6.0** |

## breaking change

- **Go** (`kiwa-test-go` v0.3) ... `Send()` が panic から `t.Fatalf` に変更、 `recover()` していた test code は書き直し必要
- **Rust** (`kiwa-test-rs` v0.3) ... source-compatible、 breaking なし (recorder factor は internal のため)

## v1.7 候補

- polyglot 継続深化 (Rust tower-http middleware / Go Fiber)
- 新 layer 追加 (auth / job queue / cache test adapter)
- Rust contract layer (Foundry-rs / alloy.rs v1.0 安定後)
- Storybook integration (v2.0 繰上げ)

要望は [GitHub Discussions](https://github.com/cardene777/kiwa/discussions) で集めます。

## 試す

```bash
# Claude Code plugin (推奨)
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace

# Rust (v0.3、 source-compatible)
cargo add --dev kiwa-test-rs --features axum
cargo add --dev kiwa-test-rs --features actix-web

# Go (v0.3、 Send panic → t.Fatalf breaking change あり)
go get github.com/cardene777/kiwa-test-go/gin@v0.3.0
go get github.com/cardene777/kiwa-test-go/echo@v0.3.0
```

repo ... https://github.com/cardene777/kiwa

v1.5 で「polyglot Web layer 実用化」 を出した後、 v1.6 で **contract 揺れをゼロに固めた** milestone です。 「機能追加」 milestone (v1.1-v1.5) から一歩引いて、 **品質保証** milestone として位置付けています。
