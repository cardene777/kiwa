<!-- kiwa-layers: source=all layers=integration -->

# test-spec-inventory

- module: inventory
- layer: integration
- 対象実装: `examples/nextjs-api-poc/src/inventory.ts`

## 対象機能

在庫サービス (外部 HTTP API) を引く client。

`integration` layer の対象は **自分の外にある系との繋ぎ目** で、`api` layer
(`src/route.ts`、自分が公開する API) とは見る場所が違う。
本 module は応答の分類と失敗の翻訳だけを持ち、在庫の計算そのものは持たない。

`fetch` を直接呼ぶため、test では msw が外向きの呼出を捕捉する。

## 仕様の要約

### API 契約

| 関数 | 引数 | 返り値 |
|---|---|---|
| `fetchStock(sku)` | `sku: string` | `Promise<Stock \| null>` |

`Stock` は `{ readonly sku: string; readonly available: number }`。

### 応答の分類

上流の応答を 4 つに分ける。呼出側が再試行の可否で分岐できるよう、失敗は型で分ける。

| 上流の状態 | 返り / 送出 | 呼出側の扱い |
|---|---|---|
| 200 かつ想定の形 | `Stock` | 成功 |
| 404 | `null` | 在庫サービスが「知らない」 と答えた (在庫 0 とは別) |
| 通信失敗 / 429 / 5xx | `StockUnavailableError` | 再試行してよい |
| それ以外の非 2xx / 本体が読めない / 形が違う | `StockResponseError` | 再試行しても直らない |

**在庫 0 と未知を潰さない**。`0` を `null` にすると、呼出側は「在庫切れ」 と「SKU が無い」 を区別できない。

### 判定の順序

1. `fetch` が例外を投げたら `StockUnavailableError` (`status` は `undefined`)
2. `404` なら `null`
3. `429` または `500` 以上なら `StockUnavailableError` (`status` を持つ)
4. `response.ok` でなければ `StockResponseError`
5. 本体が JSON として読めなければ `StockResponseError`
6. `sku` が文字列でない、または `available` が数値でなければ `StockResponseError`
7. `available` が負なら `StockResponseError`

手順 3 と 4 の境界は **500** に置く。`499` は手順 4 に落ちて再試行不可、`500` は手順 3 で再試行可になる。

手順 6 の直前で本体を `(body ?? {})` に畳む。本体が JSON の `null` でも
`typeof undefined !== 'string'` で手順 6 に落ちるため、`null` 本体は形の誤りとして扱う。

### `StockUnavailableError` の message

`status` の有無で変わる。

| `status` | message |
|---|---|
| `undefined` (通信失敗) | `stock service unavailable` |
| 数値 | `stock service unavailable (503)` の形 |

`status` を持たせるのは、呼出側が待ち時間の判断材料を失わないため。

### 権限モデル

なし (呼出制限を持たない)。

### 失敗 mode

`fetch` 到達後に本 module が送出する独自例外は 2 種。
ただし、孤立 surrogate を含む `sku` は URL 生成時の `encodeURIComponent` が `URIError` を投げる。
この入力を拒否するか正規化するかは未定義のため、§ 不足している仕様に記録する。

## 主な品質リスク

| 入力要素 | 売上影響 | セキュリティ影響 | データ破壊 | 利用頻度 | 過去障害 | 根拠 |
|---|---|---|---|---|---|---|
| 404 と在庫 0 の区別 | 高 | 低 | 中 | 高 | 低 | 潰すと「在庫切れ」 と「SKU が無い」 が同じに見え、呼出側の表示が誤る |
| 再試行可否の分類 | 中 | 低 | 低 | 高 | 低 | 誤ると直らない失敗を再試行し続けるか、直る失敗を諦める |
| 負の在庫の遮断 | 高 | 低 | 高 | 中 | 低 | 上流の欠陥をそのまま通すと呼出側の計算が静かに狂う |
| SKU の URL 埋込 | 低 | 中 | 低 | 高 | 低 | encode を外すと `/` を含む SKU が別 path として飛ぶ |

## 推奨テスト構成

| layer | 目的 | 観点 |
|---|---|---|
| 結合 (vitest + msw) | 上流の応答を差し替えて分類と翻訳を確かめる | 正常系 / 異常系 / 境界値 / 入力バリデーション |

msw の handler は TC ごとに作り直す。
使い回すと前の TC の応答が残り、失敗の分類が実行順に依存する。

## テスト観点一覧

- 1. 正常系 — 適用
- 2. 異常系 — 適用 (通信失敗 / 4xx / 5xx / 本体不正)
- 3. 境界値 — 適用 (在庫 0 / status 499 と 500 / 本体が `null`)
- 4. 状態遷移 — 非適用 (状態を持たない)
- 5. 権限 — 非適用
- 6. 入力バリデーション — 適用 (SKU の URL 埋込)
- 7. 冪等性 — 非適用
- 8. 並行処理 — 非適用
- 9. 性能 — 非適用
- 10. セキュリティ — 適用 (SKU の path 分離)

