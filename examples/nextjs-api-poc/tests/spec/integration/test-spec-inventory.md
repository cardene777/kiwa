# test-spec-inventory (integration layer)

`src/inventory.ts` が外部の在庫サービスと繋がる箇所の Layer 1 spec。

同じ example の `api` layer (`test-spec-items.api.md`) が **自分が公開する API** を live で見るのに
対し、 本 spec は **自分の外にある系との繋ぎ目** を msw で置き換えて見る。 対象が違うので
2 layer が同居する。

- module: inventory
- layer: integration

## テストケース一覧

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| T-INT-001 | 統合 | 正常応答を型に写す | `mock` で上流応答を差し替え済 | 200 `{ sku: 'a-1', available: 3 }` | `fetchStock` を `GET` 経路で呼ぶ | `{ sku: 'a-1', available: 3 }` を返す | 高 | 推奨 |
| T-INT-002 | 統合 | 在庫 0 と未知を区別する | `mock` で上流応答を差し替え済 | 200 `{ sku: 'a-1', available: 0 }` | `fetchStock` を `GET` 経路で呼ぶ | `available === 0` を返す (`null` ではない) | 高 | 推奨 |
| T-INT-003 | 統合 | 未知の SKU は null | `mock` で上流応答を差し替え済 | 404 | `fetchStock` を `GET` 経路で呼ぶ | `null` を返す | 高 | 推奨 |
| T-INT-004 | 統合 | 5xx は再試行可能な失敗 | `mock` で上流応答を差し替え済 | 503 | `fetchStock` を `GET` 経路で呼ぶ | `StockUnavailableError`、 `status === 503` | 高 | 推奨 |
| T-INT-005 | 統合 | 429 は再試行可能な失敗 | `mock` で上流応答を差し替え済 | 429 | `fetchStock` を `GET` 経路で呼ぶ | `StockUnavailableError`、 `status === 429` | 高 | 推奨 |
| T-INT-006 | 統合 | 通信失敗は再試行可能な失敗 | `mock` で上流応答を差し替え済 | msw の network error | `fetchStock` を `GET` 経路で呼ぶ | `StockUnavailableError`、 `status === undefined` | 高 | 推奨 |
| T-INT-007 | 統合 | その他の 4xx は再試行しても直らない | `mock` で上流応答を差し替え済 | 400 | `fetchStock` を `GET` 経路で呼ぶ | `StockResponseError` | 中 | 推奨 |
| T-INT-008 | 統合 | 本体が JSON でない | `mock` で上流応答を差し替え済 | 200 かつ本文 `not json` | `fetchStock` を `GET` 経路で呼ぶ | `StockResponseError` | 中 | 推奨 |
| T-INT-009 | 統合 | 形が違う応答 | `mock` で上流応答を差し替え済 | 200 `{ sku: 'a-1' }` (available 欠落) | `fetchStock` を `GET` 経路で呼ぶ | `StockResponseError` | 中 | 推奨 |
| T-INT-010 | 統合 | 負の在庫は通さない | `mock` で上流応答を差し替え済 | 200 `{ sku: 'a-1', available: -1 }` | `fetchStock` を `GET` 経路で呼ぶ | `StockResponseError` | 中 | 推奨 |
| T-INT-011 | 統合 | SKU を URL に安全に載せる | `mock` で上流応答を差し替え済 | SKU `a/1` | `fetchStock` を `GET` 経路で呼ぶ | 要求 path が `a%2F1` を含む | 中 | 推奨 |

## 自動化方針

`setupApiServer({ mode: 'mock', mockHandlers })` で msw を起動し、 **module 自身の `fetch` を
捕捉する**。 `env.request` は使わない = 本 spec の対象は自分の外への呼出で、 自分が公開する
API ではない。

各 TC で handler を作り直す。 使い回すと前の TC の応答が残り、 失敗の分類が実行順に依存する。

T-INT-002 は **0 と未知を分ける**主張。 `available === 0` を `null` に潰すと、 呼出側は
「在庫切れ」 と「SKU が無い」 を区別できなくなる。

T-INT-011 は path 組み立ての主張。 `encodeURIComponent` を外すと `a/1` が別 path として
飛ぶ = handler に届かず、 呼出は別の失敗になる。

## 不足している仕様

- 再試行そのもの (backoff / 上限) は本 module の責務外で、 呼出側が `StockUnavailableError` を
  見て決める。 その方針が決まった時点で別 spec が要る。
