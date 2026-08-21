# test-spec-server-action-flow (e2e-generic layer)

Server Action の 3 面 (購読 form の submit / いいねの楽観更新 / login の redirect) を、
**同じ adapter に順に投げて**確かめる。

React を実際に描画しない。 `src/lib/next-server.ts` が mock adapter を JSON の口として
node server に載せ、Chromium の `page.request` がそこを叩く。 **画面を開かない**ため、
この仕様書が保証するのは route と observation の口が繋がっていることになる。

- module: server-action-flow
- layer: e2e-generic

## 対象機能

| 経路 | adapter の op | 実体 |
|---|---|---|
| `/subscribe` | `runSubscribeAction` | `src/app/subscribe/route.ts` → `src/adapters/mock.ts` |
| `/like` | `runLikeAction` | `src/app/like/route.ts` → 同上 |
| `/login` | `runLoginAction` | `src/app/login/route.ts` → 同上 |

3 route とも `kind` を 1 値しか受けない (`submit` / `run` / `run`)。

## 仕様の要約

### server は 3 route を exact match で引く

`ROUTE_MAP` が `/subscribe` / `/like` / `/login` の 3 つを持つ。 実測した値。

| 入力 | 実測 |
|---|---|
| `POST /nope` | **404** `{"ok":false,"errorKind":"route_not_found"}` |
| `GET /subscribe` | **405** `{"ok":false,"errorKind":"method_not_allowed"}` |

**method の判定が route の判定より先に来る**。 存在しない path へ `GET` すると
404 ではなく 405 になる。

route に届いた後の status は `response.ok ? 200 : 400` の 2 値しかない。

### `/subscribe` は 3 つの必須と 2 つの形式検査を持つ

実測した値。

| 入力 | 応答 |
|---|---|
| `form: {email, plan}` + `revalidatePath: '/subscribers'` | 200 / `fieldCount: 2` / `revalidatedPaths: ['/subscribers']` |
| `revalidatePath` 省略 | 400 `revalidatePath_required` |
| `revalidatePath: 'no-slash'` | 400 `revalidatePath_must_start_with_slash` |
| `form: {x: 1}` (数値) | 400 `form_values_must_be_strings` |
| `form: {}` (空) | **200** / `fieldCount: 0` / `revalidatedPaths: ['/p']` |

**空の form が成功する**。 `form` は object であることしか要求されないため、
何も入っていない form でも `fieldCount: 0` で 200 が返る。

`revalidatePath` には先頭 `/` の検査があるが、**`/like` の `revalidateTag` には
形式の検査が無い** (非空の文字列であればよい)。

### `/like` は楽観更新と却下を真偽値で返す

実測した値。

| 入力 | `optimisticApplied` | `resolved` | `rejected` |
|---|---|---|---|
| `optimistic` + `resolveWith` + `revalidateTag` | true | true | false |
| `optimistic` 省略 | **false** | true | false |
| `rejectWith: 'boom'` | false | **false** | **true** |

`optimisticApplied` は `optimistic` を渡したかどうかに対応する。
`resolved` は `resolveWith` の有無ではなく **`rejectWith` の有無**で決まり、
省略時は真になる。

**却下されても `ok: true` / 200 で返る**。 `rejected: true` からしか区別できない。

### `/login` は enhance と redirect が任意

実測した値。

| 入力 | `enhanced` | `redirectUrl` | `submitted` |
|---|---|---|---|
| `enhance` + `redirectTo: '/dashboard'` | true | `'/dashboard'` | true |
| どちらも省略 | **false** | **null** | true |
| `enhance: {method: 'post'}` (`actionUrl` 無し) | — | — | 400 `enhance_actionUrl_required` |

`enhance` は省略できるが、**渡すなら `actionUrl` が要る**。

### 注入した adapter の trace は累積する

`startNextServer({ adapter })` に渡した adapter が全 route を処理する。
server は adapter を生成も reset もしないため、同じ adapter を複数 server へ渡せば
trace も共有される。

