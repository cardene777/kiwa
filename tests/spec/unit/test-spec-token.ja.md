<!-- kiwa-layers: source=all layers=unit -->

# test-spec-token

- module: token
- layer: unit
- 対象実装: `examples/vitest-unit-poc/src/token.ts`

## 対象機能

発行 token の正規化と失効判定、および再試行の待ち時間を返す 3 つの関数。
`normalizeTag` と `nextBackoffMs` は純粋関数だが、`isExpired` は現在時刻を読むため純粋関数ではない。

`unit` layer の対象は外部依存を持たない logic で、`docs/layers.json` の `unit` は
`backing_package: null` を宣言する。 本 module も import を持たず、唯一の外部状態である
現在時刻を `Date.now()` から読む。

## 仕様の要約

### API 契約

| 関数 | 引数 | 返り値 |
|---|---|---|
| `normalizeTag(input, options?)` | `input: string`、`options.maxLength?: number` | 正規化した `string` |
| `isExpired(issuedAt, ttlMs)` | いずれも `number` (ミリ秒) | 失効していれば `true` |
| `nextBackoffMs(attempt, base?, cap?)` | `attempt: number`、`base = 100`、`cap = 10_000` | 待ち時間 `number` (ミリ秒) |

### `normalizeTag` の変換順

1. 小文字化する
2. 英数字以外の連なりを `-` 1 つに置き換える
3. 両端の `-` を落とす
4. `maxLength` が未指定ならここで返す
5. `maxLength` が 0 以下なら空文字を返す
6. `maxLength` 文字で切り詰め、**末尾の `-` だけ**もう一度落とす

手順 6 で末尾だけを見るのは、手順 3 で先頭を落とし済みだから。
切り口が区切りに当たると末尾に区切りだけが残るため、切った後にもう一度落とす。

### `isExpired` の判定区間

有効な間を **半開区間** `[issuedAt, issuedAt + ttlMs)` に取る。
境界ちょうど (`issuedAt + ttlMs`) は失効側に入るため、TTL 0 の token は発行直後から失効している。

### `nextBackoffMs` の算出

`base * 2 ** attempt` を `cap` で頭打ちにする。
`attempt` は 0 起点で、負値と小数は `Math.max(0, Math.trunc(attempt))` で丸める。

乱数を混ぜない。混ぜると test が実行ごとに違う値を見ることになる。
揺らぎが要る場合は呼出側で足す。

### 権限モデル

なし (3 関数とも呼出制限を持たない)。

### 失敗 mode

例外を投げる経路を持たない。異常な入力は返り値で表す。

| 入力 | 返り値 |
|---|---|
| `isExpired` に有限でない値 (`NaN` / `Infinity`) | `true` (失効扱い) |
| `isExpired` に負の `ttlMs` | `true` |
| `normalizeTag` に英数字を含まない文字列 | `''` |
| `normalizeTag` に 0 以下の `maxLength` | `''` |

## 主な品質リスク

| 入力要素 | 売上影響 | セキュリティ影響 | データ破壊 | 利用頻度 | 過去障害 | 根拠 |
|---|---|---|---|---|---|---|
| `normalizeTag` の切り詰め | 低 | 中 | 低 | 高 | 低 | URL に置く値を作るため、切り口が変わると別の資源を指す |
| `isExpired` の境界 | 低 | 高 | 低 | 高 | 低 | 失効判定が 1 ミリ秒ずれると失効済 token を通す |
| `isExpired` の非有限入力 | 低 | 高 | 低 | 中 | 低 | 判定不能を「有効」 に倒すと検査を素通りする |
| `nextBackoffMs` の頭打ち | 低 | 低 | 低 | 中 | 低 | 上限が効かないと再試行間隔が発散する |

## 推奨テスト構成

| layer | 目的 | 観点 |
|---|---|---|
| 単体 (vitest) | 3 関数それぞれの正常 / 異常 / 境界を網羅 | 正常系 / 異常系 / 境界値 / 入力バリデーション |

現在時刻に依存する `isExpired` は `vi.useFakeTimers` で固定する。
実時刻のままだと境界の判定が実行タイミングで揺れる。

## テスト観点一覧

- 1. 正常系 — 適用
- 2. 異常系 — 適用 (非有限 / 負値 / 英数字なし)
- 3. 境界値 — 適用 (半開区間の境界 / 切り詰めの切り口 / 上限の頭打ち)
- 4. 状態遷移 — 非適用 (状態を持たない)
- 5. 権限 — 非適用
- 6. 入力バリデーション — 適用 (丸めと既定値)
- 7. 冪等性 — 非適用
- 8. 並行処理 — 非適用
- 9. 性能 — 非適用
- 10. セキュリティ — 非適用 (信頼境界を跨がない)

## テストケース一覧

### 観点 1: 正常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| T-UNIT-001 | 単体 | 正常系 | なし | `'Hello World'` | `normalizeTag(input)` | `'hello-world'` | 高 | 推奨 |
| T-UNIT-002 | 単体 | 正常系 | なし | `'a  --  b'` | `normalizeTag(input)` | `'a-b'` | 高 | 推奨 |
| T-UNIT-003 | 単体 | 正常系 | なし | `'__abc__'` | `normalizeTag(input)` | `'abc'` | 高 | 推奨 |
| T-UNIT-008 | 単体 | 正常系 | 時刻を 1400 に固定 | `issuedAt=1000, ttlMs=500` | `isExpired(...)` | `false` (TTL 内) | 高 | 推奨 |
| T-UNIT-013 | 単体 | 正常系 | 既定 `base=100` | `attempt=0, 1, 2` | `nextBackoffMs(attempt)` | `100` / `200` / `400` | 高 | 推奨 |

