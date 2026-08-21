# test-spec-stream-room (e2e-generic layer)

WebTransport の stream 室を、**2 つのタブが別々の `sessionId` を送る**形で確かめる。

実際の WebTransport 接続は張らない。 test file 内の server が mock adapter を
JSON の口として載せ、browser の `fetch` がそこを叩く。 この仕様書が保証するのは
**2 つの browser context が別々の `sessionId` を送って両方を開き、それぞれの ID で
後続 op が通る**ことになる。 session と context を cookie などで結び付けてはいない。

- module: stream-room
- layer: e2e-generic

## 対象機能

| 経路 | `kind` | adapter の op |
|---|---|---|
| `/api/stream` | `open-session` / `close-session` | `openSession` / `closeSession` |
| `/api/stream` | `open-uni-stream` / `open-bi-stream` | `openUniStream` / `openBiStream` |
| `/api/stream` | `write-stream` / `read-stream` | `writeStream` / `readStream` |
| `/api/stream` | `send-datagram` | `sendDatagram` |
| `/api/reset` | `reset-stream` / `migrate-connection` | `resetStream` / `migrateConnection` |

op 名は `src/adapters/interface.ts` の宣言をそのまま写した。
`validate` は kind ではなく、`migrate-connection` の optional boolean field。

**HTTP server は test file 内にある**。 `tests/e2e/stream-room.spec.ts` の
`bootAdapterServer` が `server/api/stream.post.ts` と `server/api/reset.post.ts` の
validator と handler を直接載せる。 **production の Nuxt route ではない**。

## 仕様の要約

### 既知の POST route の失敗処理は 4 段に分かれる

| 段 | status | `errorKind` |
|---|---|---|
| body が上限を超える | **413** | (本文は `payload too large` の平文) |
| body を JSON として読めない | **400** | `invalid_json` |
| validator が拒む | **400** | `body_not_object` / `unknown_kind` / `missing_session_id` / `missing_stream_id` / `missing_url` / `missing_data` / `missing_error_code` |
| adapter が投げる | **500** | `err.message` (現在の mock adapter では英文) |

上の 4 段では 413 だけ **JSON ではなく平文**を返す。 他の 3 段は
`{"ok": false, "errorKind": ...}`。 route / method が一致しない時の 404 も
`not found` の平文だが、上の 4 段には含めない。

### `errorKind` は 3 種類の由来を混ぜる

`invalid_json` と validator の 7 token は固定だが、現在の mock adapter が投げた失敗は
`makeMockAdapter.openSession: session tab-a is already open` のような英文になる。

### 同じ session を 2 度開くと 500

実測。

```
{"kind":"open-session","sessionId":"tab-a","url":"https://origin.example/wt"}  → 200
{"kind":"open-session","sessionId":"tab-a","url":"https://origin.example/wt"}  → 500
  makeMockAdapter.openSession: session tab-a is already open
```

開いていない session への `open-uni-stream` / `open-bi-stream` / `write-stream` /
`read-stream` / `send-datagram` / `reset-stream` / `migrate-connection` は 500 になる
(`makeMockAdapter.openUniStream: session nope is not open`)。 `close-session` だけは例外で、
mock adapter の `closeSession` が未存在 session を return するため 200 / `ok: true` になる。

### stream id は session 内で種別ごとの連番

同じ session 内の実測では uni は `uni-0` → `uni-1`、bi は `bi-0` → `bi-1` →
`bi-2` → `bi-3` と進む。 **種別ごとに別の採番**だが、各 session が独立した uni / bi
mock を持つため、別 session ではそれぞれ `uni-0` / `bi-0` から始まる。

### `backpressure` は書込前の window と比べる

**実装の該当行** (`src/adapters/mock.ts:270`) が
`if (input.data.byteLength > beforeRemaining)` で決める。 `beforeRemaining` は
**書込前**の `windowRemaining`。

