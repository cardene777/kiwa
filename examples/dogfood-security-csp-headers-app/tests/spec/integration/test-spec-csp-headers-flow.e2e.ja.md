# test-spec-csp-headers-flow (e2e-generic layer)

CSP の組み立て / 違反報告 / 安全 header 束の 3 経路を、Chromium の BrowserContext に紐づく
Playwright `APIRequestContext` から順に叩いて確かめる。

画面は描画しない。 `src/lib/next-server.ts` が 3 route を node server に載せ、
Playwright の `page.request` が JSON を投げる。これは `page.context().request` と同じ
API testing helper で、Chromium page 内の `fetch` ではない。

server code が明示的に設定する response header は `content-type: application/json` だけで、組み立てた CSP / HSTS 等は
JSON body の field として返る。Chromium に header を適用した時の強制動作はこの E2E の保証外になる。

実測した実 response header は下の 5 つで、`content-type` 以外は Node が付ける。

```
content-type: application/json
date: ...
connection: keep-alive
keep-alive: timeout=5
content-length: ...
```

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
| **route validator の検証失敗** | **200** | `{ok: false, errorKind: '...'}` |
| **route handler が捕捉した adapter の失敗** | **200** | `{ok: false, kind, ..., errorKind: '...'}` |
| 壊れた JSON | 400 | `{ok: false, errorKind: 'body_parse_failed'}` |
| 未知の path | 404 | `{ok: false, errorKind: 'route_not_found'}` |
| POST 以外の method | 405 | `{ok: false, errorKind: 'method_not_allowed'}` |
| dispatch が応答 object を返さず例外を投げた時 | 500 | `{ok: false, errorKind: 'dispatch_failed'}` |

非 200 を設定するのは dispatcher で、明示された経路は 400 / 404 / 405 / 500 の 4 種になる。
JSON の parse と dispatch が完了し、route validator または route handler が応答 object を返した時は
200 になる。実測で `routeId` を空にしても `kind` を未知の値にしても 200 が返った。

`res.status()` だけを見る client は、route validator が返す検証失敗を成功と読む。

**400 に届くかは `data:` の型で決まり、`content-type` header が効くのは文字列の時だけになる。**

`page.request` の `data:` に文字列を渡し、かつ `content-type: application/json` を明示した時だけ
Playwright が文字列を JSON として符号化するため、server は `"{"` という**正しい JSON** を
受け取って `body_not_object` (200) を返す。 `Buffer` は Playwright が raw のまま送るため、
header の有無に関わらず parse に失敗して 400 になる。

実測した 4 通り。

| 送り方 | 結果 |
|---|---|
| 文字列 + `content-type: application/json` | 200 / `body_not_object` |
| **文字列 + header なし** | **400** / `body_parse_failed` |
| `Buffer` + header あり | **400** / `body_parse_failed` |
| `Buffer` + header なし | **400** / `body_parse_failed` |

条件は送り方で分かれる。

| `data` の型 | 400 に届く条件 |
|---|---|
| 文字列 | **header を明示しない時だけ**。 明示すると Playwright が JSON 符号化して 200 になる |
| `Buffer` | **header に関わらず常に届く**。 Playwright が raw のまま送る |

1 回目の probe が 400 に届かなかったのは、文字列に header を付けていたため。

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

3 つの性質は分けて読む必要がある。`max-age=0` は明示的な HSTS 無効化として header に残る。
一方、未知の `xFrame` は無視されるため未指定と区別できず、空の束も `validationOk: true` になる。

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

- **browser の security header 強制を通らない**。CSP / HSTS 等は JSON body の値として比較するだけで、
  response header、navigation、CORS、Service Worker への適用は検証しない
- **status が domain の成否を表さない**。 route validator の失敗も、handler が捕捉した
  状態不整合も 200。 `res.status()` だけを見る監視はこれらを見逃すため、body の `ok` を読む必要がある
