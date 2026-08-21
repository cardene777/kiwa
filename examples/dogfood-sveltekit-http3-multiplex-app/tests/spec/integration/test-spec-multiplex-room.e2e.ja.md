# test-spec-multiplex-room (e2e-generic layer)

HTTP/3 の多重化室を、**2 つのタブが別々の接続 id を送る**形で確かめる。

実際の QUIC 接続は張らない。 test file 内の server が mock adapter を JSON の口として
載せ、browser の `fetch` がそこを叩く。 **browser の context と接続を結び付ける仕組みは
無い**ので、この仕様書が保証するのは各 context が別の `connectionId` を送って
後続の操作が通ることになる。

- module: multiplex-room
- layer: e2e-generic

## 対象機能

| 経路 | `kind` | adapter の op |
|---|---|---|
| `/api/multi-stream` | `open-connection` / `close-connection` | `openConnection` / `closeConnection` |
| `/api/multi-stream` | `open-stream` / `concurrent-send` | `openStream` / `concurrentSend` |
| `/api/multi-stream` | `write-stream` / `read-stream` / `close-stream` | `writeStream` / `readStream` / `closeStream` |
| `/api/0-rtt` | `resume-zero-rtt` | `resumeZeroRtt` |
| `/api/hpack` | `insert-header` | `insertHpackHeader` |

op 名は `src/adapters/interface.ts` の宣言をそのまま写した。

**HTTP server は test file 内にある**。 `tests/e2e/multiplex-room.spec.ts` の
`bootAdapterServer` が `src/routes/api/*/handler.ts` の validator と handler を
**3 つ別々に**載せる。 production の SvelteKit route ではない。

## 仕様の要約

### 失敗応答の status は 5 段に分かれる

| 段 | status | 本文 |
|---|---|---|
| body が上限を超える | **413** | `payload too large` の**平文** |
| body を JSON として読めない | 400 | `{"ok":false,"errorKind":"invalid_json"}` |
| validator が拒む | 400 | 12 種の固定 token |
| adapter が投げる | 500 | `err.message` の英文 |
| 3 route のどれでもない | **404** | `not found` の**平文** |

成功時は `statusCode` を代入せず、Node HTTP server の既定 **200** を返す。
失敗時は **413 と 404 が平文**で、他の 3 段は JSON。 `errorKind` を読む client は
この 2 段だけ parse に失敗する。

### `errorKind` は 3 種類の由来を混ぜる

`invalid_json` と validator の 12 token (`body_not_object` / `unknown_kind` /
`missing_connection_id` / `missing_url` / `missing_streams` / `missing_stream_id` /
`missing_data` / `missing_early_data_bytes` / `missing_header_name` /
`missing_header_value` / `invalid_priority` / `invalid_stream_entry`) は固定だが、
adapter が投げた失敗は
`makeMockAdapter.openConnection: connection tab-a is already open` のような英文になる。

英文になるのは**現在の mock adapter が `Error` を投げるため**で、adapter を
差し替えれば変わる。

### `zeroRttUsed` は origin ごとの ticket を含む 3 条件で決まる

**実装の該当行** (`src/adapters/mock.ts:214`)。

```ts
conn.zeroRttUsed = wantZeroRtt && allowZeroRtt && hasTicketForOrigin;
```

3 つの積になる。

| 項 | 由来 |
|---|---|
| `wantZeroRtt` | 入力の `zeroRtt === true` |
| `allowZeroRtt` | adapter の option (既定 `true`) |
| `hasTicketForOrigin` | **origin ごとの ticket Set** に origin があるか |

実測。

| 呼出 | `zeroRtt` | `zeroRttUsed` |
|---|---|---|
| 1 本目 (`tab-a`) | 省略 | false |
| 2 本目 (`tab-b`) | `true` | **true** |
| 3 本目 (`tab-c`) | 省略 | **false** |

**接続の通し番号では決まらない**。 3 本目でも `zeroRtt` を渡さなければ偽になる。
comment が「A fresh origin always cold-starts even if other origins have prior tickets」
と書いており、ticket の有無は origin 単位で判定する。
既存 test の `multiplex-room.spec.ts:202` は「`seq > 1`」と説明しているが、
現在の実装と一致しない。assertion が通るのは、1 本目が同じ origin の ticket を発行し、
2 本目が `zeroRtt: true` を渡すためになる。

`openConnection` の `earlyDataAccepted` は `zeroRttUsed` が偽なら 0、真なら
`Math.min(requested, 16384)`。 mock が置く nginx-quic 相当の上限は 16 KB。