同じ doc comment が「**the underlying mock refills the window after sleep**」 と書いており、
実際の補充規則は `packages/realtime/src/semantics/webtransport-bi.ts:104` から始まる。
書込前の残量を R、初期 window size を W、書込 byte 数を L とすると、

- L > R なら W まで補充してから書き、書込後は `W - L`
- L <= R なら補充せず、書込後は `R - L`

となる。 判定は strict な `>` なので L = R では補充しない。

`windowSize: 8` の bi-stream に 4 回書いた実測。

| 書込 | `windowRemaining` | `backpressure` |
|---|---|---|
| (open) | 8 | — |
| 32 byte | **-24** | true (32 > 8) |
| 8 byte | **0** | true (8 > -24) |
| 4 byte | **4** | true (4 > 0) |
| 4 byte | **0** | **false** (4 > 4 が偽) |

4 件とも `byteLength > 書込前の windowRemaining` で `backpressure` が決まる。
書込**後**の `windowRemaining` は、真なら `windowSize - byteLength`、偽なら
`書込前の windowRemaining - byteLength` になる。

### mock adapter の uni-stream は window を持たない

`writeStream` の分岐が bi の時だけ `windowRemaining` を読む。 uni では
`backpressure: false` / `windowRemaining: 0` に固定され、**100 byte 書いても変わらない** (実測)。

`open-uni-stream` の応答にも `windowRemaining` が付かない。

### `metrics()` は 12 個の counter と 4 種の latency 標本を持つ

op 別の 11 counter に全 op の呼出回数を数える `requests` が加わる。
latency 標本は open-session / open-stream / write / migration の 4 配列。

実測で 2 session / uni 1 / bi 1 / 書込 3 回 / migrate 1 回を回すと
`sessionsOpened: 2` / `uniStreamsOpened: 1` / `biStreamsOpened: 1` / `writesTotal: 3` /
`migrations: 1` / `backpressureEvents: 2` になった。

`backpressureEvents` は `backpressure` が真になった書込の回数を数える。

## 主な品質リスク

- **WebTransport を張らない**。 browser の `fetch` で JSON を投げるだけで、
  QUIC も stream も 1 度も動かない。 2 つのタブと session の対応も server が管理せず、
  request body の `sessionId` が違うだけになる
- **HTTP 層が test file にある**。 `bootAdapterServer` は production の Nuxt route ではないため、
  route の並べ方も status の割り当ても実運用では別物になりうる
- **既知の POST route の 4 段では 413 だけ平文を返す**。 他の段が JSON なので、
  `errorKind` を読む client は上限超過だけ parse に失敗する
- **`errorKind` が 3 種類の由来を混ぜる**。 validator は固定 token だが、
  現在の mock adapter は英文を投げる
- **`windowRemaining` は常に直前値から引くわけではない**。 backpressure が真なら
  `windowSize` へ補充してから引くため、consumer は 2 分岐の規則を扱う必要がある
- **uni-stream の `windowRemaining: 0` が「残量なし」 に見える**。 実際は
  window を持たないだけで、いくら書いても `backpressure` は立たない

## 推奨テスト構成

`bootAdapterServer(adapter)` が port 0 で listen する。 `chromium.launch()` →
`browser.newContext()` を 2 つ作り、**`page.goto(origin)` してから** `page.evaluate` の
中で `fetch` を投げる。

`about:blank` の null origin から投げると preflight が要り、この server は CORS も
`OPTIONS` も持たないため落ちる (test file の comment が実測付きで記録している)。

