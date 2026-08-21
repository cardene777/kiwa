# test-spec-csp-headers-flow (e2e-generic layer)

CSP の組み立て / 違反報告 / 安全 header 束の 3 経路を、実 Chromium から順に叩いて確かめる。

画面は描画しない。 `src/lib/next-server.ts` が 3 route を node server に載せ、
Playwright の `page.request` が JSON を投げる。

- module: csp-headers-flow
- layer: e2e-generic

## 対象機能

| 経路 | 実体 |
|---|---|
| `POST /csp` | `src/app/csp/route.ts` → `src/adapters/mock.ts` |
| `POST /violation` | `src/app/violation/route.ts` → 同上 |
| `POST /headers` | `src/app/headers/route.ts` → 同上 |

## 仕様の要約

### 検証の失敗も 200 で返る

**この仕様書で最も重要な性質。** status で成否を判別できない。

| 種別 | status | body |
|---|---|---|
| 成功 | 200 | `{ok: true, ...}` |
| **入力の検証失敗** | **200** | `{ok: false, errorKind: '...'}` |
| **状態の不整合** | **200** | `{ok: false, kind, ..., errorKind: '...'}` |
| 未知の path | 404 | `{ok: false, errorKind: 'route_not_found'}` |
| POST 以外の method | 405 | `{ok: false, errorKind: 'method_not_allowed'}` |

status を使うのは **dispatcher の 2 種だけ**。 route へ到達した後は常に 200 になる。
実測で `routeId` を空にしても `kind` を未知の値にしても 200 が返った。

`res.status()` だけを見る client は、すべての検証失敗を成功と読む。

### `/csp` の組み立て

必須は `routeId` / `policyId` / `kind: 'build'` の 3 つ。 実測した分岐。

| 入力 | 結果 |
|---|---|
| 既定 (nonce + hash + strictDynamic + trustedTypes + reportGroup) | `headerValue` に `'strict-dynamic'` と `trusted-types default` を含む |
| 最小 (必須 3 つのみ) | `headerValue` が `default-src 'self'; script-src 'self'`、`nonce: ""` |
| `strictDynamic: false` | `'strict-dynamic'` が消える |
| `reportOnly: true` | `headerName` が **`Content-Security-Policy-Report-Only`** に変わる |
| `routeId: ''` | `{ok: false, errorKind: 'routeId_required'}` |
| `policyId` 欠落 | `{ok: false, errorKind: 'policyId_required'}` |
| `kind` が `build` 以外 | `{ok: false, errorKind: 'kind_must_be_build'}` |
| body が **配列** | `{ok: false, errorKind: 'routeId_required'}` |

最後の行が境界になる。 `typeof [] === 'object'` なので配列は最初の検査を通り、
次の `routeId` の検査で落ちる。 「object でない」 とは扱われない。

### `/headers` の束

| 入力 | 結果 |
|---|---|
| 既定 | `Strict-Transport-Security` / `X-Frame-Options: DENY` / `X-Content-Type-Options: nosniff` / `Referrer-Policy` |
| `hsts.maxAgeSec: -1` | `{ok: false, errorKind: 'hsts_maxAgeSec_required'}` |
| **`hsts.maxAgeSec: 0`** | **成功**。 `max-age=0` を出す |
| **`xFrame: 'ALLOW'` (未知)** | **黙って落とす**。 `X-Frame-Options` が付かず `validationOk: true` |
| 最小 (必須 2 つのみ) | `headers: {}`、`applied: []`、**`validationOk: true`** |

3 つとも同じ形の穴になる。 **「妥当でない値」 と「指定しない」 が区別されない**。
`max-age=0` は HSTS を無効化する値だが受理され、未知の `xFrame` は無視され、
空の束も検証を通る。

### `/violation` の 2 kind

| 入力 | 結果 |
|---|---|
| `kind: 'ingest'` (必須揃い) | `{ok: true, kind: 'ingest', accepted: true}` |
| `kind: 'close'` (ingest 済) | `{ok: true, kind: 'close'}` |
| **`kind: 'close'` (ingest なし)** | `{ok: false, kind: 'close', errorKind: 'violation_session_missing'}` |
| `disposition` が未知 | `{ok: false, errorKind: 'disposition_must_be_enforce_or_report'}` |
| `kind` が未知 | `{ok: false, errorKind: 'kind_must_be_ingest_or_close'}` |

