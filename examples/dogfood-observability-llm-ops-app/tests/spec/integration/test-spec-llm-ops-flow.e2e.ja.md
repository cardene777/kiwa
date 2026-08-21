# test-spec-llm-ops-flow (e2e-generic layer)

LLM 運用の 3 面 (token の計上 / prompt の記録と幻覚の検出 / 予算の確認) を、
**同じ adapter に順に投げて**確かめる。

3 面とも **session の状態機械**を持つ。 `start` で開き、op で進め、`close` で閉じる。

- module: llm-ops-flow
- layer: e2e-generic

## 対象機能

| 経路 | `kind` | adapter の op |
|---|---|---|
| `/tokens` | `start` / `count` / `close` | `startToken` / `countTokens` / `closeToken` |
| `/prompts` | `start` / `log` / `flag` / `close` | `startPrompt` / `logPrompt` / `flagHallucination` / `closePrompt` |
| `/budget` | `start` / `check` / `close` | `startBudget` / `checkBudget` / `closeBudget` |

op 名は `src/adapters/interface.ts` の宣言をそのまま写した。

`src/lib/next-server.ts` が 3 route を載せ、Chromium の `page.request` が叩く。
Chromium の空 Page は作るが **app の UI へは遷移しない**。

## 仕様の要約

### status は route に届く前だけ分かれる

| 段 | status | `errorKind` |
|---|---|---|
| method が `POST` でない | **405** | `method_not_allowed` |
| path が 3 route のどれでもない | **404** | `route_not_found` |
| body を JSON として読めない | **400** | `body_parse_failed` |
| route に届き、応答を JSON 化できた | **200** | 失敗でも 200 |
| 応答を JSON 化できない | **500** | `dispatch_failed` |

**route に届いた後は成功も失敗も 200**。 validator の失敗も adapter の失敗も
`{"ok": false, "errorKind": ...}` を 200 で返すため、**status では成否を判定できない**。

外側の `catch` は `JSON.stringify(responseBody)` も囲むため、JSON 化できない値を返す
adapter を `startNextServer({ adapter })` に渡せば 500 に到達する。
**adapter は呼出側が注入する**ので、この経路は塞がっていない。

### `errorKind` は 6 種類の由来を混ぜる

| 由来 | 例 | 形 |
|---|---|---|
| pre-dispatch | `route_not_found` / `method_not_allowed` / `body_parse_failed` | 固定 token |
| validator | `body_not_object` / `signal_metric_required_valid` | 固定 token |
| adapter の guard | `prompt_session_not_found` / `token_session_exists` | 固定 token |
| adapter の状態機械 | `countTokens: session is token-counted, not idle` | **英文** |
| handler の fallback | `unknown_error` (`Error` でない値が投げられた時) | 固定 token |
| server の外側 | `dispatch_failed` | 固定 token |

### `totalTokens` は 2 つの和

実測で `promptTokens: 1200` / `completionTokens: 480` を渡すと `totalTokens: 1680` になった。

### `exhausted` は使用額が上限**以上**

**境界を含む 3 点で確かめた**。

| `spentUsd` | `limitUsd` | `ratio` | `exhausted` |
|---|---|---|---|
| 450 | 1000 | 0.45 | false |
| **1000** | 1000 | **1** | **true** |
| 1200 | 1000 | 1.2 | true |

`ratio` は `spentUsd / limitUsd`。 **等しい時に真になる**ので、
「上限を超えた」 ではなく「上限に達した」 が正しい読み方になる。

### `flaggedCount` は metric ごとに向きが違う

`metric` は 3 値に限られる (`faithfulness` / `relevance` / `toxicity`)。
それ以外を渡すと `signal_metric_required_valid` で `ok: false` になる。

**3 metric × 3 点 (閾値の下 / 上 / 等値) の 9 通りで確かめた**。

| `metric` | `score < threshold` | `score === threshold` | `score > threshold` |
|---|---|---|---|
| `faithfulness` | **flagged** | 非 flagged | 非 flagged |
| `relevance` | **flagged** | 非 flagged | 非 flagged |
| `toxicity` | 非 flagged | **flagged** | **flagged** |

前 2 つは「高いほど良い」 ので下回った時に、`toxicity` は「低いほど良い」 ので
**閾値以上**で flag が立つ。 **等値の扱いも metric で逆になる**。

`anyFlagged` は `flaggedCount > 0` に対応する。

### session は 1 度しか進めず、`close` で消える

`close` は `Map` から session を削除する (`session.closed = true` の直後に
`tokens.delete(...)`)。 そのため **`*_session_closed` の guard には届かない** =
`close` 後の op は `*_session_not_found` で先に止まる。

ただし公開 surface は内部状態機械の全段を必須にはしない。`/prompts` の `flag` は
`log` を省くと synthetic prompt を補ってから `flagHallucination` を実行する。

## 主な品質リスク

- **status が成否を表さない**。 route に届いた後はすべて 200 なので、
  status だけを見る consumer は失敗に気付けない
- **`errorKind` が 6 種類の由来を混ぜる**。 5 種は固定 token だが、adapter の
  状態機械だけが英文になる
- **`exhausted` が等値で真になる**。 「上限を超えた」 と読むと 1 件ずれる
- **flag の向きが metric ごとに違う**。 3 値のうち 1 つだけ不等号の向きと等値の扱いが
  逆なので、共通の閾値判定を書くと `toxicity` で外れる
