# test-spec-chaos-aiops-flow (e2e-generic layer)

障害注入 (chaos) / 自動復旧 (remediation) / 原因分析 (rca) の 3 面を、
**同じ adapter に順に投げて**確かめる。

3 面とも **session の状態機械**を持つ。 `start` で開き、op で進め、`close` で閉じる。
op は状態を 1 つ進めるため、同じ op を 2 度呼ぶと失敗する。

- module: chaos-aiops-flow
- layer: e2e-generic

## 対象機能

| 経路 | `kind` | adapter の op |
|---|---|---|
| `/chaos` | `start` / `inject` / `rollback` / `close` | `startChaos` / `injectFault` / `evaluateRollback` / `closeChaos` |
| `/remediation` | `start` / `detect` / `execute` / `close` | `startRemediation` / `detectAnomaly` / `executeRemediation` / `closeRemediation` |
| `/rca` | `start` / `analyze` / `correlate` / `close` | `startRca` / `analyzeRootCause` / `correlateAlerts` / `closeRca` |

`src/lib/next-server.ts` が 3 route を載せ、Chromium の `page.request` が叩く。
**画面を開かない**ため、この仕様書が保証するのは route と observation の口が
繋がっていることになる。

## 仕様の要約

### status は route に届く前だけ分かれる

| 段 | status | `errorKind` |
|---|---|---|
| method が `POST` でない | **405** | `method_not_allowed` |
| path が 3 route のどれでもない | **404** | `route_not_found` |
| body を JSON として読めない | **400** | `body_parse_failed` |
| route に届いた | **200** | 失敗でも 200 |

**route に届いた後は成功も失敗も 200**。 validator の失敗も adapter の失敗も
`{"ok": false, "errorKind": ...}` を 200 で返す。 他の example
(`rsc-streaming` / `server-action` は 400、`webrtc-video` は 400 と 500) と違い、
**status では成否を判定できない**。

`dispatch` の外側に 500 (`dispatch_failed`) を返す `catch` があるが、
3 route の handler がいずれも自前で `catch` するため **この分岐には届かない**。

### `errorKind` は 4 種類の由来を混ぜる

| 由来 | 例 | 形 |
|---|---|---|
| pre-dispatch | `route_not_found` / `method_not_allowed` / `body_parse_failed` | 固定 token |
| validator | `body_not_object` / `kind_must_be_start_inject_rollback_or_close` / `fault_kind_required_valid` | 固定 token |
| adapter の guard | `chaos_session_not_found` / `chaos_session_exists` | 固定 token |
| adapter の状態機械 | `detectAnomaly: session is anomaly-detected, not idle` | **英文** |

`handleChaosRequest` の `coerceErrorKind` が `err.message` をそのまま返すため、
adapter が投げた文字列がそのまま `errorKind` になる。 前 3 種は token だが、
最後の 1 種は英文になる。

### session は 1 度しか進めない

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

`/chaos` は `close` した後の `inject` が `chaos_session_not_found` になる
(状態機械ではなく session そのものが消える)。

### `/chaos` の観測値

実測した値。

| 入力 | 応答 |
|---|---|
| `inject` (`cpu-stress` / `svc-a` / 30 秒) | `faultKind` / `faultTarget` / `durationSec` を写す |
| `rollback` (`errorRate: 0.15`、`threshold: 0.1`、影響 3 / 10) | `triggered: true` / `blastRadiusRatio: 0.3` |
| `rollback` (`errorRate: 0.05`、`threshold: 0.1`、影響 1 / 10) | **`triggered: false`** / `blastRadiusRatio: 0.1` |

`triggered` は `errorRate > threshold` で決まる。 `blastRadiusRatio` は
`affectedInstances / totalInstances`。 **`blastRadius` は `triggered` に効かない**。

### `/remediation` の観測値

`detect` は各 point の `zScore` を `zScoreThreshold` と比べる。 実測で
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

- **status が成否を表さない**。 route に届いた後はすべて 200 なので、
  status だけを見る consumer は失敗に気付けない
- **`errorKind` が 4 種類の由来を混ぜる**。 3 種は固定 token だが、adapter の
  状態機械だけが英文になる。 consumer が token として扱うと最後の 1 種で外れる
- **session の状態機械が 1 方向**。 op は 1 度しか呼べず、やり直すには
  `start` からになる。 「同じ op をもう 1 度」 が失敗として返るため、
  再試行を素朴に書くと状態機械の失敗になる
- **`blastRadius` が判定に効かない**。 `triggered` は `errorRate` と `threshold` だけで
  決まり、`blastRadiusRatio` は応答に載るだけ。 影響範囲で止める挙動は無い