実測では 10 通りの body を POST し、さらに `GET /subscribe` を 1 回、計 11 回の
HTTP 呼出を 1 つの server に投げると trace が **19 件**積まれた。
成功は 4 件、adapter に届かない失敗は 7 件で、後者は trace を作らない。

1 呼出あたりの trace は op によって違う。

| 経路 | trace |
|---|---|
| `/subscribe` | `startSubscribe` → `submitSubscribe` → `revalidateSubscribePath` (3 件) |
| `/like` | `startLike` → `markLikePending` → `applyOptimisticLike` → `submitLike` → `revalidateLikeTag` → `resolveLike` (6 件) |
| `/login` (enhance + redirect あり) | `startLogin` → `enhanceLogin` → `markLoginPending` → `submitLogin` → `redirectLogin` → `resolveLogin` (6 件) |
| `/login` (どちらも省略) | `startLogin` → `markLoginPending` → `submitLogin` → `resolveLogin` (4 件) |

**任意の入力を省くと trace も減る**。 `enhanceLogin` と `redirectLogin` は
対応する入力を渡した時だけ現れる。

## 主な品質リスク

- **画面を開かない**。 `page.request` は Playwright の API testing helper で、
  form の submit が browser からどう飛ぶかは 1 度も通らない。
  楽観更新も真偽値として観測しているだけで、描画の差し替えは見ていない
- **却下が 200 で返る**。 `/like` は `rejected: true` になっても `ok: true` / 200 なので、
  status だけを見る consumer は却下に気付けない
- **空の form が成功する**。 `fieldCount: 0` で 200 が返るため、
  何も送っていない submit を「成功した submit」 と読める
- **`revalidatePath` と `revalidateTag` で検査の厳しさが違う**。 前者は先頭 `/` を
  要求するが、後者は非空であればよい。 同じ「再検証の対象」 なのに形式の扱いが逆
- **`errorKind` が 2 種類の由来を混ぜる**。 validator の失敗は
  `revalidatePath_required` のような固定 token だが、adapter が投げた失敗は
  `err.message` をそのまま返すため英文になる
- **任意入力の省略が観測から消える**。 `enhanced` / `optimisticApplied` は
  入力を渡したかどうかを写すだけなので、「渡したが効かなかった」 と
  「渡していない」 を応答から区別できない

## 推奨テスト構成

`startNextServer({ adapter })` が mock adapter を載せた server を port 0 で立てる。
`chromium.launch()` → `browser.newContext({ baseURL })` → `page.request` で投げる。

`page.goto` は要らない。 `page.request` は browser の fetch ではなく Playwright の
API testing helper なので、CORS の事前確認を通らない。

trace を test 間で分けるなら、server だけでなく adapter も test ごとに作る。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | 購読 form が field を数えて再検証を積む | `fieldCount` / `revalidatedPaths` |
| 2 | いいねが楽観更新と再検証を積む | `optimisticApplied` / `revalidatedTags` / `resolved` |
| 3 | login が enhance と redirect を写す | `enhanced` / `redirectUrl` / `submitted` |
| 4 | 3 経路の連結 | 同じ context から順に投げて全部通る |
| 5 | 未知 path の扱い | 404 |
| 6 | 誤 method の扱い | 405 |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-E2E-001 | 3 経路が 1 つの context から連続で通る | `latencyMs: 0` の mock adapter を載せた server と、その `baseURL` に紐づく `page.request` | `/subscribe` (2 field + `revalidatePath`) → `/like` (楽観更新 + `revalidateTag`) → `/login` (`enhance` + `redirectTo`) を順に投げる | 購読は `ok===true`、`fieldCount===2`、`revalidatedPaths` が `['/subscribers']`。 いいねは `optimisticApplied===true`、`resolved===true`、`revalidatedTags` が `['post-e2e-likes']`。 login は `enhanced===true`、`submitted===true`、`redirectUrl==='/dashboard'` | P0 | yes | node | `/subscribe` `/like` `/login` |
| T-E2E-002 | 未知 path が 404 になる | 同上 | `POST /does-not-exist` を投げる | `status===404` | P1 | yes | node | `/does-not-exist` |
| T-E2E-003 | 誤 method が 405 になる | 同上 | `GET /subscribe` を投げる | `status===405` | P1 | yes | node | `/subscribe` |