- **`max-age=0` が受理される**。 HSTS を無効化する用途にも使える値なので受理自体は不正ではないが、
  常時 HSTS を強制したい呼出側の方針は `maxAgeSec >= 0` の検査だけでは保証されない
- **未知の `xFrame` が黙って落ちる**。 `ALLOW` のような無効な値を送っても
  `validationOk: true` が返り、header だけが消える
- **空の束が検証を通る**。 `headers: {}` / `applied: []` でも `validationOk: true`。
  `validationOk` だけでは「何も適用しなかった」 と「指定した header を正しく適用した」 を区別できない
- **配列 body が `routeId_required` になる**。 型の誤りが値の欠落として報告されるため、
  呼出側が原因を取り違える
- **`Content-Security-Policy-Report-Only` への切替が `reportOnly` 1 つで決まる**。
  真偽値の取り違えで強制が報告のみに落ちるが、応答は成功のまま

## 推奨テスト構成

`startNextServer({ adapter })` が 3 route を node server に載せ、空き port で listen する。
`makeMockAdapter({ latencyMs: 0 })` を呼出側が作って渡すため、server と adapter の寿命は分けられる。

**この example は bootstrap を持たない。** 3 経路とも HTTP だけで完結する
(同じ構造の mtls / rbac は adapter を直接呼んで session を作る)。

`page.request.post` は BrowserContext と cookie jar を共有するが、browser の navigation / renderer /
同一 origin 制約 / Service Worker は通らない。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | CSP の組み立て | `headerValue` の中身 |
| 2 | 違反の取り込みと締め | `accepted` / `kind` |
| 3 | header 束 | `validationOk` と HSTS / XFO / XCTO (Referrer / Permissions は送信のみ) |
| 4 | dispatcher | 404 / 405 |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-E2E-001 | CSP / 違反 / header 束が 1 つの `APIRequestContext` から連続で通る | mock adapter を載せた server と Chromium BrowserContext に紐づく `page.request` | `/csp` (nonce + hash + strictDynamic + trustedTypes) → `/violation` (ingest) → `/violation` (close) → `/headers` (HSTS + Referrer + Permissions + XFO + XCTO) を順に投げる | CSP は `status===200`、`{ok: true, kind: 'build'}`、`headerValue` が `'strict-dynamic'` と `trusted-types default` を含む。 違反は `status===200` で ingest / close とも `ok: true`。 header 束は `status===200`、`validationOk===true`、`Strict-Transport-Security` が `preload` を含み、`X-Frame-Options==='DENY'`、`X-Content-Type-Options==='nosniff'` | P0 | yes | node | `/csp` `/violation` `/headers` |
| T-E2E-002 | dispatcher が未知 path と誤 method を分ける | 同上 | `POST /missing` と `GET /csp` を投げる | 前者は `status===404`、`errorKind==='route_not_found'`。 後者は `status===405`、`errorKind==='method_not_allowed'` | P1 | yes | node | `/missing` `/csp` |

## 既存 test との対応

- 探索した runtime — `typescript`
- 探索した path — `examples/dogfood-security-csp-headers-app/` 配下の `*.test.ts` / `*.test.tsx` / `*.spec.ts` / `*.spec.tsx` (`node_modules` は除外)。 実在したのは `tests/` と `tests/e2e/` の 2 dir
- 探索した test file — 5 件

| TC | 既存 test の候補 | 判定 |
|---|---|---|
| T-E2E-001 | `T-E2E-001 CSP build + violation ingest + headers bundle end to end` (`examples/dogfood-security-csp-headers-app/tests/e2e/csp-headers-flow.spec.ts:43`) | 既覆 (候補) |
| T-E2E-002 | `T-E2E-002 route dispatcher returns 404 for unknown paths and 405 for GET` (`examples/dogfood-security-csp-headers-app/tests/e2e/csp-headers-flow.spec.ts:138`) | 既覆 (候補) |

## 自動化すべきテスト

既覆 (候補)。

