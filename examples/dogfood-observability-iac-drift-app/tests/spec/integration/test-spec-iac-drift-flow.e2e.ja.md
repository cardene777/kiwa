# test-spec-iac-drift-flow (e2e-generic layer)

IaC の計画取得 (plan) / 乖離検知 (drift) / 方針評価と費用按分 (policy) の 3 面を、
**同じ adapter に順に投げて**確かめる。

3 面とも **session の状態機械**を持つ。 `start` で開き、op で進め、`close` で閉じる。

- module: iac-drift-flow
- layer: e2e-generic

## 対象機能

| 経路 | `kind` | adapter の op |
|---|---|---|
| `/plan` | `start` / `capture` / `close` | `startPlan` / `capturePlan` / `closePlan` |
| `/drift` | `start` / `detect` / `close` | `startDrift` / `detectDrift` / `closeDrift` |
| `/policy` | `start` / `evaluate` / `attribute` / `close` | `startPolicy` / `evaluatePolicy` / `attributeCost` / `closePolicy` |

op 名は `src/adapters/interface.ts` の宣言をそのまま写した。

`src/lib/next-server.ts` が 3 route を載せ、Chromium の `page.request` が叩く。
Chromium の空 Page は作るが **app の UI へは遷移しない**ため、この仕様書が保証するのは
route と observation の口が繋がっていることになる。

## 仕様の要約

### status は route に届く前だけ分かれる

| 段 | status | `errorKind` |
|---|---|---|
| method が `POST` でない | **405** | `method_not_allowed` |
| path が 3 route のどれでもない | **404** | `route_not_found` |
| body を JSON として読めない | **400** | `body_parse_failed` |
| route に届いた | **200** | 失敗でも 200 |

**route に届いた後は成功も失敗も 200**。 validator の失敗も adapter の失敗も
`{"ok": false, "errorKind": ...}` を 200 で返すため、**status では成否を判定できない**。

`dispatch` の外側に 500 (`dispatch_failed`) を返す `catch` があり、
**`JSON.stringify(responseBody)` もその `try` の中にある**。 3 route の handler は
いずれも自前で `catch` するので通常の応答では届かないが、JSON 化できない値を返す
adapter を差し込めば到達できる。

### `errorKind` は 5 種類の由来を混ぜる

| 由来 | 例 | 形 |
|---|---|---|
| pre-dispatch | `route_not_found` / `method_not_allowed` / `body_parse_failed` | 固定 token |
| validator | `body_not_object` / `result_passed_required_boolean` | 固定 token |
| adapter の guard | `drift_session_not_found` / `drift_session_exists` | 固定 token |
| adapter の状態機械 | `capturePlan: session is plan-captured, not idle` | **英文** |
| handler の fallback | `unknown_error` (`Error` でない値が投げられた時) | 固定 token |

`coerceErrorKind` が `Error` なら `err.message` を、そうでなければ `unknown_error` を返す。
外側の `dispatch_failed` を数えると 6 種目になる。

### session は 1 度しか進めない

実測した推移 (`/plan`)。

| 呼出 | 応答 |
|---|---|
| `start` | `ok: true` |
| `capture` (1 回目) | `ok: true` / `changeCount: 3` / `additions: 1` / `modifications: 1` / `deletions: 1` |
| `capture` (2 回目) | **`ok: false`** / `capturePlan: session is plan-captured, not idle` |
| `close` | `ok: true` |
| `close` 後の `evaluate` (policy 面) | `ok: false` / `policy_session_not_found` |

`close` すると session そのものが消えるため、状態機械の英文ではなく
`*_session_not_found` の token になる。

### `driftedResources` は集合の対称差

**5 通りの入力で確かめた**。

| `expected` | `actual` | `driftCount` | `driftedResources` |
|---|---|---|---|
| `[a, b]` | `[a]` | 1 | `[b]` (消えた側) |
| `[a]` | `[a, x]` | 1 | `[x]` (増えた側) |
| `[a, b, c]` | `[a, rogue]` | **3** | `[b, c, rogue]` (両側) |
| `[a]` | `[a, a]` | **0** | `[]` (重複は無視) |
| `[a, b]` | `[b, a]` | **0** | `[]` (順序は無視) |