### 観点 2: 異常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| T-UNIT-004 | 単体 | 異常系 | なし | `'！？'` (英数字 0 文字) | `normalizeTag(input)` | `''` | 高 | 推奨 |
| T-UNIT-011 | 単体 | 異常系 | 時刻を 1000 に固定 | `issuedAt=1000, ttlMs=-1` | `isExpired(...)` | `true` (負の TTL は失効扱い) | 高 | 推奨 |
| T-UNIT-012 | 単体 | 異常系 | 時刻を 1000 に固定 | `issuedAt=NaN` / `ttlMs=Infinity` | `isExpired(...)` | いずれも `true` (有限でない入力は失効扱い) | 高 | 推奨 |

### 観点 3: 境界値

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| T-UNIT-005 | 単体 | 境界値 | なし | `'abcdefghij', { maxLength: 4 }` | `normalizeTag(...)` | `'abcd'` | 高 | 推奨 |
| T-UNIT-006 | 単体 | 境界値 | `'ab cdef'` は `'ab-cdef'` に正規化される | `'ab cdef', { maxLength: 3 }` | `normalizeTag(...)` | `'ab'` (切り口の `-` を落とす) | 高 | 推奨 |
| T-UNIT-007 | 単体 | 境界値 | なし | `'abc', { maxLength: 0 }` | `normalizeTag(...)` | `''` | 高 | 推奨 |
| T-UNIT-009 | 単体 | 境界値 | 時刻を 1500 に固定 | `issuedAt=1000, ttlMs=500` | `isExpired(...)` | `true` (半開区間の境界は失効側) | 高 | 推奨 |
| T-UNIT-010 | 単体 | 境界値 | 時刻を 1000 に固定 | `issuedAt=1000, ttlMs=0` | `isExpired(...)` | `true` (発行直後から失効) | 高 | 推奨 |
| T-UNIT-014 | 単体 | 境界値 | 既定 `cap=10_000` | `attempt=20` | `nextBackoffMs(attempt)` | `10000` (頭打ち) | 高 | 推奨 |
| T-UNIT-016 | 単体 | 境界値 | なし | `'abc', { maxLength: -1 }` | `normalizeTag(...)` | `''` (`max <= 0` の分岐に入る) | 中 | 推奨 |
| T-UNIT-017 | 単体 | 境界値 | 正規化後は 3 文字 | `'abc', { maxLength: 99 }` | `normalizeTag(...)` | `'abc'` (切り詰めが起きない) | 中 | 推奨 |
| T-UNIT-018 | 単体 | 境界値 | 時刻を 1000 に固定 | `issuedAt=2000, ttlMs=500` | `isExpired(...)` | `false` (発行時刻が未来でも失効しない) | 中 | 推奨 |

### 観点 6: 入力バリデーション

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| T-UNIT-015 | 単体 | 入力バリデーション | 既定 `base=100` | `attempt=-3` | `nextBackoffMs(attempt)` | `100` (負値は 0 として扱う) | 高 | 推奨 |
| T-UNIT-019 | 単体 | 入力バリデーション | 既定 `base=100` | `attempt=1.9` | `nextBackoffMs(attempt)` | `200` (小数部を切り捨てて 1 として扱う) | 中 | 推奨 |
| T-UNIT-020 | 単体 | 入力バリデーション | なし | `attempt=3, base=50, cap=200` | `nextBackoffMs(3, 50, 200)` | `200` (`50 * 8 = 400` が `cap` で頭打ち) | 中 | 推奨 |

## 自動化すべきテスト

- T-UNIT-001 〜 T-UNIT-020 全 20 件、全件自動化推奨
- `isExpired` の 6 件 (T-UNIT-008 / 009 / 010 / 011 / 012 / 018) は `vi.useFakeTimers` で時刻を固定する

## 手動確認でよいテスト

- (なし)

## 不足している仕様

- `nextBackoffMs` に `NaN` を渡すと `NaN` が返る。 `Math.trunc(NaN)` が `NaN`、`Math.max(0, NaN)` も `NaN` で、以降の演算がすべて `NaN` に伝播する。 `attempt` を 0 に倒すか例外にするかが未定義のため TC を立てていない
- `isExpired` に `ttlMs = Infinity` を渡すと `true` (失効) が返る。 直感的には「無期限」 だが、実装は有限性の検査で先に弾く。 無期限を表す方法 (別の関数 / `null` 等) が未定義
- `normalizeTag` の変換順 2 と 3 の間にある `.replace(/-+/g, '-')` は **到達しない**。 手順 2 の `[^a-z0-9]+` が非英数字の連なりを 1 つの `-` に潰すため、この時点で `--` は存在しない。 意図的な二重防御か削除対象かが未定義
- `normalizeTag` の `maxLength` が小数の場合の扱いが未定義 (`String.prototype.slice` は切り捨てるが、宣言に無い)
- `nextBackoffMs` の `base` が負値の場合の扱いが未定義 (`Math.min` が負値を返す)

## Layer 2 連携

```text
/kiwa-vitest --module token --layer unit --lang ja
```