- **画面を開かない**。 `page.request` は Playwright の API testing helper で、
  browser の描画も操作も 1 度も動かない
- **`dispatch_failed` (500) に届かない**。 3 route の handler がすべて自前で
  `catch` するため、外側の `catch` は死んでいる

## 推奨テスト構成

`startNextServer({ adapter })` が mock adapter を載せた server を port 0 で立てる。
`chromium.launch()` → `browser.newContext({ baseURL })` → `page.request` で投げる。

`page.goto` は要らない。 `page.request` は Playwright の API testing helper なので
CORS の事前確認を通らない。

**op の順序が結果に効く**。 3 面とも `start` → op → `close` の順に呼ぶ。
同じ op を 2 度呼ぶと状態機械の失敗になる。

**session id は面ごとに分ける**。 `/chaos` / `/remediation` / `/rca` は別の store を
持つため id が衝突しないが、同じ面の中では 1 id = 1 session になる。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | 障害注入が入力を写す | `faultKind` / `faultTarget` / `durationSec` |
| 2 | 閾値超えで巻き戻しが起きる | `triggered` / `affectedInstances` |
| 3 | 閾値内では巻き戻さない | `triggered: false` |
| 4 | 異常検知が閾値で数える | `anomalyCount` / `hasAnomaly` |
| 5 | 復旧の成否を数える | `actionCount` / `succeeded` / `failed` / `allSucceeded` |
| 6 | 根本原因を 1 つ選ぶ | `rootCause` / `failedCount` |
| 7 | 窓の中の alert をまとめる | `alertCount` / `groupCount` |
| 8 | 3 面の連結 | 同じ context から順に投げて全部通る |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-E2E-001 | 3 面の ceremony が 1 つの context から連続で通る | `latencyMs: 0` の mock adapter を載せた server と、その `baseURL` に紐づく `page.request` | `/chaos` を `start` → `inject` → `rollback` (閾値超え)、別 session で `start` → `inject` → `rollback` (閾値内)、`/remediation` を `start` → `detect` → `execute`、`/rca` を `start` → `analyze` → `correlate` の順に投げ、最後に 3 面とも `close` する | chaos は `experimentId==='exp-e2e'`、`faultKind==='network-latency'`、`faultTarget==='checkout-svc'`、`durationSec===60`、`triggered===true`、`affectedInstances===3`。 2 本目は `triggered===false`。 remediation は `anomalyCount===1`、`hasAnomaly===true`、`actionCount===3`、`succeeded===2`、`failed===1`、`allSucceeded===false`。 rca は `rootCause==='gateway'`、`failedCount===3`、`alertCount===3`、`groupCount===1` | P0 | yes | node | `/chaos` `/remediation` `/rca` |

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
  閾値超えと閾値内の 2 本の chaos session を含めて全部通ることを確かめる happy path

**1 件で 3 面 + 11 呼出を通している**。 3 面は互いの状態に依存しないが、
**面の中では順序が効く** (`start` → op → `close`) ため、面ごとに分けても
呼出の並びは同じになる。

**閾値超えと閾値内を 2 本の session で分けている**。 `rollback` は 1 session に
1 度しか呼べないため、両方の分岐を見るには session を 2 つ立てる必要がある。

**この 1 件が覆っていない範囲**。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| `blastRadiusRatio` の値 | できる | 応答に含まれるが assert していない |
| `pointCount` / `zScoreThreshold` の反映 | できる | 同上 |
| `edgeCount` の値 | できる | 同上 |
| `windowMs` の反映 | できる | 同上 |
| 同じ op を 2 度呼んだ時の状態機械の失敗 | できる | 各 op を 1 度ずつしか呼んでいない |
| `close` した後の呼出 | できる | `close` を最後にしている |
| validator の失敗 (`body_not_object` 等) | できる | 妥当な body だけを送っている |
| 未知 path の 404 / 誤 method の 405 / 壊れた body の 400 | できる | 投げていない |
| `dispatch_failed` (500) | **できない** | 3 route の handler がすべて自前で `catch` するため、外側の `catch` に届かない |

最後の 1 件だけが到達できない。

## 手動確認でよいテスト

(なし)

## 不足している仕様

- 応答の `errorKind` を安定した token として扱えるかが決まっていない。
  pre-dispatch と validator と adapter の guard は固定 token を返す一方、
  adapter の状態機械は `err.message` の英文を返すため、consumer が分岐に使える契約なのか
  表示専用なのかが source に書かれていない
- `blastRadius` を巻き戻しの判定に使うかが決まっていない。 現在は
  `blastRadiusRatio` を応答に載せるだけで `triggered` には効かないが、
  影響範囲で止める挙動を持つのかどうかが定まっていない
