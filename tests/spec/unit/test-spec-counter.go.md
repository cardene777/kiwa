# test-spec-counter.go.md (PoC for Issue #580 v1.4-5)

> Layer 1 (`/kiwa-design --module counter --layer go-unit`) 出力サンプル — `kiwa-test-go` で消費される最小 Go unit test spec。 5 言語並列 PoC (TS / Python / Solidity / Rust / Go) の Go 側。

- module: counter
- layer: go-unit

## 対象機能

`counter` — initial 値を持ち Increment / Decrement / Reset で値を更新する最小 state machine。 Go 実装は `NewCounter(initial int64) *Counter` + `(*Counter).Increment()` + `(*Counter).Decrement()` + `(*Counter).Reset()` + `(*Counter).Value() int64` の 5 method (`Counter` は struct、 method 全て pointer receiver で in-place mutation)。

5 言語並列 PoC の他言語 spec。

- TS / Vitest ... `tests/spec/unit/test-spec-counter.md` (default `--layer unit`、 既存経路)
- Python / pytest ... 同 file (`kiwa-test-py.parse_spec()` で再利用)
- Solidity / Foundry ... `tests/spec/contract/test-spec-counter.md` (default `--layer contract`)
- Rust / cargo test ... `tests/spec/unit/test-spec-counter.rs.md`
- Go / testing.T ... 本 file

## 仕様の要約

- NewCounter(0) で初期値 0 の `*Counter` を作る
- Increment() で値が +1 される、 overflow は int64 wrap (Go は signed int の overflow を defined behavior として wrap、 panic しない)
- Decrement() で値が -1 される
- Reset() で値が 0 に戻る
- Value() で現在値を返す (int64、 value copy)

## 主な品質リスク

| 基準 | スコア | 根拠 1 文 |
|---|---|---|
| 売上影響 | 低 | PoC 用 toy example で本番収益なし |
| セキュリティ影響 | 低 | 外部 IO なし、 in-process state のみ |
| データ破壊リスク | 中 | overflow / underflow で silent wrap (Go 仕様)、 assertion なしだと misuse 検知不可 |
| 利用頻度 | 中 | sample / tutorial で頻繁に参照 |
| 過去障害履歴 | 低 | 該当 bug 報告なし |

総合リスク = 中 (data 破壊 + 利用頻度)。

## 推奨テスト構成

- runner ... go test ./... (kiwa-test-go `kiwa.SetupUnitEnv(t, opts)` fixture 経由で deterministic seed + t.Cleanup auto release)
- 観点 ... 正常系 / 境界値 (`math.MaxInt64` / `math.MinInt64` の wrap) / 状態遷移 / 並行処理 (`t.Parallel()` で atomic monotonic ID)
- 自動化方針 ... 全 unit test 自動化、 wrap 系は明示的に wrap 後の値を確認

## テスト観点一覧

- 正常系 (NewCounter / Increment / Decrement / Reset)
- 境界値 (`math.MaxInt64` で Increment → `math.MinInt64` に wrap、 `math.MinInt64` で Decrement → `math.MaxInt64` に wrap)
- 状態遷移 (Increment → Decrement で元の値に戻る、 Reset 後の Increment 連鎖)
- 並行処理 (`t.Parallel()` で複数 test 同時実行時 fixture ID が distinct)

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Target |
|---|---|---|---|---|---|---|---|---|
| T-GO-U-001 | 正常系 — NewCounter(0) で 0 | kiwa.UnitOpts{ Mode: kiwa.ModeMock, Seed: kiwa.Seed(42), Label: "counter-init" } | c := NewCounter(0); | kiwa.AssertEqual(t, c.Value(), int64(0)) | P0 | yes | mock | NewCounter |
| T-GO-U-002 | 正常系 — Increment で +1 | NewCounter(5) | c.Increment(); | kiwa.AssertEqual(t, c.Value(), int64(6)) | P0 | yes | mock | (*Counter).Increment |
| T-GO-U-003 | 正常系 — Decrement で -1 | NewCounter(5) | c.Decrement(); | kiwa.AssertEqual(t, c.Value(), int64(4)) | P0 | yes | mock | (*Counter).Decrement |
| T-GO-U-004 | 正常系 — Reset で 0 | NewCounter(100) | c.Reset(); | kiwa.AssertEqual(t, c.Value(), int64(0)) | P0 | yes | mock | (*Counter).Reset |
| T-GO-U-005 | 状態遷移 — Inc→Dec で元に戻る | NewCounter(10) | c.Increment(); c.Decrement(); | kiwa.AssertEqual(t, c.Value(), int64(10), "増減後の戻り値") | P1 | yes | mock | Counter |
| T-GO-U-006 | 境界値 — MaxInt64 で Increment 後 MinInt64 に wrap | NewCounter(math.MaxInt64) | c.Increment(); | kiwa.AssertEqual(t, c.Value(), int64(math.MinInt64), "signed overflow wrap") | P1 | yes | mock | (*Counter).Increment |
| T-GO-U-007 | 境界値 — MinInt64 で Decrement 後 MaxInt64 に wrap | NewCounter(math.MinInt64) | c.Decrement(); | kiwa.AssertEqual(t, c.Value(), int64(math.MaxInt64), "signed underflow wrap") | P1 | yes | mock | (*Counter).Decrement |
| T-GO-U-008 | 並行処理 — t.Parallel() で fixture ID distinct | UnitOpts{} で 2 並列 setup | t.Parallel(); envA, envB を別 sub-test で作る | envA.ID() != envB.ID() | P2 | yes | mock | kiwa.SetupUnitEnv |

## 自動化すべきテスト

- T-GO-U-001 〜 T-GO-U-008 全 8 件 ... go test の default 経路、 deterministic、 1ms 程度の高速 feedback。 T-GO-U-008 は `t.Parallel()` 経路で atomic monotonic ID の構造保証を確認

## 手動確認でよいテスト

(なし)

## 不足している仕様

- Go race detector (`go test -race`) 下での `Counter` 並列 mutation 挙動は本 spec では single goroutine 前提、 race 検出経路は別 spec scope
