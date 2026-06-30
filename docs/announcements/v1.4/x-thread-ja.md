# x.com 投稿用下書き — 日本語 thread (v1.4 polyglot 完成 voice)

> 投稿先 ... [@cardene777](https://x.com/cardene777)
> Voice ... 本人名義 / 個人 dev 視点 / 「v0.5 公約回収」 maker トーン
> 動画 ... `assets/kiwa-promo-ja.mp4` (再利用) を 1 ツイート目に添付
> 想定 ... 1 ツイート 140 字以内
> 全 8 ツイート、 番号 [1/8] 付き

---

## [1/8] (動画添付)

polyglot test toolchain 「kiwa」 v1.4 (6/6 resolved) が land しました。

Rust + Go が加わって **5 言語 (TS / Python / Solidity + Rust + Go) polyglot 完成版**。 v0.5 で「Rust / Go は構想中」 と書いた公約をようやく回収。

https://github.com/cardene777/kiwa

#OSS #testing

---

## [2/8]

v1.4 で増えたもの。

- 対応言語 ... 3 → 5 (+ Rust + Go)
- skill ... 25 → 27 (+ kiwa-rust + kiwa-go)
- Layer 1 spec layer ... 9 → 13 (+ 4 polyglot layer)
- 他言語 package ... PyPI 1 → PyPI + crates.io + pkg.go.dev = 3

---

## [3/8]

Rust (kiwa-test-rs v0.1) ...

- `cargo test` adapter (unit、 `setup_env` + `assert_kiwa_eq!` / `assert_kiwa_close!`)
- `hyper` mock_server (integration、 `RecordedRequest` で受信 capture)
- `integration` feature default ON、 unit-only は opt-out 可

---

## [4/8]

Go (kiwa-test-go v0.1) ...

- `testing.T` adapter (`SetupUnitEnv` + `t.Cleanup` 自動 stop)
- `httptest.Server` wrap (integration、 stdlib zero-dep)
- `testing.TB` accept で `T` / `B` / `F` 全対応、 race clean

---

## [5/8]

`/kiwa-design` に 4 layer 追加 (`rust-unit` / `rust-integration` / `go-unit` / `go-integration`)。

1 機能を 5 言語で同時 spec → `/kiwa-rust` + `/kiwa-go` で並列 test 生成。

---

## [6/8]

「test stack 散乱」 問題は runner だけでなく **言語違い** にもあります。

dApp 開発でも Solidity / TS / Python / Rust crypto / Go gateway は普通に出てきて、 これを 1 spec から並列展開できるのが kiwa polyglot の意義です。

---

## [7/8]

統計 ...

| 軸 | v1.3 | v1.4 |
|---|---|---|
| 対応言語 | 3 | **5** |
| skill | 25 | 27 |
| Layer 1 spec layer | 9 | 13 |

5 言語 polyglot の現在地、 dApp + web + lib + サービスを 1 spec で扱える状態に到達。

---

## [8/8]

v1.5 候補は Rust / Go web framework adapter (axum / actix / Gin / Echo) + 新 layer (auth / job queue / cache)。

要望は GitHub Discussions で集めます。

https://github.com/cardene777/kiwa/discussions

#testing #rust #golang