## 既存 test との対応

- 探索した runtime — `typescript`
- 探索した path — `examples/dogfood-nextjs-server-action-app/` 配下の `*.test.ts` / `*.test.tsx` / `*.spec.ts` / `*.spec.tsx` (`node_modules` / `.next` / `.turbo` / `dist` / `.vitest-dist` は除外)。 実在したのは `tests/` と `tests/e2e/` の 2 dir
- 探索した test file — 5 件

| TC | 既存 test の候補 | 判定 |
|---|---|---|
| T-E2E-001 | `T-E2E-001 subscribe form action + like optimistic + login redirect end to end` (`examples/dogfood-nextjs-server-action-app/tests/e2e/server-action-flow.spec.ts:37`) | 既覆 (候補) |
| T-E2E-002 | `T-E2E-002 404 route returns ok:false` (`examples/dogfood-nextjs-server-action-app/tests/e2e/server-action-flow.spec.ts:115`) | 既覆 (候補) |
| T-E2E-003 | `T-E2E-003 GET method is rejected with 405` (`examples/dogfood-nextjs-server-action-app/tests/e2e/server-action-flow.spec.ts:133`) | 既覆 (候補) |

## 自動化すべきテスト

既覆 (候補)。

- T-E2E-001 (P0) — 3 経路を 1 つの `page.request` から順に投げ、購読 / いいね / login が続けて通ることを確かめる happy path
- T-E2E-002 (P1) — 未知 path が 404 になることを確かめる
- T-E2E-003 (P1) — `GET` が 405 で拒まれることを確かめる

**T-E2E-001 は 3 経路を 1 件に畳んである**。 3 つは互いの状態に依存しないので分けても
値は変わらないが、1 つの adapter が 3 op を続けて処理できることを 1 件で示す形にしてある。

**この 3 件が覆っていない範囲**。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| `optimistic` を省いた時の `optimisticApplied` | できる | 渡した形だけを送っている |
| `rejectWith` を渡した時の `rejected` | できる | 渡していない |
| `enhance` / `redirectTo` を省いた時の `enhanced` / `redirectUrl` | できる | 両方渡した形だけを送っている |
| 空の form が 200 になること | できる | 2 field の形だけを送っている |
| `revalidatePath` の先頭 `/` 検査 | できる | 妥当な値だけを送っている |
| `form_values_must_be_strings` | できる | 文字列だけを送っている |
| `enhance_actionUrl_required` | できる | `actionUrl` を渡している |
| trace の中身と件数 | できる | `traces()` を読んでいない |
| adapter が投げる失敗 | できる | `errorKind` が英文になる形を送っていない |

**到達できないものは無い**。 3 route とも validator を通る入力の幅が広く、
`ok: false` の分岐も `rejected: true` の分岐も HTTP から作れる。

## 手動確認でよいテスト

(なし)

## 不足している仕様

- 空の `form` を成功として扱うかが決まっていない。 現在は `fieldCount: 0` で 200 を返すが、
  route の doc comment は「form action + revalidatePath ops」 としか書かず、
  何も送っていない submit を拒むのかどうかが定まっていない
- `revalidateTag` の形式が決まっていない。 `revalidatePath` には
  `revalidatePath_must_start_with_slash` があるのに、`revalidateTag` は非空であれば
  何でも通る。 同じ「再検証の対象」 でどちらを既定とするのかが書かれていない
- 却下 (`rejected: true`) を `ok: true` / 200 で返すかが決まっていない。
  現在は body の真偽値からしか区別できず、status で示すのか body だけで示すのかが
  定まっていない
