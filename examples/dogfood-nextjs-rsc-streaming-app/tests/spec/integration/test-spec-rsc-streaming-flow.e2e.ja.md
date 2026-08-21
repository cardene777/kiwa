# test-spec-rsc-streaming-flow (e2e-generic layer)

RSC の記事描画 / 目録の streaming / 画面遷移と form action、という 3 経路を
**同じ adapter に順に投げて**確かめる。

React を実際に描画しない。 `tests/e2e/fixture` に当たるものは
`src/lib/next-server.ts` で、mock adapter を JSON の口として node server に載せ、
Chromium の `page.request` がそこを叩く。 **画面を開かない**ため、
この仕様書が保証するのは route と observation の口が繋がっていることになる。

- module: rsc-streaming-flow
- layer: e2e-generic

## 対象機能

| 経路 | adapter の op | 実体 |
|---|---|---|
| `/article` | `renderArticle` | `src/app/article/route.ts` → `src/adapters/mock.ts` |
| `/catalog` | `streamCatalog` | `src/app/catalog/route.ts` → 同上 |
| `/signaling` (`kind: 'transition'`) | `driveTransition` | `src/app/signaling/route.ts` → 同上 |
| `/signaling` (`kind: 'form'`) | `driveFormAction` | 同上 |

`/signaling` だけが 2 つの op を持ち、body の `kind` で分かれる。

## 仕様の要約

### server は 3 route を exact match で引く

`ROUTE_MAP` が `/article` / `/catalog` / `/signaling` の 3 つを持ち、
query 文字列は落として path だけで引く。 それ以外は 404。

| 入力 | 実測 |
|---|---|
| `POST /does-not-exist` | **404** `{"ok":false,"errorKind":"route_not_found"}` |
| `GET /article` | **405** `{"ok":false,"errorKind":"method_not_allowed"}` |
| parse できない body | 400 `{"ok":false,"errorKind":"body_parse_failed"}` |

**method の判定が route の判定より先に来る**。 存在しない path へ `GET` すると
404 ではなく 405 になる。

### status は `ok` で決まる

route に届いた後は `response.ok ? 200 : 400` の 2 値しかない。
validator の失敗も adapter が捕えた失敗も、どちらも 400 で返る。

### `/article` は既定で 4 chunk を返す

`chunks` を渡さないと `synthesizeArticleChunks` が組み立てる。 実測した値。

| 入力 | `chunkCount` | `hasFallback` |
|---|---|---|
| `chunks` 省略 | **4** | `true` |
| `chunks: ['<p>1</p>', '<p>2</p>']` | **2** | `true` |

**`hasFallback` は常に真**。 `suspenseFallback` を省いても mock が
`<template data-suspense="pending" data-route="...">` を組み立てて入れるため、
`false` になる入力が HTTP から作れない。

trace には 1 回の描画で `renderArticle` → `enterSuspense` → `streamChunk` × chunk 数
→ `completeArticle` が積まれる (実測で既定 4 chunk の時 7 件)。

### `/catalog` は境界の水和と失敗の捕捉を 1 回で回す

実測した推移。

| 入力 | `pendingCount` | `hydratedCount` | `errorCount` |
|---|---|---|---|
| 境界 2 件 + 復帰可能な失敗 1 件 | 0 | **2** | 1 |
| 境界 1 件 + 復帰不能な失敗 1 件 | 0 | **0** | 1 |

**復帰不能な失敗は水和を止める**。 それでも応答は `ok: true` / 200 で、
`hydratedCount` が 0 であることからしか区別できない。

`pendingCount` は応答では常に 0 になる。 1 回の呼出の中で pend してから hydrate
するため、途中の状態が HTTP に出ない。

trace は 2 件目の呼出で `startCatalog` → `pendCatalogBoundary` →
`captureCatalogError` の 3 件で止まり、`hydrateCatalogBoundary` が現れない。

### `/signaling` は 2 つの op を持つ

実測した値。

