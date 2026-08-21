# test-spec-chaos-aiops-flow (e2e-generic layer)

障害注入 (chaos) / 自動復旧 (remediation) / 原因分析 (rca) の 3 面を、
**同じ adapter に順に投げて**確かめる。

3 面とも session store を持つ。 `start` で開き、`close` で削除する。
mock adapter の domain op は内部の状態機械を進めるため、同じ妥当な op を
`close` 前に 2 度呼ぶと失敗する。 ただし remediation と rca には前提段を補う
bootstrap があり、公開 op 1 回が内部状態を 2 段以上進める場合がある。

- module: chaos-aiops-flow
- layer: e2e-generic

## 対象機能

| 経路 | `kind` | adapter の op |
|---|---|---|
| `/chaos` | `start` / `inject` / `rollback` / `close` | `startChaos` / `injectFault` / `triggerRollback` / `closeChaos` |
| `/remediation` | `start` / `detect` / `execute` / `close` | `startRemediation` / `detectAnomaly` / `executeRemediation` / `closeRemediation` |
| `/rca` | `start` / `analyze` / `correlate` / `close` | `startRca` / `analyzeRootCause` / `correlateAlerts` / `closeRca` |

`src/lib/next-server.ts` が 3 route を載せ、Chromium で作った空の Page の
`page.request` が叩く。 **app の画面へは遷移せず UI を描画・操作しない**ため、
この仕様書が保証するのは route と observation の口が繋がっていることになる。

## 仕様の要約

### status は通常の route 応答より前だけ分かれる

| 段 | status | `errorKind` |
|---|---|---|
| method が `POST` でない | **405** | `method_not_allowed` |
| path が 3 route のどれでもない | **404** | `route_not_found` |
| body を JSON として読めない | **400** | `body_parse_failed` |
| dispatch の応答を JSON 化できた | **200** | validator / adapter の失敗でも 200 |

shipped mock / real adapter の通常応答では、**route が一致して body を読めた後は
成功も失敗も 200**。 validator の失敗も adapter の失敗も
`{"ok": false, "errorKind": ...}` を 200 で返す。 他の example
(`rsc-streaming` / `server-action` は 400、`webrtc-video` は 400 と 500) と違い、
**status では成否を判定できない**。

`dispatch` の外側に 500 (`dispatch_failed`) を返す `catch` があるが、
3 route の handler が adapter の throw / reject を自前で `catch` するため、shipped
adapter の通常の失敗はここへ届かない。 一方、この `try` は handler 呼出だけでなく
`JSON.stringify(responseBody)` も囲む。 runtime で不正な custom adapter を注入して
JSON 化できない値を返させるなど、handler 外で例外が起きれば 500 には到達できる。

### `errorKind` は 6 種類の由来を混ぜる

| 由来 | 例 | 形 |
|---|---|---|
| pre-dispatch | `route_not_found` / `method_not_allowed` / `body_parse_failed` | 固定 token |
| validator | `body_not_object` / `kind_must_be_start_inject_rollback_or_close` / `fault_kind_required_valid` | 固定 token |
| adapter の guard | `chaos_session_not_found` / `chaos_session_exists` | 固定 token |
| adapter の状態機械 | `detectAnomaly: session is anomaly-detected, not idle` | **英文** |
| handler の coercion fallback | `unknown_error` | 固定 token |
| server 外側の catch | `dispatch_failed` | 固定 token |

3 handler の `coerceErrorKind` は `Error` なら `err.message` をそのまま返すため、
adapter が投げた `Error` の message が `errorKind` になる。 non-`Error` を throw / reject
した場合は `unknown_error` になる。 通常経路では pre-dispatch / validator / adapter
guard が token、adapter の状態機械が英文になる。 さらに handler 外の例外は
`dispatch_failed` になる。

### 同じ domain op は再実行できない

実測した推移 (`/remediation`)。

| 呼出 | 応答 |
|---|---|
| `start` | `ok: true` |
| `detect` (1 回目) | `ok: true` / `pointCount: 2` / `anomalyCount: 1` / `hasAnomaly: true` |
| `detect` (2 回目) | **`ok: false`** / `detectAnomaly: session is anomaly-detected, not idle` |
| `execute` (1 回目) | `ok: true` / `actionCount: 3` / `succeeded: 2` / `failed: 1` / `allSucceeded: false` |
| `execute` (2 回目) | **`ok: false`** / `executeRemediation: session is remediation-executed, not anomaly-detected` |

`/rca` も同じ形で、`correlate` を 2 度呼ぶと
`correlateAlerts: session is alerts-correlated, not root-cause-analyzed` になる。