- **`metric` が 3 値に固定**。 新しい指標を足す口が HTTP に無い
- **app の UI へ遷移しない**。 Chromium の空 Page から `page.request` を投げるだけ
- **session の状態機械が 1 方向**。 op は 1 度しか呼べず、やり直すには `start` からになる

## 推奨テスト構成

`startNextServer({ adapter })` が mock adapter を載せた server を port 0 で立てる。
`chromium.launch()` → `browser.newContext({ baseURL })` → `page.request` で投げる。

`page.goto` は要らない。 `page.request` は Playwright の API testing helper なので
CORS の事前確認を通らない。

**予算の枯渇あり / なしを見るには session を 2 つ立てる**。 `check` は 1 session に
1 度しか呼べない。

**happy path では `flag` の前に `log` を呼ぶ**。 prompt の記録結果も観測対象だからであり、
公開 surface の到達条件ではない。`log` を省いた場合は mock adapter が synthetic prompt を
補うため、`start` → `flag` でも成功する。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | token を足す | `totalTokens` |
| 2 | prompt を記録する | `requestId` / `redacted` |
| 3 | 幻覚の signal を数える | `signalCount` / `flaggedCount` / `anyFlagged` |
| 4 | 予算内では枯渇しない | `exhausted: false` |
| 5 | 予算超過で枯渇する | `exhausted: true` |
| 6 | 3 面の連結 | 同じ context から順に投げて全部通る |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-E2E-001 | 3 面の ceremony が 1 つの context から連続で通る | `latencyMs: 0` の mock adapter を載せた server と、その `baseURL` に紐づく `page.request` | `/tokens` を `start` → `count`、`/prompts` を `start` → `log` → `flag` (3 signal)、`/budget` を `start` → `check` (予算内)、別 session で `start` → `check` (超過) の順に投げ、最後に 3 面へ `close` の request を送る | token は `serviceName==='llm-gateway'`、`model==='gpt-4o'`、`promptTokens===1200`、`completionTokens===480`、`totalTokens===1680`。 prompt は `requestId==='req-e2e-1'`、`redacted===false`、`signalCount===3`、`flaggedCount===2`、`anyFlagged===true`。 budget は `spentUsd===450`、`limitUsd===1000`、`exhausted===false`、2 本目は `exhausted===true` | P0 | yes | node | `/tokens` `/prompts` `/budget` |

## 既存 test との対応

- 探索した runtime — `typescript`
- 探索した path — `examples/dogfood-observability-llm-ops-app/` 配下の `*.test.ts` / `*.test.tsx` / `*.spec.ts` / `*.spec.tsx` (`node_modules` / `.next` / `.turbo` / `dist` / `.vitest-dist` は除外)。 実在したのは `tests/` と `tests/e2e/` の 2 dir
- 探索した test file — 5 件

| TC | 既存 test の候補 | 判定 |
|---|---|---|
| T-E2E-001 | `T-E2E-001 token count + prompt log + hallucination flag + budget check end to end` (`examples/dogfood-observability-llm-ops-app/tests/e2e/llm-ops-flow.spec.ts:43`) | 既覆 (候補) |

## 自動化すべきテスト

既覆 (候補)。

- T-E2E-001 (P0) — 3 面の ceremony を 1 つの `page.request` から順に投げ、
  予算内と超過の 2 本の budget session を含めて全部通ることを確かめる happy path

**12 回の HTTP 呼出を 1 件に畳んである** (`page.request.post` の呼出数を数えた)。
3 面は互いの状態に依存しないが、面の中では順序が効く。

**`close` は request を送るだけで応答を assert していない**。 3 面とも
`kind: 'close'` を投げるが、返り値を読んでいない。

**この 1 件が覆っていない範囲**。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| `ratio` の値 | できる | 応答に含まれるが assert していない |
| `exhausted` の等値の境界 (`spentUsd === limitUsd`) | できる | 450 / 1000 と超過の 2 点だけを送っている |
| flag の向き (`toxicity` だけ逆) | できる | 3 signal の組合せを 1 通りしか送っていない |
| `metric` が 3 値に限られること | できる | 妥当な 3 値だけを送っている |
| `redacted: true` の形 | できる | `false` だけを送っている |
| `close` の応答 | できる | request を送るだけで読んでいない |
| 同じ op を 2 度呼んだ時の状態機械の失敗 | できる | 各 op を 1 度ずつしか呼んでいない |
| validator の失敗 | できる | 妥当な body だけを送っている |
| 未知 path の 404 / 誤 method の 405 / 壊れた body の 400 | できる | 投げていない |
| `unknown_error` / `dispatch_failed` | できる | `startNextServer` に別の adapter を渡せば作れる |
| `*_session_closed` の 3 token | **できない** | `close` が `Map` から session を消すため、後続の op は `*_session_not_found` で先に止まる |

最後の 1 件だけが到達できない。

## 手動確認でよいテスト

(なし)

## 不足している仕様

- 応答の `errorKind` を安定した token として扱えるかが決まっていない。
  6 種の由来のうち adapter の状態機械だけが `err.message` の英文を返すため、
  consumer が分岐に使える契約なのか表示専用なのかが source に書かれていない
- `exhausted` が等値で真になることの読み方が決まっていない。 field 名は
  「使い切った」 を示すが、上限ちょうどを使い切りとするかは doc comment に無い
