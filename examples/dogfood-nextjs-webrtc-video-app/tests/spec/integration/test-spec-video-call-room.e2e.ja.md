# test-spec-video-call-room (e2e-generic layer)

WebRTC の通話室を、**2 つの BrowserContext から同じ室へ入る**形を含む 3 件で確かめる。

実際の RTCPeerConnection は張らない。 SFU も動かない。 この仕様書が保証するのは、
2 つの browser context が同じ adapter を共有する server の signaling から同じ室へ入り、
別々の 1-context test が room と ice-restart の口をそれぞれ叩いて期待の observation を
返すことになる。

- module: video-call-room
- layer: e2e-generic

## 対象機能

| 経路 | handler | adapter の op |
|---|---|---|
| `/signaling` (`offer` / `answer`) | `createSignalingHandler` | `joinRoom` |
| `/signaling` (`ice-candidate`) | 同上 | (なし。`roomId` / `peerId` を返すだけ) |
| `/signaling` (`ice-restart`) | 同上 | `iceRestart` |
| `/room` (`publish`) | `createRoomHandler` | `publishTrack` |
| `/room` (`unpublish` / `mute` / `unmute` / `select-layer` / `leave`) | 同上 | 対応する op |

**HTTP server は test file 側にある**。 `tests/e2e/video-call-room.spec.ts` の
`bootAdapterServer` が `src/app/*/route.ts` の validator と handler を直接載せる。
他の example (`rsc-streaming` / `server-action`) が `src/lib/next-server.ts` を
持つのと違い、**この HTTP server と route wiring は production の code ではない**。
validator と handler 自体は `src/app/*/route.ts` にある production source を使う。

## 仕様の要約

### server は 2 route と fallback HTML を持つ

`POST /signaling` と `POST /room` の 2 つ。 body が 64 KiB 以下で、空または
parse 可能な JSON なら、それ以外の path と method は **HTML を返す**
(`<!doctype html>...` の空 page)。 404 と 405 を返す分岐は無い。

`page.goto(origin)` が通るのはこの HTML のおかげで、そこから `fetch` を投げる形になる。

### route dispatch 後の status は 3 段に分かれる

| 段 | status | 由来 |
|---|---|---|
| validator が拒む | **400** | `body_not_object` / `invalid_kind` / `missing_room_id` / `missing_peer_id` / `missing_track_id` / `invalid_media` / `invalid_layer` |
| adapter が投げる | **500** | `err.message` をそのまま `errorKind` に入れる |
| handler が成功する | 200 | — |

**adapter の失敗が 500 で分かれている**。 validator の失敗 (400) と混ざらないため、
status だけで由来を区別できる。 他の example (`server-action` / `rsc-streaming`) は
どちらも 400 にするので、ここは設計が違う。

この 3 段より手前で、JSON parse の失敗は **400** (`invalid_json`)、64 KiB を超える
body は **413** (`payload too large`) になる。fallback HTML の status は 200。

### `offer` と `answer` は別の指紋を返す

実測した値 (`seed: 42`)。

| 呼出 | `sdpFingerprint` |
|---|---|
| `offer` (`peerId: 'p1'`) | `sha256:50910c00` |
| `answer` (`peerId: 'p2'`) | `sha256:4012ac00` |

いずれも `sha256:` で始まり、peer ごとに違う。 `seed` を固定すれば同じ値になる。

### 同じ peer が 2 度入ると 500 になる

実測。

```
POST /signaling {"kind":"offer","roomId":"r1","peerId":"p1"}  → 200
POST /signaling {"kind":"offer","roomId":"r1","peerId":"p1"}  → 500
  {"ok":false,"errorKind":"makeMockAdapter.joinRoom: peer p1 already in r1"}
```

**adapter の失敗経路に HTTP から届く**。 `errorKind` は固定 token ではなく英文になる。

### `simulcastLayers` は video かつ `simulcast !== false` の時だけ 3

実測した値。

| 入力 | `simulcastLayers` |
|---|---|
| `media: 'video'` (`simulcast` 省略) | **3** |
| `media: 'video'`、`simulcast: true` | **3** |
| `media: 'video'`、`simulcast: false` | **0** |
| `media: 'audio'` | **0** |

`simulcast` は省略時も明示した `true` でも有効になる。 音声では層を作らない。