`/chaos` も同じ妥当な `inject` を 2 度呼ぶと
`injectFault: session is fault-injected, not idle`、`rollback` を 2 度呼ぶと
`computeBlastRadius: session is rollback-triggered, not fault-injected` になる。
`close` した後の `inject` は `chaos_session_not_found` になる
(状態機械ではなく session そのものが消える)。 `start` / `close` の 2 回目も
session guard の固定 token であり、英文になるのは domain op の状態違反である。

ただし公開 surface は内部状態機械の全段を必須にはしない。 `/remediation` の `execute` は
`detect` を省くと synthetic anomaly を補い、`/rca` の `analyze` / `correlate` も
不足した anomaly / remediation / root-cause 段を補ってから実行する。

### `/chaos` の観測値

実測した値。

| 入力 | 応答 |
|---|---|
| `inject` (`cpu-stress` / `svc-a` / 30 秒) | `faultKind` / `faultTarget` / `durationSec` を写す |
| `rollback` (`errorRate: 0.15`、`threshold: 0.1`、影響 3 / 10) | `triggered: true` / `blastRadiusRatio: 0.3` |
| `rollback` (`errorRate: 0.05`、`threshold: 0.1`、影響 1 / 10) | **`triggered: false`** / `blastRadiusRatio: 0.1` |

`triggered` は `errorRate >= threshold` で決まる。 `blastRadiusRatio` は
`affectedInstances / totalInstances`。 妥当な入力の範囲では、
**`blastRadius` の値は `triggered` に効かない**。 interface と semantics の doc comment も
rollback を error rate based と定義しており、これは不足仕様ではなく現在の契約である。

### `/remediation` の観測値

`detect` は各 point の `Math.abs(zScore) >= zScoreThreshold` を数える。 実測で
`zScore: 4.2` と `0.8` の 2 点に閾値 3 を当てると `anomalyCount: 1` になった。

`execute` は各 action の `success` を数える。 3 件のうち 2 件が真なら
`succeeded: 2` / `failed: 1` / `allSucceeded: false`。

### `/rca` の観測値

`analyze` は `edges` と `failedServices` から根本原因を 1 つ選ぶ。 実測で
`gateway → api → db` の連鎖と `['gateway','api','db']` の失敗から
`rootCause: 'gateway'` / `edgeCount: 2` / `failedCount: 3` になった。

`correlate` は `windowMs` の中の alert をまとめる。 実測で 1000 / 1500 / 2000 ms の
3 件に窓 5000 ms を当てると `groupCount: 1` になった。

## 主な品質リスク

- **status が成否を表さない**。 通常の route 応答は失敗でも 200 なので、
  status だけを見る consumer は失敗に気付けない。 handler 外の例外だけは 500 になる
- **`errorKind` が 6 種類の由来を混ぜる**。 通常の token と状態機械の英文に加え、
  coercion fallback と server 外側の catch が別 token を返す
- **session の domain op は同じ妥当な呼出を再実行できない**。やり直すには
  `close` 後に `start` からになる。 一方、remediation / rca は不足した前提段を
  bootstrap するため、公開 surface は内部状態機械と 1 対 1 ではない
- **`blastRadius` が判定に効かない**。 `triggered` は `errorRate` と `threshold` だけで
  決まり、`blastRadiusRatio` は応答に載るだけ。 影響範囲で止める挙動は無い
- **app UI を開かない**。空の Page は作るが、`page.request` は Playwright の
  API testing helper であり、app 画面の描画も操作も行わない
- **`dispatch_failed` (500) は通常の adapter 失敗では通らない**。 handler が adapter の
  例外を応答へ変換する一方、handler 外の serialization 等の例外では通る

## 推奨テスト構成

`startNextServer({ adapter })` が mock adapter を載せた server を port 0 で立てる。
`chromium.launch()` → `browser.newContext({ baseURL })` → `page.request` で投げる。

`page.goto` は要らない。 `page.request` は Playwright の API testing helper なので
CORS の事前確認を通らない。

**op の順序が結果に効く**。 happy path は 3 面とも `start` → domain op → `close` の順に呼ぶ。
同じ妥当な domain op を 2 度呼ぶと状態機械の失敗になる。 remediation / rca では
前提の domain op を省略しても adapter が内部段を bootstrap する経路がある。

