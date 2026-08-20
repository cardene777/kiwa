# test-spec-links (edge-handler layer)

`src/worker.ts` の `fetch(request, env, ctx)` を対象にした Layer 1 spec。
`@kiwa-lab/edge` の `invokeEdgeHandler` で直接呼ぶため、 Miniflare / workerd を起動しない。

- module: links
- layer: edge-handler

## テストケース一覧

| ID | Observation | Given | Method | Then | Priority | Automation | Handler | Bindings |
|---|---|---|---|---|---|---|---|---|
| T-EDGE-001 | 健全性確認は binding 無しで通る | `/health` | GET | `response.status === 200`、 本文 `ok` | P0 | yes | `export default.fetch` | (なし) |
| T-EDGE-002 | 未登録の slug は 404 | KV 空、 `/missing` | GET | `response.status === 404` | P0 | yes | `export default.fetch` | `KV: LINKS` |
| T-EDGE-003 | 登録済 slug は redirect する | KV に `link:go` = `https://example.com` | GET | `redirect.status === 302`、 `redirect.url === 'https://example.com'` | P0 | yes | `export default.fetch` | `KV: LINKS` |
| T-EDGE-004 | 計数は応答を待たせない | 同上 | GET | `ctx.waitedPromises.length === 1` | P0 | yes | `export default.fetch` | `KV: LINKS` |
| T-EDGE-005 | 計数は待った後に反映される | 同上、 `waitedPromises` を await | GET | `await env.LINKS.get('hits:go') === '1'` | P0 | yes | `export default.fetch` | `KV: LINKS` |
| T-EDGE-006 | 鍵が無ければ登録を拒む | `API_KEY` 未設定、 `/links` | POST | `response.status === 403` | P0 | yes | `export default.fetch` | `KV: LINKS` |
| T-EDGE-007 | 鍵が違えば登録を拒む | `API_KEY='secret'`、 header に別の鍵 | POST | `response.status === 403` | P0 | yes | `export default.fetch` | `KV: LINKS`、 `var: API_KEY` |
| T-EDGE-008 | 鍵が一致すれば登録する | `API_KEY='secret'`、 `{ slug, target }` | POST | `response.status === 201`、 `await env.LINKS.get('link:new') === target` | P0 | yes | `export default.fetch` | `KV: LINKS`、 `var: API_KEY` |
| T-EDGE-009 | 必須項目が欠ければ 400 | 鍵一致、 `{ slug }` のみ | POST | `response.status === 400` | P1 | yes | `export default.fetch` | `KV: LINKS`、 `var: API_KEY` |
| T-EDGE-010 | 本体が JSON でなければ通過させる | 鍵一致、 formData を送る | POST | `response.status === 400`、 `ctx.passThroughCalled === true` | P1 | yes | `export default.fetch` | `KV: LINKS`、 `var: API_KEY` |

## 自動化方針

`invokeEdgeHandler({ handler, url, method, headers, jsonBody / formData, env })` で呼び、
返る `{ response, redirect, ctx, error }` を assertion に使う。

KV binding は `createKvNamespace(initial)` の純 JS mock を渡す。 seed は TC ごとに作り直す =
前の TC の書込が次に残ると、 T-EDGE-005 の計数が実行順に依存する。

`ctx.waitedPromises` は **await しないと副作用が反映されない**。 T-EDGE-004 は登録された数を、
T-EDGE-005 は await した後の KV の中身を見る = 2 つは別の主張で、 片方だけでは
「載せたが実行されない」 形を捕まえられない。

## 不足している仕様

- R2 / D1 / DurableObject binding は本 handler が使わないため対象外。 必要になった時点で
  test 側に mock を投入する (`@kiwa-lab/edge` は KV mock だけを提供する)。