### `drainOrder` は優先度の昇順

**実装の該当行**。 adapter (`src/adapters/mock.ts:347`) が
`conn.mock.getActiveStreams()` の並びを使い、その `getActiveStreams` は
`packages/realtime/src/semantics/quic-multiplex.ts:166` で

```ts
Array.from(activeStreams.values()).sort((a, b) => a.priority - b.priority)
```

と定義されている。 **数値が小さいほど先**。 `Array.prototype.sort` は安定なので、
同じ優先度は `Map` の挿入順 (= 入力順) を保つ。

実測。

| 入力の優先度 | `streamIds` | `drainOrder` |
|---|---|---|
| `[200, 20, 100]` | `[qs-0, qs-1, qs-2]` (入力順) | **`[qs-1, qs-2, qs-0]`** (20 → 100 → 200) |
| `[50, 50]` | `[qs-0, qs-1]` | **`[qs-0, qs-1]`** (同値は入力順) |

`totalBytes` は入力の `byteLength` の総和 (実装は `for` で足す)。
実測で `8 + 32 + 16 = 56`。

### HPACK の `index` と `tableSize` は同じ接続内の挿入ごとに進む

同じ接続へ 2 回挿入すると `index` が 0 → 1、`tableSize` が 1 → 2 になる。
接続ごとに別の QUIC mock を持つため、別の接続では 0 / 1 から始まる。
現在の mock の `tableSize` は `hpackTable.length` なので entry 数だが、
`src/adapters/interface.ts:98` は byte 数と宣言している。

`compressionRatio` は `conn.hpackRawBytes / conn.hpackCompressedBytes`
(`mock.ts:505`)。各挿入の raw byte と丸め後の compressed byte を累積するため、
header の長さによって値は変わりうる。

### 同じ接続を 2 度開くと 500

実測で `makeMockAdapter.openConnection: connection tab-a is already open`。
開いていない接続への `concurrent-send` も 500
(`makeMockAdapter.concurrentSend: connection nope is not open`)。

## 主な品質リスク

- **実 QUIC を張らない**。 browser は `fetch` で JSON を投げ、mock 内では stream の
  作成と優先度 sort が動くが、network 上の多重化や優先度制御は動かない。
  「2 つのタブが別々の接続を持つ」ことも server 側の `connectionId` で区別しているだけになる
- **context と接続を結び付ける仕組みが無い**。 同じ context から 2 つの
  `connectionId` を送っても通る
- **HTTP 層が test file にある**。 production の SvelteKit route ではないため、
  route の並べ方も status の割り当ても実運用では別物になりうる
- **413 と 404 が平文**。 他の 3 段が JSON なので、`errorKind` を読む client は
  この 2 段だけ parse に失敗する
- **`errorKind` が 3 種類の由来を混ぜる**。 validator は固定 token だが adapter は英文
- **`compressionRatio` の値を確かめていない**。 既存 test は数値型だけを見ており、
  header の長さに応じて変わる値や、圧縮の効きを検証していない

## 推奨テスト構成

`bootAdapterServer(adapter)` が port 0 で listen する。 `chromium.launch()` →
`browser.newContext()` を 2 つ作り、**`page.goto(origin)` してから** `page.evaluate` の
中で `fetch` を投げる。

`about:blank` の null origin から投げると preflight が要り、この server は CORS も
`OPTIONS` も持たないため落ちる。

**0-RTT を見るには同じ origin へ 2 本目を開く**。 1 本目が ticket を発行するため、
2 本目以降で `zeroRtt: true` を渡すと `zeroRttUsed` が真になる。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | 2 つのタブが別々の接続 id で通る | `open-connection` が両方 `ok` |
| 2 | 2 本目が 0-RTT を使う | `zeroRttUsed` / `earlyDataAccepted` |
| 3 | 優先度の昇順で drain する | `drainOrder` |
| 4 | 送信量を足す | `totalBytes` |
| 5 | 0-RTT の再開 | `accepted` / `earlyDataAccepted` |
| 6 | HPACK の挿入 | `index` / `tableSize` / `compressionRatio` |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-E2E-001 | 2 つのタブが別々の接続 id を送り、多重化 / 0-RTT / HPACK が同じ test server と adapter を通る | `seed: 42` / `latencyMs: 1` の mock adapter を載せた server と、その origin に置いた 2 つの `BrowserContext` | tab A が `open-connection` (`tab-a`)、tab B が `open-connection` (`tab-b`、`zeroRtt: true`、`earlyDataBytes: 4096`)。 A が `concurrent-send` (優先度 200 / 20 / 100、byte 8 / 32 / 16)。 B が `/api/0-rtt` へ `resume-zero-rtt` (`earlyDataBytes: 8192`)。 A が `/api/hpack` へ `insert-header` | 両方の `open-connection` が `ok===true`。 B は `zeroRttUsed===true`、`earlyDataAccepted===4096`。 `streamIds` と `drainOrder` が 3 件で `totalBytes===56`、`drainOrder[0]` が `streamIds[1]` (優先度 20 の位置)。 再開は `accepted===true`、`earlyDataAccepted===8192`。 HPACK は `index===0`、`tableSize===1`、`compressionRatio` が数値 | P0 | yes | node | `/api/multi-stream` `/api/0-rtt` `/api/hpack` |