**session id は面ごとに分ける**。 `/chaos` / `/remediation` / `/rca` は別の store を
持つため id が衝突しないが、同じ面の中では 1 id = 1 session になる。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | 障害注入が入力を写す | `faultKind` / `faultTarget` / `durationSec` |
| 2 | 閾値以上で巻き戻しが起きる | `triggered` / `affectedInstances` |
| 3 | 閾値未満では巻き戻さない | `triggered: false` |
| 4 | 異常検知が閾値で数える | `anomalyCount` / `hasAnomaly` |
| 5 | 復旧の成否を数える | `actionCount` / `succeeded` / `failed` / `allSucceeded` |
| 6 | 根本原因を 1 つ選ぶ | `rootCause` / `failedCount` |
| 7 | 窓の中の alert をまとめる | `alertCount` / `groupCount` |
| 8 | 3 面の連結 | 同じ context から順に投げて全部通る |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-E2E-001 | 3 面の ceremony が 1 つの context から連続で通る | `latencyMs: 0` の mock adapter を載せた server と、その `baseURL` に紐づく `page.request` | `/chaos` を `start` → `inject` → `rollback` (閾値超過)、別 session で `start` → `inject` → `rollback` (閾値未満)、`/remediation` を `start` → `detect` → `execute`、`/rca` を `start` → `analyze` → `correlate` の順に投げ、最後に 3 面とも `close` する | chaos は `experimentId==='exp-e2e'`、`faultKind==='network-latency'`、`faultTarget==='checkout-svc'`、`durationSec===60`、`triggered===true`、`affectedInstances===3`。 2 本目は `triggered===false`。 remediation は `anomalyCount===1`、`hasAnomaly===true`、`actionCount===3`、`succeeded===2`、`failed===1`、`allSucceeded===false`。 rca は `rootCause==='gateway'`、`failedCount===3`、`alertCount===3`、`groupCount===1` | P0 | yes | node | `/chaos` `/remediation` `/rca` |

## 既存 test との対応

- 探索した runtime — `typescript`
- 探索した path — `examples/dogfood-observability-chaos-aiops-app/` 配下の `*.test.ts` / `*.test.tsx` / `*.spec.ts` / `*.spec.tsx` (`node_modules` / `.next` / `.turbo` / `dist` / `.vitest-dist` は除外)。 実在したのは `tests/` と `tests/e2e/` の 2 dir
- 探索した test file — 5 件

| TC | 既存 test の候補 | 判定 |
|---|---|---|
| T-E2E-001 | `T-E2E-001 fault injection + rollback + anomaly + remediation + rca + correlation end to end` (`examples/dogfood-observability-chaos-aiops-app/tests/e2e/chaos-aiops-flow.spec.ts:43`) | 既覆 (候補) |

## 自動化すべきテスト

既覆 (候補)。

- T-E2E-001 (P0) — 3 面の ceremony を 1 つの `page.request` から順に投げ、
  閾値超過と閾値未満の 2 本の chaos session を含めて全部通ることを確かめる happy path

**1 件で 3 面 + 16 HTTP 呼出を通している**。 3 面は互いの状態に依存しないが、
**面の中では順序が効く** (`start` → op → `close`) ため、面ごとに分けても
呼出の並びは同じになる。

**閾値超過と閾値未満を 2 本の session で分けている**。 `rollback` は 1 session に
1 度しか呼べないため、両方の分岐を見るには session を 2 つ立てる必要がある。

**この 1 件が覆っていない範囲**。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| `blastRadiusRatio` の値 | できる | 応答に含まれるが assert していない |
| `pointCount` / `zScoreThreshold` の反映 | できる | 同上 |
| `edgeCount` の値 | できる | 同上 |
| `windowMs` の反映 | できる | 同上 |
| 同じ妥当な domain op を 2 度呼んだ時の状態機械の失敗 | できる | 各 op を 1 度ずつしか呼んでいない |
| `close` した後の呼出 | できる | `close` を最後にしている |
| validator の失敗 (`body_not_object` 等) | できる | 妥当な body だけを送っている |
| 未知 path の 404 / 誤 method の 405 / 壊れた body の 400 | できる | 投げていない |
| `dispatch_failed` (500) | できる | shipped mock adapter の通常値では通らないが、JSON 化できない値を返す custom adapter 等で handler 外の例外を起こせる |

この表に実装上の到達不能分岐はない。ただし最後の 1 件は通常の request 入力だけでは作れず、
server に例外を起こす adapter を注入する必要がある。

## 手動確認でよいテスト

(なし)

## 不足している仕様

- 応答の `errorKind` を安定した token として扱えるかが決まっていない。
  pre-dispatch と validator と adapter の guard は固定 token を返す一方、
  adapter の状態機械は `err.message` の英文を返し、fallback / 外側 catch も別 token を
  返すため、consumer が分岐に使える契約なのか表示専用なのかが source に書かれていない