**同じ `sessionId` を 2 度開かない**。 2 度目は 500 になる。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | 2 つのタブが別々の `sessionId` を送る | `open-session` が両方 `ok` |
| 2 | uni-stream の採番 | `streamId` が `uni-` で始まる |
| 3 | 書込の byte 数 | `byteLength` |
| 4 | bi-stream の backpressure | `backpressure` |
| 5 | 接続の移行 | `validated` |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-E2E-001 | 2 つのタブが別々の `sessionId` を送り、uni / bi の書込と移行が同じ test server と adapter を通る | `seed: 42` / `latencyMs: 1` の mock adapter を載せた server と、その origin に置いた 2 つの `BrowserContext` | tab A が `open-session` (`tab-a`)、tab B が `open-session` (`tab-b`)。 A が `open-uni-stream` → `write-stream` (9 byte)。 B が `open-bi-stream` (`windowSize: 8`) → `write-stream` (32 byte)。 A が `/api/reset` へ `migrate-connection` | 両方の `open-session` が `ok===true`。 uni の `streamId` が `/^uni-/` に一致。 9 byte の書込が `byteLength===9`。 32 byte の書込が `backpressure===true`。 移行が `validated===true` | P0 | yes | node | `/api/stream` `/api/reset` |

## 既存 test との対応

- 探索した runtime — `typescript`
- 探索した path — `examples/dogfood-nuxt-webtransport-stream-app/` 配下の `*.test.ts` / `*.test.tsx` / `*.spec.ts` / `*.spec.tsx` (`node_modules` / `.next` / `.turbo` / `dist` / `.vitest-dist` は除外)。 実在したのは `tests/` と `tests/e2e/` の 2 dir
- 探索した test file — 5 件

| TC | 既存 test の候補 | 判定 |
|---|---|---|
| T-E2E-001 | `T-E2E-001 two tabs open distinct sessions + write uni + write bi + migrate through the same handlers` (`examples/dogfood-nuxt-webtransport-stream-app/tests/e2e/stream-room.spec.ts:138`) | 既覆 (候補) |

**この test は `withPlaywrightSkip` wrapper 経由で定義される**。 `test(name, ...)` に
名前を渡す形なので、`test('T-E2E-...` の直書きを探す走査では見つからない
(#2111 が同じ形の走査漏れを記録している)。 対応表が指す 138 行は wrapper へ渡す
**名前の行**になる。

## 自動化すべきテスト

既覆 (候補)。

- T-E2E-001 (P0) — 2 つのタブが別々の `sessionId` を送り、uni の書込 /
  bi の backpressure / 接続の移行が同じ test server と adapter を通ることを確かめる happy path

**2 context を使うのはこの 1 件だけ**。 送信元と `sessionId` を分けることが主題なので畳めない。

**この 1 件が覆っていない範囲**。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| `backpressure` が偽になる bi 書込 | できる | 窓を超える書込だけを送っている |
| `windowRemaining` の値と補充 | できる | 応答に含まれるが assert していない |
| uni-stream が window を持たないこと | できる | uni では `backpressure` を読んでいない |
| bi の `streamId` の形 | できる | uni だけ `/^uni-/` を見ている |
| `read-stream` / `send-datagram` / `close-session` / `reset-stream` / `migrate-connection` の `validate: false` | できる | 投げていない |
| 同じ session を 2 度開いた時の 500 | できる | 1 度ずつしか開いていない |
| validator の 7 token | できる | 妥当な body だけを送っている |
| `invalid_json` の 400 / 上限超過の 413 | できる | 壊れた body も巨大な body も送っていない |
| `metrics()` の値 | できる | 読んでいない |

**到達できないものは無い**。 adapter は `bootAdapterServer(adapter)` に渡す形なので、
差し替えれば adapter 側の分岐も作れる。

## 手動確認でよいテスト

(なし)

## 不足している仕様

- 上限超過の応答形式が他の段と揃っていない。 413 だけ平文
  (`payload too large`) を返し、他の 3 段は `{"ok": false, "errorKind": ...}` の JSON。
  上限超過も JSON にするのかが source に書かれていない
- 応答の `errorKind` を安定した token として扱えるかが決まっていない。
  `invalid_json` と validator の 7 token は固定だが、現在の mock adapter の失敗は
  `err.message` の英文を返すため、consumer が分岐に使える契約なのか表示専用なのかが
  書かれていない