## テストケース一覧

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| T-INT-001 | 結合 | 正常系 | 上流が `{ sku: 'a-1', available: 3 }` を返す | `'a-1'` | `fetchStock(sku)` | `{ sku: 'a-1', available: 3 }` | 高 | 推奨 |
| T-INT-003 | 結合 | 正常系 | 上流が 404 を返す | `'nope'` | `fetchStock(sku)` | `null` (未知の SKU) | 高 | 推奨 |
| T-INT-004 | 結合 | 異常系 | 上流が 503 を返す | `'a-1'` | `fetchStock(sku)` | `StockUnavailableError`、`status` が 503 | 高 | 推奨 |
| T-INT-005 | 結合 | 異常系 | 上流が 429 を返す | `'a-1'` | `fetchStock(sku)` | `StockUnavailableError`、`status` が 429 | 高 | 推奨 |
| T-INT-006 | 結合 | 異常系 | 上流への通信が失敗する | `'a-1'` | `fetchStock(sku)` | `StockUnavailableError`、`status` が `undefined` | 高 | 推奨 |
| T-INT-007 | 結合 | 異常系 | 上流が 400 を返す | `'a-1'` | `fetchStock(sku)` | `StockResponseError` (再試行しても直らない) | 高 | 推奨 |
| T-INT-008 | 結合 | 異常系 | 上流が JSON でない本体を返す | `'a-1'` | `fetchStock(sku)` | `StockResponseError` | 高 | 推奨 |
| T-INT-009 | 結合 | 異常系 | 上流が `{ sku: 'a-1' }` を返す (`available` 欠落) | `'a-1'` | `fetchStock(sku)` | `StockResponseError` | 高 | 推奨 |
| T-INT-010 | 結合 | 異常系 | 上流が `available: -1` を返す | `'a-1'` | `fetchStock(sku)` | `StockResponseError` | 高 | 推奨 |
| T-INT-015 | 結合 | 異常系 | 上流が 304 を返す | `'a-1'` | `fetchStock(sku)` | `StockResponseError` (2xx 以外は 429 / 5xx を除き再試行不可) | 中 | 推奨 |
| T-INT-016 | 結合 | 異常系 | 通信失敗と 503 の 2 通り | `'a-1'` | `fetchStock(sku)` の message を読む | 前者が `stock service unavailable`、後者が `stock service unavailable (503)` | 中 | 推奨 |
| T-INT-002 | 結合 | 境界値 | 上流が `available: 0` を返す | `'a-1'` | `fetchStock(sku)` | `{ sku: 'a-1', available: 0 }` (`null` に潰さない) | 高 | 推奨 |
| T-INT-012 | 結合 | 境界値 | 上流が 500 を返す | `'a-1'` | `fetchStock(sku)` | `StockUnavailableError`、`status` が 500 (境界のこちら側) | 中 | 推奨 |
| T-INT-013 | 結合 | 境界値 | 上流が 499 を返す | `'a-1'` | `fetchStock(sku)` | `StockResponseError` (境界の向こう側) | 中 | 推奨 |
| T-INT-014 | 結合 | 境界値 | 上流が JSON の `null` を返す | `'a-1'` | `fetchStock(sku)` | `StockResponseError` (`(body ?? {})` で形の誤りに落ちる) | 中 | 推奨 |
| T-INT-011 | 結合 | 入力バリデーション / セキュリティ | handler が request の path を記録する | `'a/1'` | `fetchStock(sku)` | path が `/v1/items/a%2F1` (encode を外すと別 path に飛ぶ) | 高 | 推奨 |

## 自動化すべきテスト

- T-INT-001 〜 T-INT-016 全 16 件、全件自動化推奨
- すべて msw の handler 差し替えで再現でき、実 network を要しない

## 手動確認でよいテスト

- (なし)

## 不足している仕様

- **孤立 surrogate を含む `sku` は URL 生成時に `URIError` となる**。 `encodeURIComponent(sku)` が `fetch` の `try` より前に失敗するため、2 種の独自例外には翻訳されない。この入力を拒否するか、well-formed な文字列へ正規化するかが未定義
- **応答の `sku` が要求した `sku` と違っても検査しない**。 上流が別の SKU を返すと、そのまま `Stock.sku` として返る (実測で `fetchStock('a-1')` が `{ sku: 'OTHER', available: 1 }` を返す)。 照合すべきか、上流を信頼する設計かが未定義
- **`available` が整数でなくても通る**。 `typeof available === 'number'` しか見ないため `1.5` が通る (実測)。 在庫が小数を取りうるかが未定義
- `available` の上限が未定義 (`Number.MAX_SAFE_INTEGER` を超える値の扱い)
- 上流の timeout を設定していない。 `fetch` の既定に委ねているため、応答が返らない場合の待ち時間が未定義
- 再試行そのものは呼出側の責務としているが、待ち時間の算出方法 (`nextBackoffMs` を使うか) が本 module の契約に書かれていない

## Layer 2 連携

```text
/kiwa-api --module inventory --layer integration --lang ja
```