## 既存 test との対応

- 探索した runtime — `typescript`
- 探索した path — `examples/dogfood-sveltekit-http3-multiplex-app/` 配下の `*.test.ts` / `*.test.tsx` / `*.spec.ts` / `*.spec.tsx` (`node_modules` / `.next` / `.turbo` / `dist` / `.vitest-dist` は除外)。 実在したのは `tests/` と `tests/e2e/` の 2 dir
- 探索した test file — 5 件

| TC | 既存 test の候補 | 判定 |
|---|---|---|
| T-E2E-001 | `T-E2E-001 two tabs open distinct connections + concurrent send + 0-RTT resume + HPACK insert through the same handlers` (`examples/dogfood-sveltekit-http3-multiplex-app/tests/e2e/multiplex-room.spec.ts:153`) | 既覆 (候補) |

**この test は `withPlaywrightSkip` wrapper 経由で定義される**。 `test(name, ...)` に
名前を渡す形なので、直書きの test 定義を探す走査では見つからない
(#2111 が同じ形の走査漏れを記録している)。 対応表が指す 153 行は wrapper へ渡す
**名前の行**になる。

## 自動化すべきテスト

既覆 (候補)。

- T-E2E-001 (P0) — 2 つのタブが別々の接続 id を送り、多重化 / 0-RTT / HPACK が
  同じ test server と adapter を通ることを確かめる happy path

**2 context を使うのはこの 1 件だけ**。 接続 id を分けることが主題なので畳めない。

**この 1 件が覆っていない範囲**。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| `zeroRttUsed` が偽になる 3 本目 | できる | 2 本目までしか開いていない |
| `allowZeroRtt: false` / ticket の無い別 origin での `zeroRttUsed` | できる | 3 条件のうち option と origin の偽分岐を作っていない |
| `openConnection` の 16384 上限 / `resumeZeroRtt` の上限超過拒否 | できる | 4096 と 8192 だけを送っている |
| `drainOrder` の 2、3 番目 | できる | 長さと `[0]` だけを見ている |
| `drainOrder` の同値の並び | できる | 相異なる優先度だけを送っている |
| `compressionRatio` の値 | できる | `typeof` が数値かだけを見ている |
| 2 回目以降の HPACK 挿入 | できる | 1 回しか挿入していない |
| `open-stream` / `write-stream` / `read-stream` / `close-stream` / `close-connection` | できる | 投げていない |
| 同じ接続を 2 度開いた時の 500 | できる | 1 度ずつしか開いていない |
| validator の 12 token | できる | 妥当な body だけを送っている |
| 成功時の 200 | できる | `postJson` が返す `status` を見ていない |
| `invalid_json` の 400 / 上限超過の 413 / 未知 path の 404 | できる | 投げていない |
| `metrics()` の値 | できる | 読んでいない |

**到達できないものは無い**。 adapter は `bootAdapterServer(adapter)` に渡す形なので、
差し替えれば adapter 側の分岐も作れる。

## 手動確認でよいテスト

(なし)

## 不足している仕様

- 失敗の応答形式が段によって揃っていない。 413 と 404 は平文
  (`payload too large` / `not found`) を返し、他の 3 段は
  `{"ok": false, "errorKind": ...}` の JSON。 全段を JSON にするのかが source に
  書かれていない
- 応答の `errorKind` を安定した token として扱えるかが決まっていない。
  `invalid_json` と validator の 12 token は固定だが、adapter の失敗は
  `err.message` を返すため、consumer が分岐に使える契約なのか表示専用なのかが
  書かれていない
- `tableSize` の単位が揃っていない。`src/adapters/interface.ts:98` は byte 数と宣言するが、
  mock の `packages/realtime/src/semantics/quic-multiplex.ts:136` は entry 数を返す。
  HTTP 応答でどちらを契約にするかが source から決まらない
