# test-spec-inventory (integration layer)

`src/inventory.ts` が外部の在庫サービスと繋がる箇所の Layer 1 spec。

同じ example の `api` layer (`test-spec-items.api.md`) が **自分が公開する API** を live で見るのに
対し、 本 spec は **自分の外にある系との繋ぎ目** を msw で置き換えて見る。 対象が違うので
2 layer が同居する。

- module: inventory
- layer: integration

## テストケース

| ID | Observation | Given | Method | Then | Priority | Automation | Mode |
|---|---|---|---|---|---|---|---|
| T-INT-001 | 正常応答を型に写す | 200 `{ sku: 'a-1', available: 3 }` | GET | `{ sku: 'a-1', available: 3 }` を返す | P0 | yes | mock |
| T-INT-002 | 在庫 0 と未知を区別する | 200 `{ sku: 'a-1', available: 0 }` | GET | `available === 0` を返す (`null` ではない) | P0 | yes | mock |
| T-INT-003 | 未知の SKU は null | 404 | GET | `null` を返す | P0 | yes | mock |
| T-INT-004 | 5xx は再試行可能な失敗 | 503 | GET | `StockUnavailableError`、 `status === 503` | P0 | yes | mock |
| T-INT-005 | 429 は再試行可能な失敗 | 429 | GET | `StockUnavailableError`、 `status === 429` | P0 | yes | mock |
| T-INT-006 | 通信失敗は再試行可能な失敗 | msw の network error | GET | `StockUnavailableError`、 `status === undefined` | P0 | yes | mock |
| T-INT-007 | その他の 4xx は再試行しても直らない | 400 | GET | `StockResponseError` | P1 | yes | mock |
| T-INT-008 | 本体が JSON でない | 200 かつ本文 `not json` | GET | `StockResponseError` | P1 | yes | mock |
| T-INT-009 | 形が違う応答 | 200 `{ sku: 'a-1' }` (available 欠落) | GET | `StockResponseError` | P1 | yes | mock |
| T-INT-010 | 負の在庫は通さない | 200 `{ sku: 'a-1', available: -1 }` | GET | `StockResponseError` | P1 | yes | mock |
| T-INT-011 | SKU を URL に安全に載せる | SKU `a/1` | GET | 要求 path が `a%2F1` を含む | P1 | yes | mock |

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