| `kind` | 応答 |
|---|---|
| `transition` | `transitionId: 'e2e-nav'`、`elementCount: 1`、`assertionCount: 1`、**`documentTransition: null`** |
| `form` | `enhanced: true`、`optimisticApplied: true`、`resolved: true` |

`documentTransition` は body に `documentTransition` を渡さない限り `null` になる。

form の 3 つの真偽値は、それぞれ `enhance` / `optimistic` / `resolveWith` を
渡したかどうかに対応する。 渡さなければ偽になる。

### adapter は server ごとで、trace は累積する

`startNextServer({ adapter })` に渡した adapter が全 route を処理する。
実測で 11 回の呼出 (成功 8 / 失敗 3) を 1 つの server に投げると trace が **35 件**積まれた。
失敗した 3 件 (404 / 405 / validator) は adapter に届かないため trace を作らない。

## 主な品質リスク

- **画面を開かない**。 `page.request` は Playwright の API testing helper で、
  RSC の streaming が browser の parser にどう届くかは 1 度も通らない。
  chunk の順序も `chunks` 配列の順序として観測しているだけで、
  network 上の到着順ではない
- **`hasFallback` が常に真**。 mock が既定の fallback を組み立てるため、
  Suspense の fallback を持たない描画が HTTP から作れない
- **復帰不能な失敗が 200 で返る**。 `ok: true` のまま `hydratedCount` が 0 になるだけなので、
  status だけを見る consumer は水和が止まったことに気付けない
- **`pendingCount` が応答では常に 0**。 pend と hydrate が 1 呼出の中で完結するため、
  途中で止まった状態を HTTP から観測できない
- **`errorKind` が 2 種類の由来を混ぜる**。 validator の失敗は
  `routeId_required` のような固定 token だが、adapter が投げた失敗は
  `coerceErrorKind` が `err.message` をそのまま返すため英文になる。
  consumer が token として扱うと後者で外れる
- **adapter の失敗経路に HTTP から届かない**。 mock は `routeId` /
  `articleId` が空なら投げるが、validator が先に `routeId_required` /
  `articleId_required` で 400 を返すため、この分岐は e2e から通らない
- **method の判定が route より先**。 存在しない path への `GET` が 404 ではなく
  405 になるため、`405` を「path はあるが method が違う」 と読むと外れる

## 推奨テスト構成

`startNextServer({ adapter })` が mock adapter を載せた server を port 0 で立てる。
`chromium.launch()` → `browser.newContext({ baseURL })` → `page.request` で投げる。

`page.goto` は要らない。 `page.request` は browser の fetch ではなく Playwright の
API testing helper なので、CORS の事前確認を通らない。

**adapter は server ごと**。 trace を数える test を書くなら server を分ける。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | 記事の描画が chunk を積む | `chunkCount` / `hasFallback` |
| 2 | 目録が水和と失敗を分けて数える | `hydratedCount` / `errorCount` |
| 3 | 画面遷移が要素と assertion を数える | `elementCount` / `assertionCount` |
| 4 | form action の 3 段が揃う | `enhanced` / `optimisticApplied` / `resolved` |
| 5 | 4 経路の連結 | 同じ context から順に投げて全部通る |
| 6 | 未知 path の扱い | 404 |
| 7 | 誤 method の扱い | 405 |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-E2E-001 | 4 経路が 1 つの context から連続で通る | `seed: 42` / `latencyMs: 0` の mock adapter を載せた server と、その `baseURL` に紐づく `page.request` | `/article` (fallback 指定) → `/catalog` (境界 2 件 + 復帰可能な失敗 1 件) → `/signaling` (`transition`) → `/signaling` (`form`) を順に投げる | 記事は `ok===true`、`kind==='render'`、`chunkCount>=4`。 目録は `pendingCount===0`、`hydratedCount===2`、`errorCount===1`。 遷移は `transitionId==='e2e-nav'`、`elementCount===1`、`assertionCount===1`。 form は `enhanced===true`、`optimisticApplied===true`、`resolved===true` | P0 | yes | node | `/article` `/catalog` `/signaling` |
| T-E2E-002 | 未知 path が 404 になる | 同上 | `POST /does-not-exist` を投げる | `status===404` | P1 | yes | node | `/does-not-exist` |
| T-E2E-003 | 誤 method が 405 になる | 同上 | `GET /article` を投げる | `status===405` | P1 | yes | node | `/article` |