**片側だけの差も両側の差も同じように数える**。 重複と順序は結果に影響しない。
`hasDrift` は `driftCount > 0` に対応する。

### `capture` の内訳は 3 つの action だけを数える

実測した値。

| `changes` | `changeCount` | `additions` | `modifications` | `deletions` |
|---|---|---|---|---|
| `create` / `update` / `delete` を 1 件ずつ | 3 | 1 | 1 | 1 |
| `create` を 2 件 | 2 | **2** | 0 | 0 |
| `no-op` を 1 件 | **1** | 0 | 0 | 0 |

**`no-op` は `changeCount` には入るが 3 つの内訳のどれにも入らない**。
3 つの和が `changeCount` と一致しない入力が作れる。

### `totalViolations` は `passed` を見ない

実測した値。

| `results` | `policyCount` | `passed` | `failed` | `totalViolations` |
|---|---|---|---|---|
| 通過 (違反 0) + 失敗 (違反 2) | 2 | 1 | 1 | 2 |
| 通過 (違反 0) + **通過 (違反 5)** | 2 | **2** | 0 | **5** |
| 失敗 (違反 3) のみ | 1 | 0 | 1 | 3 |

**通過した方針の違反も足す**。 `passed: true` かつ `violationCount: 5` を渡すと
`passed: 2` と `totalViolations: 5` が同時に返る。

### `attribute` は費用を足すだけ

実測で `platform: 1500` と `growth: 800` を渡すと
`teamCount: 2` / `totalMonthlyCostUsd: 2300` になった。

## 主な品質リスク

- **status が成否を表さない**。 route に届いた後はすべて 200 なので、
  status だけを見る consumer は失敗に気付けない
- **`errorKind` が 5 種類の由来を混ぜる**。 4 種は固定 token だが、adapter の
  状態機械だけが英文になる。 consumer が token として扱うとそこで外れる
- **`no-op` が内訳に入らない**。 `additions + modifications + deletions` が
  `changeCount` と一致しない入力が作れるため、内訳の和を全件数として使うと外れる
- **`totalViolations` が通過した方針の違反も足す**。 「違反があれば失敗」 ではないため、
  `totalViolations > 0` を「失敗がある」 と読むと外れる
- **`driftedResources` が差の向きを持たない**。 消えたのか増えたのかを応答から
  区別できない。 復旧の手順は向きで変わる
- **app の UI へ遷移しない**。 Chromium の空 Page から `page.request` を投げるだけで、
  browser の描画も操作も 1 度も動かない
- **session の状態機械が 1 方向**。 op は 1 度しか呼べず、やり直すには `start` からになる

## 推奨テスト構成

`startNextServer({ adapter })` が mock adapter を載せた server を port 0 で立てる。
`chromium.launch()` → `browser.newContext({ baseURL })` → `page.request` で投げる。

`page.goto` は要らない。 `page.request` は Playwright の API testing helper なので
CORS の事前確認を通らない。

**op の順序が結果に効く**。 3 面とも `start` → op → `close` の順に呼ぶ。
同じ op を 2 度呼ぶと状態機械の失敗になる。

