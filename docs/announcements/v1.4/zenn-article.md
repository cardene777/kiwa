---
title: "kiwa v1.4 — Rust + Go land で 5 言語 polyglot test toolchain が完成した"
emoji: "🌱"
type: "tech"
topics: ["testing", "oss", "rust", "go", "polyglot"]
published: false
---

# 概要

polyglot test toolchain `kiwa` の v1.4 milestone (6/6 Issue resolved) が land しました。

これまで TS / Python / Solidity の 3 言語だった polyglot test 経路に **Rust + Go の 2 言語が加わり、 計 5 言語** で「1 spec から並列生成」 が可能になりました。

v0.5 announcement で「Rust / Go は構想中」 と明言した公約をようやく回収できた milestone です。

```bash
# 5 言語全部、 同じ Layer 1 spec から生成
npm install @kiwa-test/core
pip install kiwa-test-py
cargo add kiwa-test-rs
go get github.com/cardene777/kiwa-test-go
```

## v1.4 で land した 3 つの軸

### 1. Rust (kiwa-test-rs v0.1) — cargo test + hyper mock_server

```rust
use kiwa_test_rs::unit::{setup_env, UnitOpts, Mode};
use kiwa_test_rs::assertions::*;

#[test]
fn counter_increments() {
    let env = setup_env(UnitOpts { mode: Mode::Mock, ..Default::default() });
    let mut counter = Counter::new(env.seed());
    counter.increment();
    assert_kiwa_eq!(counter.value(), 1);
}
```

unit (`cargo test` + `assert_kiwa_eq!` / `assert_kiwa_close!`) + integration (`hyper` mock_server + `RecordedRequest`) を v0.1 で同時 land。

`integration` feature default ON、 unit-only ユーザーは `--no-default-features` で hyper 不要。

### 2. Go (kiwa-test-go v0.1) — testing.T + httptest mock_server

```go
import "github.com/cardene777/kiwa-test-go/kiwa"

func TestCounter(t *testing.T) {
    env := kiwa.SetupUnitEnv(t, kiwa.UnitOpts{Mode: kiwa.Mock})
    counter := NewCounter(env.Seed())
    counter.Increment()
    kiwa.AssertEqual(t, counter.Value(), 1)
}
```

unit (`testing.T` + `t.Cleanup` 自動 stop + `AssertEqual` / `AssertClose`) + integration (`httptest.Server` wrap + `RecordedRequest`) を **stdlib zero-dep** で実現。

`testing.TB` accept なので `*testing.T` / `*testing.B` / `*testing.F` 全対応、 並行 race detector clean。

### 3. Layer 1 spec polyglot + skill chain (Layer 2)

`/kiwa-design --layer rust-unit` / `--layer rust-integration` / `--layer go-unit` / `--layer go-integration` の 4 layer を新規追加。

```bash
# 1 機能を 5 言語で同時テスト
/kiwa-design --layer unit --module counter         # TS / Python / Solidity 既存
/kiwa-design --layer rust-unit --module counter     # → tests/spec/unit/test-spec-counter.rs.md
/kiwa-design --layer go-unit --module counter       # → tests/spec/unit/test-spec-counter.go.md

# Layer 2 で並列生成
/kiwa-rust --module counter   # → tests/counter_test.rs + cargo test 自動実行
/kiwa-go --module counter     # → tests/counter_test.go + go test 自動実行
```

`/kiwa-rust` / `/kiwa-go` の Layer 2 skill 新規 + `/kiwa-review` polyglot 4 layer 対応で、 5 言語の spec vs test 整合 review を統一経路で扱えるようになりました。

## 統計

| 軸 | v1.3 | v1.4 | 差分 |
|---|---|---|---|
| 対応言語 | TS / Python / Solidity (3) | + Rust + Go (5) | **+2 言語、 polyglot 完成** |
| npm package | 20 | 20 | (継続) |
| 他言語 package | 1 (PyPI) | 3 (PyPI + crates.io + pkg.go.dev) | +2 |
| Claude Code skill | 25 | 27 | +2 (kiwa-rust + kiwa-go) |
| Layer 1 spec layer | 9 | 13 | +4 (rust-unit / rust-integration / go-unit / go-integration) |
| `/kiwa-test --target` | TS/Solidity 系 | + `rust` / `go` | +2 |

## なぜ polyglot にこだわるか

「test stack 散乱」 問題の本質は runner 違いだけでなく **言語違い** にもあります。

たとえば dApp 開発で ...

- Solidity contract → Foundry
- TypeScript フロント → Vitest + Playwright
- Python サービス → pytest
- Rust crypto lib → cargo test
- Go gateway → go test

これらを別々に test 設計するのは現実的でなく、 **1 つの「機能 spec」 から各言語に展開** できる toolchain が必要です。 v1.4 で kiwa はこの 5 言語完成 (TS / Python / Solidity + Rust + Go) に到達しました。

## v1.5 候補

- Rust web framework adapter (axum / actix-web) — v0.2+
- Go web framework adapter (Gin / Echo / Fiber) — v0.2+
- Rust contract layer (Foundry-rs / alloy.rs) — v0.3+
- 新 layer (auth / job queue / cache test adapter)
- Storybook integration

要望は [GitHub Discussions](https://github.com/cardene777/kiwa/discussions) で集めます。

## 試す

```bash
# Claude Code plugin (推奨)
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace

# Rust
cargo add kiwa-test-rs
cargo add --dev kiwa-test-rs --features integration

# Go
go get github.com/cardene777/kiwa-test-go

# 既存 (継続)
pnpm add -D @kiwa-test/core
pip install kiwa-test-py
```

repo ... https://github.com/cardene777/kiwa

v0.5 で「polyglot 構想中」 と書いてから 1 milestone (v1.4)、 **5 言語完成版** として再起動です。 test stack 散乱 + 言語横断問題、 一通り 1 spec で扱える状態に到達しました。
