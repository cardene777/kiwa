# test-spec-counter.rs.md (PoC for Issue #580 v1.4-5)

> Layer 1 (`/kiwa-design --module counter --layer rust-unit`) 出力サンプル — `kiwa-test-rs` で消費される最小 Rust unit test spec。 5 言語並列 PoC (TS / Python / Solidity / Rust / Go) の Rust 側。

- module: counter
- layer: rust-unit

## 対象機能

`counter` — initial 値を持ち increment / decrement / reset で値を更新する最小 state machine。 Rust 実装は `Counter::new(initial: i64)` + `Counter::increment(&mut self)` + `Counter::decrement(&mut self)` + `Counter::reset(&mut self)` + `Counter::value(&self) -> i64` の 5 method。

5 言語並列 PoC の他言語 spec。

- TS / Vitest ... `tests/spec/unit/test-spec-counter.md` (default `--layer unit`、 既存経路、 v1.4-5 PoC で新規追加なし)
- Python / pytest ... 同 file (`kiwa-test-py.parse_spec()` 経由で再利用、 新 layer 追加なし)
- Solidity / Foundry ... `tests/spec/contract/test-spec-counter.md` (default `--layer contract`、 既存経路)
- Rust / cargo test ... 本 file
- Go / testing.T ... `tests/spec/unit/test-spec-counter.go.md`

## 仕様の要約

- new(0) で初期値 0 の `Counter` を作る
- increment() で値が +1 される、 overflow は `i64::MAX` でラップせず panic (debug build) or wrap (release build) — 本 PoC は debug build 前提
- decrement() で値が -1 される
- reset() で値が 0 に戻る
- value() で現在値を borrow し返す (&self、 値 copy)

## 主な品質リスク

| 基準 | スコア | 根拠 1 文 |
|---|---|---|
| 売上影響 | 低 | PoC 用 toy example で本番収益なし |
| セキュリティ影響 | 低 | 外部 IO なし、 in-process state のみ |
| データ破壊リスク | 中 | overflow / underflow で panic、 release build では silent wrap |
| 利用頻度 | 中 | sample / tutorial で頻繁に参照 |
| 過去障害履歴 | 低 | 該当 bug 報告なし |

総合リスク = 中 (data 破壊 + 利用頻度)。

## 推奨テスト構成

- runner ... cargo test (kiwa-test-rs `kiwa::unit::setup_env` fixture 経由で deterministic seed + Drop cleanup)
- 観点 ... 正常系 / 境界値 (`i64::MAX` / `i64::MIN`) / 状態遷移 (counter 値の遷移列)
- 自動化方針 ... 全 unit test 自動化、 panic 系は `#[should_panic]` で deterministic 確認

## テスト観点一覧

- 正常系 (initial / increment / decrement / reset)
- 境界値 (`i64::MAX` 境界での overflow panic、 `i64::MIN` 境界での underflow panic)
- 状態遷移 (increment → decrement で元の値に戻る、 reset 後の increment 連鎖)

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Target |
|---|---|---|---|---|---|---|---|---|
| T-RS-U-001 | 正常系 — new(0) で 0 | SetupOpts { mode: Mock, seed: Some(42), label: Some("counter-init".into()) } | let mut c = Counter::new(0); | assert_kiwa_eq!(c.value(), 0_i64); | P0 | yes | mock | Counter::new |
| T-RS-U-002 | 正常系 — increment で +1 | new(5) | c.increment(); | assert_kiwa_eq!(c.value(), 6_i64); | P0 | yes | mock | Counter::increment |
| T-RS-U-003 | 正常系 — decrement で -1 | new(5) | c.decrement(); | assert_kiwa_eq!(c.value(), 4_i64); | P0 | yes | mock | Counter::decrement |
| T-RS-U-004 | 正常系 — reset で 0 | new(100) | c.reset(); | assert_kiwa_eq!(c.value(), 0_i64); | P0 | yes | mock | Counter::reset |
| T-RS-U-005 | 状態遷移 — inc→dec で元に戻る | new(10) | c.increment(); c.decrement(); | assert_kiwa_eq!(c.value(), 10_i64, "増減後の戻り値"); | P1 | yes | mock | Counter |
| T-RS-U-006 | 境界値 — overflow で panic | new(i64::MAX) | c.increment(); | #[should_panic(expected = "attempt to add with overflow")] | P1 | yes | mock | Counter::increment |
| T-RS-U-007 | 境界値 — underflow で panic | new(i64::MIN) | c.decrement(); | #[should_panic(expected = "attempt to subtract with overflow")] | P1 | yes | mock | Counter::decrement |

## 自動化すべきテスト

- T-RS-U-001 〜 T-RS-U-007 全 7 件 ... cargo test の default 経路、 deterministic、 1ms 程度の高速 feedback

## 手動確認でよいテスト

(なし)

## 不足している仕様

- release build (debug_assertions なし) での overflow 挙動 (wrap vs panic) は本 spec では debug build 前提、 release 確認は本 PoC scope 外