**乖離あり / なしを見るには session を 2 つ立てる**。 `detect` は 1 session に
1 度しか呼べない。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | 計画の内訳を数える | `changeCount` / `additions` / `modifications` / `deletions` |
| 2 | 乖離を検知する | `driftCount` / `hasDrift` |
| 3 | 乖離が無い時は 0 になる | `driftCount: 0` / `hasDrift: false` |
| 4 | 方針の成否を数える | `policyCount` / `passed` / `failed` |
| 5 | 費用を team ごとに足す | `teamCount` / `totalMonthlyCostUsd` |
| 6 | 3 面の連結 | 同じ context から順に投げて全部通る |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-E2E-001 | 3 面の ceremony が 1 つの context から連続で通る | `latencyMs: 0` の mock adapter を載せた server と、その `baseURL` に紐づく `page.request` | `/plan` を `start` → `capture` (`create` / `update` / `delete` を 1 件ずつ)、`/drift` を `start` → `detect` (乖離あり)、別 session で `start` → `detect` (乖離なし)、`/policy` を `start` → `evaluate` → `attribute` の順に投げ、最後に 3 面とも `close` する | plan は `workspace==='prod'`、`changeCount===3`。 drift は `driftCount===3`、`hasDrift===true`。 2 本目は `driftCount===0`、`hasDrift===false`。 policy は `policyCount===2`、`passed===1`、`failed===1`、`teamCount===2`、`totalMonthlyCostUsd===2300` | P0 | yes | node | `/plan` `/drift` `/policy` |

## 既存 test との対応

- 探索した runtime — `typescript`
- 探索した path — `examples/dogfood-observability-iac-drift-app/` 配下の `*.test.ts` / `*.test.tsx` / `*.spec.ts` / `*.spec.tsx` (`node_modules` / `.next` / `.turbo` / `dist` / `.vitest-dist` は除外)。 実在したのは `tests/` と `tests/e2e/` の 2 dir
- 探索した test file — 5 件

| TC | 既存 test の候補 | 判定 |
|---|---|---|
| T-E2E-001 | `T-E2E-001 plan capture + drift detect + policy evaluate + cost attribute end to end` (`examples/dogfood-observability-iac-drift-app/tests/e2e/iac-drift-flow.spec.ts:42`) | 既覆 (候補) |

## 自動化すべきテスト

既覆 (候補)。

- T-E2E-001 (P0) — 3 面の ceremony を 1 つの `page.request` から順に投げ、
  乖離ありと乖離なしの 2 本の drift session を含めて全部通ることを確かめる happy path

**乖離ありと乖離なしを 2 本の session で分けている**。 `detect` は 1 session に
1 度しか呼べないため、両方の分岐を見るには session を 2 つ立てる必要がある。

**この 1 件が覆っていない範囲**。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| `additions` / `modifications` / `deletions` の内訳 | できる | `changeCount` だけを assert している |
| `no-op` が内訳に入らないこと | できる | 3 つの action だけを送っている |
| `driftedResources` の中身と差の向き | できる | 件数だけを assert している |
| `totalViolations` が通過した方針の違反も足すこと | できる | 通過側の違反を 0 にしている |
| 同じ op を 2 度呼んだ時の状態機械の失敗 | できる | 各 op を 1 度ずつしか呼んでいない |
| `close` した後の呼出 | できる | `close` を最後にしている |
| validator の失敗 | できる | 妥当な body だけを送っている |
| 未知 path の 404 / 誤 method の 405 / 壊れた body の 400 | できる | 投げていない |
| `unknown_error` (`Error` でない値の throw) | **できない** | mock は `Error` しか投げないため、adapter を差し替えないと作れない |
| `dispatch_failed` (500) | **できない** | 同上。 JSON 化できない値を返す adapter が要る |

最後の 2 件は adapter を差し替えれば作れるが、`fixture` に注入口が無いため
この e2e からは到達できない。

## 手動確認でよいテスト

(なし)

## 不足している仕様

- 応答の `errorKind` を安定した token として扱えるかが決まっていない。
  pre-dispatch と validator と adapter の guard と handler の fallback は固定 token を返す
  一方、adapter の状態機械は `err.message` の英文を返すため、consumer が分岐に使える契約
  なのか表示専用なのかが source に書かれていない
- `no-op` を計画の内訳に含めるかが決まっていない。 現在は `changeCount` には入るが
  `additions` / `modifications` / `deletions` のどれにも入らないため 3 つの和が
  `changeCount` と一致しないが、一致させるのかどうかが定まっていない