- T-E2E-001 (P0) — `/csp` (nonce + hash + strictDynamic + trustedTypes) → `/violation` (ingest) → `/violation` (close) → `/headers` (HSTS + Referrer + Permissions + XFO + XCTO) を順に投げ、3 経路が 1 つの `APIRequestContext` から連続で通ることを確かめる
- T-E2E-002 (P1) — `POST /missing` と `GET /csp` を投げ、dispatcher が未知 path (404 / `route_not_found`) と誤 method (405 / `method_not_allowed`) を分けることを確かめる

T-E2E-001 は 4 手を 1 件に畳んである。 分けないのは `close` が `ingest` を前提にするため。

**`status===200` の assert だけでは domain の成否を判別できない。** JSON parse や dispatch 自体の
失敗は 400 / 500 になるが、route validator と route handler が返す失敗は 200 なので、
domain の成否を判別しているのは `toMatchObject({ok: true, ...})` の方になる。

T-E2E-002 は dispatcher の 404 / 405 を明示的に区別する。400 / 500 はこの 2 件では通していない。

**この 2 件が覆っていない範囲**。 到達可否は表のとおり。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| route validator が返す各 `ok: false` | できる | 正常な入力だけを送っている |
| `reportOnly: true` の header 名の切替 | できる | `false` だけを送っている |
| `strictDynamic: false` の `headerValue` | できる | `true` だけを送っている |
| `hsts.maxAgeSec: 0` が受理されること | できる | `31536000` だけを送っている |
| 未知の `xFrame` が黙って落ちること | できる | `DENY` だけを送っている |
| 最小入力で `headers: {}` が `validationOk: true` になること | できる | 全項目を送っている |
| `close` を `ingest` なしで呼んだ時の `violation_session_missing` | できる | 順序どおりに送っている |
| 短い nonce と、nonce / hash なしの `strictDynamic` が adapter semantics で拒まれること | できる | 有効な nonce / hash を送っている |
| 不正な `referrerPolicy` が `validationOk: false` になること | できる | 有効な値だけを送っている |
| 任意 field の不正値が黙って落ちる経路 (hash / trustedTypes / verdict / reason 等) | できる | 有効な任意 field だけを送っている |
| 同じ id への再度の build / ingest が handler の start 呼出で session を作り直すこと | できる | 各 id を 1 回だけ開始している |
| `DELETE` / `GET /` の 405 | できる | `GET /csp` だけを送っている |
| body が配列の場合 | できる | object だけを送っている |
| CSP 応答の `headerName` / `nonce` / 適用 flag と nonce / hash / `report-to` の各 directive | できる | `headerValue` の 2 断片と `ok` / `kind` しか assert していない |
| violation 応答の id 群 | できる | `accepted` / `directive` と close の `ok` / `kind` しか assert していない |
| verdict / reason を記録した trace | HTTP からはできない | trace を返す route が無く、adapter の `traces()` を直接読む必要がある |
| `Referrer-Policy` / `Permissions-Policy` と headers 応答の `applied` / `validationErrors` | できる | request には含めるが応答を assert していない |
| 壊れた JSON の 400 | できる | Playwright の `data` で正しい JSON だけを送っている |
| `dispatch_failed` の 500 | 通常入力ではできない | dispatch が例外を投げた時だけの防御経路 |
| `csp_session_missing` / `headers_session_missing` / `violation_session_closed` | HTTP からはできない | handler が各処理の前に session を作り直す |

route validator の分岐は HTTP から到達できる。一方、handler が session を自動作成するため隠れる
adapter の状態分岐と、防御用の 500 は通常の HTTP 入力からは選べない。
**HTTP の口の数と、その下にある route / adapter の分岐の数は別になる。**

## 手動確認でよいテスト

(なし)

## 不足している仕様

- 任意 field に不正な値を渡した時の扱いが決まっていない。 `parseHeadersRequest` は `hsts.maxAgeSec` が不正なら `hsts_maxAgeSec_required` で拒むのに、`xFrame` に `ALLOW` のような無効な値を渡すと黙って落とす。 どちらの形を任意 field の既定にするのか、拒むなら `errorKind` を決める必要がある