## 既存 test との対応

- 探索した runtime — `typescript`
- 探索した path — `examples/dogfood-nextjs-rsc-streaming-app/` 配下の `*.test.ts` / `*.test.tsx` / `*.spec.ts` / `*.spec.tsx` (`node_modules` / `.next` / `.turbo` / `dist` / `.vitest-dist` は除外)。 実在したのは `tests/` と `tests/e2e/` の 2 dir
- 探索した test file — 5 件

| TC | 既存 test の候補 | 判定 |
|---|---|---|
| T-E2E-001 | `T-E2E-001 article render + catalog stream + signaling transition end to end` (`examples/dogfood-nextjs-rsc-streaming-app/tests/e2e/rsc-streaming-flow.spec.ts:39`) | 既覆 (候補) |
| T-E2E-002 | `T-E2E-002 404 route returns ok:false` (`examples/dogfood-nextjs-rsc-streaming-app/tests/e2e/rsc-streaming-flow.spec.ts:126`) | 既覆 (候補) |
| T-E2E-003 | `T-E2E-003 GET method is rejected with 405` (`examples/dogfood-nextjs-rsc-streaming-app/tests/e2e/rsc-streaming-flow.spec.ts:144`) | 既覆 (候補) |

## 自動化すべきテスト

既覆 (候補)。

- T-E2E-001 (P0) — 4 経路を 1 つの `page.request` から順に投げ、記事 / 目録 / 遷移 / form が続けて通ることを確かめる happy path
- T-E2E-002 (P1) — 未知 path が 404 になることを確かめる
- T-E2E-003 (P1) — `GET` が 405 で拒まれることを確かめる

**T-E2E-001 は 4 経路を 1 件に畳んである**。 4 つは互いの状態に依存しないので分けても
値は変わらないが、1 つの adapter が 4 op を続けて処理できることを 1 件で示す形にしてある。

**T-E2E-002 と T-E2E-003 は server を作り直す**。 adapter が server ごとなので、
T-E2E-001 の trace を引き継がない。

**この 3 件が覆っていない範囲**。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| `chunkCount` の具体値 (4) | できる | `>=4` の範囲でしか assert していない |
| `chunks` を渡した時の件数 | できる | 省略した形だけを送っている |
| `hasFallback` | できる | 応答に含まれるが assert していない |
| 復帰不能な失敗で `hydratedCount` が 0 になること | できる | `recoverable: true` だけを送っている |
| `documentTransition` | できる | 渡していない (常に `null`) |
| form の 3 真偽値が偽になる形 | できる | 3 つとも渡した形だけを送っている |
| trace の中身と件数 | できる | `traces()` を読んでいない |
| validator の失敗 (`routeId_required` 等) | できる | 妥当な body だけを送っている |
| `body_parse_failed` | できる | 壊れた body を送っていない |
| adapter が投げる失敗 | **できない** | validator が先に 400 を返すため、`routeId` / `articleId` が空の状態を adapter へ渡せない |

最後の 1 件だけが到達できない。 mock adapter の失敗経路は単体テストが
`makeMockAdapter()` を直接呼んで確かめる。

## 手動確認でよいテスト

(なし)

## 不足している仕様

- 応答の `errorKind` が 2 種類の由来を混ぜている。 validator の失敗は
  `routeId_required` のような固定 token だが、adapter が投げた失敗は
  `coerceErrorKind` が `err.message` をそのまま返すため英文になる。
  consumer が token として扱えるのかどうかが決まっていない
- 復帰不能な失敗を `ok: true` / 200 で返すかが決まっていない。 現在は
  `hydratedCount` が 0 になるだけで status に出ないが、水和が止まったことを
  status で示すのか body だけで示すのかが定まっていない