`close` は `ingest` を前提にする。 順序が結果に効く。

## 主な品質リスク

- **status が成否を表さない**。 検証失敗も状態不整合も 200。 `res.status()` だけを見る監視は
  すべての失敗を見逃す。 body の `ok` を読む必要がある
- **`max-age=0` が受理される**。 HSTS を無効化する値だが `maxAgeSec >= 0` の検査を通る。
  設定ミスが検出されない
- **未知の `xFrame` が黙って落ちる**。 `ALLOW` のような無効な値を送っても
  `validationOk: true` が返り、header だけが消える
- **空の束が検証を通る**。 `headers: {}` / `applied: []` でも `validationOk: true`。
  「何も適用しなかった」 と「正しく適用した」 を区別できない
- **配列 body が `routeId_required` になる**。 型の誤りが値の欠落として報告されるため、
  呼出側が原因を取り違える
- **`Content-Security-Policy-Report-Only` への切替が `reportOnly` 1 つで決まる**。
  真偽値の取り違えで強制が報告のみに落ちるが、応答は成功のまま

## 推奨テスト構成

`startNextServer({ adapter })` が 3 route を node server に載せ、空き port で listen する。
`makeMockAdapter({ latencyMs: 0 })` を呼出側が作って渡すため、server と adapter の寿命は分けられる。

**この example は bootstrap を持たない。** 3 経路とも HTTP だけで完結する
(同じ構造の mtls / rbac は adapter を直接呼んで session を作る)。

`page.request.post` を使うため browser の同一 origin 制約を受けない。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | CSP の組み立て | `headerValue` の中身 |
| 2 | 違反の取り込みと締め | `accepted` / `kind` |
| 3 | header 束 | 4 つの header |
| 4 | dispatcher | 404 / 405 |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-E2E-001 | CSP / 違反 / header 束が 1 つの page から連続で通る | mock adapter を載せた server と Chromium の page | `/csp` (nonce + hash + strictDynamic + trustedTypes) → `/violation` (ingest) → `/violation` (close) → `/headers` (HSTS + Referrer + Permissions + XFO + XCTO) を順に投げる | CSP は `status===200`、`{ok: true, kind: 'build'}`、`headerValue` が `'strict-dynamic'` と `trusted-types default` を含む。 違反は `status===200` で ingest / close とも `ok: true`。 header 束は `status===200`、`validationOk===true`、`Strict-Transport-Security` が `preload` を含み、`X-Frame-Options==='DENY'`、`X-Content-Type-Options==='nosniff'` | P0 | yes | node | `/csp` `/violation` `/headers` |
| T-E2E-002 | dispatcher が未知 path と誤 method を分ける | 同上 | `POST /missing` と `GET /csp` を投げる | 前者は `status===404`、`errorKind==='route_not_found'`。 後者は `status===405`、`errorKind==='method_not_allowed'` | P1 | yes | node | `/missing` `/csp` |

## 自動化方針

T-E2E-001 は 4 手を 1 件に畳んである。 分けないのは `close` が `ingest` を前提にするため。

**`status===200` の assert はほぼ空振りになる。** route へ到達すれば必ず 200 が返るので、
実際に成否を判別しているのは `toMatchObject({ok: true, ...})` の方になる。

T-E2E-002 だけが status を判別材料にできる (dispatcher が status を使う唯一の場所)。

**この 2 件が覆っていない範囲**。 いずれも同じ経路から到達できる。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| 検証失敗の `ok: false` (7 種の `errorKind`) | できる | 正常な入力だけを送っている |
| `reportOnly: true` の header 名の切替 | できる | `false` だけを送っている |
| `strictDynamic: false` の `headerValue` | できる | `true` だけを送っている |
| `hsts.maxAgeSec: 0` が受理されること | できる | `31536000` だけを送っている |
| 未知の `xFrame` が黙って落ちること | できる | `DENY` だけを送っている |
| 最小入力で `headers: {}` が `validationOk: true` になること | できる | 全項目を送っている |
| `close` を `ingest` なしで呼んだ時の `violation_session_missing` | できる | 順序どおりに送っている |
| `DELETE` / `GET /` の 405 | できる | `GET /csp` だけを送っている |
| body が配列の場合 | できる | object だけを送っている |

到達できない範囲は無い。 ただし **HTTP の口が 3 本でも、各 route の検証分岐は 7 種以上ある**。
口の数と分岐の数は別になる。
