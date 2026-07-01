# x.com 投稿用下書き — 日本語 thread (v1.6 品質固め voice)

> 投稿先 ... [@cardene777](https://x.com/cardene777)
> Voice ... 本人名義 / 個人 dev 視点 / 「品質固め milestone」 maker トーン
> 全 8 ツイート、 番号 [1/8] 付き

---

## [1/8]

polyglot test toolchain 「kiwa」 v1.6 (6/6 resolved) が land しました。

v1.5 で検出された **~65 件 Codex findings を 6 topic に集約消化**、 全 adapter (v1.4 mock_server + Rust axum/actix + Go gin/echo) で v1.4 mock_server 基準の **parity 達成**。

https://github.com/cardene777/kiwa

#OSS #testing

---

## [2/8]

v1.6 は「品質固め」 milestone です。

v1.1-v1.5 は機能追加中心 (framework / ORM / polyglot / Web framework) でしたが、 v1.5 で adapter contract に semantics 揺れが ~65 件検出されたので、 v1.6 で **一度立ち止まって全部固める** 判断。

---

## [3/8]

fix した 6 topic ...

1. Set-Cookie 等 multi-value header の array 保持
2. body defensive copy 全 point
3. Stop() lifecycle 活性化 (post-Stop 明示 error)
4. Go Send panic → t.Fatalf 移行
5. recordRequest 重複削減 (Go internal/recorder + Rust src/recorder.rs)
6. docs 整合化

---

## [4/8]

例 ... Set-Cookie multi-value 保持

```go
// Before v1.6
resp.Headers()["set-cookie"]
// "session=xyz" (auth cookie が消える)

// After v1.6
resp.HeadersAll("Set-Cookie")
// ["auth=abc", "session=xyz"]
resp.Cookies()  // 便利 alias
```

auth cookie を失っていた bug が全 adapter で fix。

---

## [5/8]

例 ... Stop lifecycle 活性化

Before ... `srv.Stop()` は no-op flag、 post-Stop Send は普通に通っていた。

After ... `stopped` 判定を Send に組込み、 post-Stop Send は明示 error (Rust panic / Go t.Fatalf)。 v1.4 mock_server と lifecycle 揃え。

---

## [6/8]

recorder factor で dedup 完了 ...

- Go ... `kiwa-go/internal/recorder/` 抽出、 gin/echo/mockserver で共通
- Rust ... `kiwa-rs/src/recorder.rs` (`fold_headers` generic helper) で 3 backend header 変換統一

recordRequest の semantic parity を機械的に保証。

---

## [7/8]

breaking change ...

- **Go** v0.3 ... `Send()` panic → `t.Fatalf`、 `recover()` していた test code は書き直し必要
- **Rust** v0.3 ... source-compatible (recorder factor は internal のみ)

---

## [8/8]

v1.7 候補 = polyglot 深化 (tower-http / Fiber) / 新 layer (auth + job + cache) / Rust contract layer (alloy.rs 待ち) / Storybook。

要望は Discussions で。

https://github.com/cardene777/kiwa/discussions

#testing #rust #golang