**`trackId` は入力の種類ではなく、peer ごとの作成順で決まる**。 `initialMedia` 無しの
同じ peer で publish を続けると `track-0` → `track-1` → `track-2` と進み、別 peer の
1 本目は再び `track-0` になるため、室の中で一意ではない。`initialMedia` があれば、
そこで作った audio / video track も同じ連番を先に消費する。

### `ice-restart` は候補を 3 件集める

実測した値。

| 入力 | `candidatesGathered` | `relayUsed` |
|---|---|---|
| `forceRelay` 省略 | 3 | **false** |
| `forceRelay: true` | 3 | **true** |

`relayUsed` は `forceRelay` を写すだけで、候補の件数は変わらない。

`ice-candidate` は `roomId` と `peerId` しか返さない (`candidatesGathered` も
`sdpFingerprint` も付かない)。

### adapter は test ごとに作り直される

`beforeEach` が `makeMockAdapter({ seed: 42, latencyMs: 0 })` を作り、
`afterEach` が `adapter.reset()` を呼ぶ。 **1 つの test の中では server を
複数立てても同じ adapter を共有する** (T-E2E-001 は 1 server に 2 context を繋ぐ)。

## 主な品質リスク

- **RTCPeerConnection を張らない**。 `page.evaluate` の中で `fetch` を投げるだけで、
  browser の WebRTC stack は 1 度も動かない。 SDP も候補も文字列として観測しているだけ
- **HTTP server と route wiring が test file にある**。 `bootAdapterServer` は production の
  code ではないため、route の並べ方も status の割り当ても実運用では別物になりうる
- **未知 path が HTML を返す**。body の parse / size check を通る限り 404 も 405 も無いので、
  path を打ち間違えた client は JSON を期待して HTML を受け取る
- **`trackId` が室の中で一意でない**。 peer ごとの連番なので、別 peer の 1 本目は
  どちらも `track-0` になる。 室単位で track を引く consumer は衝突する
- **`relayUsed` が入力を写すだけ**。 実際に relay を経由したかではなく
  `forceRelay` の値なので、「relay になった」 の証拠として使うと外れる
- **`errorKind` に固定 token と自由文が混ざる**。 JSON parser / validator の失敗は
  `invalid_json` / `missing_room_id` のような固定 token だが、adapter が投げた失敗は
  英文になる。 status (400 / 500) で分かれてはいるが、`errorKind` の型としては 1 つ
- **`candidatesGathered` が常に 3**。 入力で変えられないため、候補の増減を扱う経路が
  この e2e から通らない

## 推奨テスト構成

`beforeEach` で `makeMockAdapter({ seed: 42, latencyMs: 0 })` を作る。
`bootAdapterServer(adapter)` が port 0 で listen し、`chromium.launch()` →
`browser.newContext()` → `page.goto(origin)` の後に `page.evaluate` の中で `fetch` を投げる。
T-E2E-001 だけは `browser.newContext()` を 2 つ作り、残り 2 件は 1 つだけ作る。

**`page.goto(origin)` は必須**。 `about:blank` の null origin から
`content-type: application/json` の `fetch` を投げると CORS の事前確認で落ちる
(server は `Access-Control-*` も `OPTIONS` も持たない)。

**同じ peerId で 2 度 `offer` を投げない**。 2 度目は 500 になる。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | 2 つの context が同じ室に入る | `sdpFingerprint` が peer ごとに違う |
| 2 | 映像の publish が層を作る | `simulcastLayers` |
| 3 | ice-restart が候補を集め直す | `candidatesGathered` / `relayUsed` |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-E2E-001 | 2 つの context が同じ室に入り、別々の指紋を受け取る | `seed: 42` / `latencyMs: 0` の mock adapter を載せた server と、その origin に置いた 2 つの `BrowserContext` | `pageA` から `offer` (`peerId: 'peer-a'`)、`pageB` から `answer` (`peerId: 'peer-b'`) を投げる | 両方 `ok===true`。 どちらの `sdpFingerprint` も `/^sha256:/` に一致し、**互いに異なる** | P0 | yes | node | `/signaling` |
| T-E2E-002 | 映像の publish が 3 層を返す | `seed: 42` / `latencyMs: 0` の mock adapter を載せた server と、その origin に置いた 1 つの `BrowserContext` | `offer` で室に入ってから `/room` へ `publish` (`media: 'video'`) を投げる | `ok===true`、`simulcastLayers===3` | P0 | yes | node | `/signaling` `/room` |
| T-E2E-003 | ice-restart が候補を集め直す | `seed: 42` / `latencyMs: 0` の mock adapter を載せた server と、その origin に置いた 1 つの `BrowserContext` | `offer` で室に入ってから `ice-restart` (`forceRelay: true`) を投げる | `ok===true`、`candidatesGathered>0`、`relayUsed===true` | P0 | yes | node | `/signaling` |

## 既存 test との対応

- 探索した runtime — `typescript`
- 探索した path — `examples/dogfood-nextjs-webrtc-video-app/` 配下の `*.test.ts` / `*.test.tsx` / `*.spec.ts` / `*.spec.tsx` (`node_modules` / `.next` / `.turbo` / `dist` / `.vitest-dist` は除外)。 実在したのは `tests/` と `tests/e2e/` の 2 dir
- 探索した test file — 5 件

| TC | 既存 test の候補 | 判定 |
|---|---|---|
| T-E2E-001 | `T-E2E-001 two BrowserContext tabs join the same room and see distinct SDP fingerprints` (`examples/dogfood-nextjs-webrtc-video-app/tests/e2e/video-call-room.spec.ts:158`) | 既覆 (候補) |
| T-E2E-002 | `T-E2E-002 video publish through the room handler returns 3 simulcast layers over HTTP` (`examples/dogfood-nextjs-webrtc-video-app/tests/e2e/video-call-room.spec.ts:209`) | 既覆 (候補) |
| T-E2E-003 | `T-E2E-003 ice-restart mid-call recovers with a fresh candidate batch through HTTP` (`examples/dogfood-nextjs-webrtc-video-app/tests/e2e/video-call-room.spec.ts:248`) | 既覆 (候補) |

## 自動化すべきテスト

既覆 (候補)。

- T-E2E-001 (P0) — 2 つの `BrowserContext` から `offer` と `answer` を投げ、指紋が peer ごとに違うことを確かめる
- T-E2E-002 (P0) — 室に入ってから映像を publish し、3 層になることを確かめる
- T-E2E-003 (P0) — 室に入ってから `ice-restart` を投げ、候補数と `relayUsed: true` が返ることを確かめる

**3 件とも server を作り直す**。 `beforeEach` が adapter を作り直し、
`afterEach` が `reset()` を呼ぶため、test 間で室の状態を引き継がない。

**T-E2E-001 だけが 2 context を使う**。 残り 2 件は 1 context で足りる。

**この 3 件が覆っていない範囲**。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| `sdpFingerprint` の具体値 | できる | 前方一致と相異でしか見ていない |
| `simulcast: true` の 3 層 / `simulcast: false` / `media: 'audio'` の 0 層 | できる | 映像かつ省略した形だけを送っている |
| `trackId` の連番と peer 間の衝突 | できる | 応答に含まれるが assert していない |
| `forceRelay` 省略時の `relayUsed: false` | できる | `true` だけを送っている |
| `candidatesGathered` の具体値 (3) | できる | `>0` の範囲でしか見ていない |
| `unpublish` / `mute` / `unmute` / `select-layer` / `leave` | できる | 投げていない |
| 同じ peer が 2 度入った時の 500 | できる | 1 度しか入っていない |
| validator の 400 (7 種) | できる | 妥当な body だけを送っている |
| parse できない JSON の 400 / 64 KiB 超の 413 | できる | 小さい正しい JSON だけを送っている |
| 未知 path と誤 method が HTML を返すこと | できる | 2 route の正しい method だけを叩いている |
| `publishTrack` の `no_track_produced` guard | **できない** | validator を通る `audio` / `video` は `getUserMedia` が必ず 1 track を作る |

同じ peer で 2 度 `offer` すれば adapter が投げる 500 自体には到達できる。一方、現在の
mock と validator の組では `publishTrack` の `no_track_produced` guard だけは HTTP 入力から
到達できず、adapter または semantics helper を差し替えない限り作れない。

## 手動確認でよいテスト

(なし)

## 不足している仕様

- 応答の `errorKind` を安定した token として扱えるかが決まっていない。validator と
  JSON parser は固定 token を返す一方、adapter の失敗は `err.message` の英文を返すため、
  consumer が分岐に使える契約なのか、表示専用なのかが source に書かれていない
