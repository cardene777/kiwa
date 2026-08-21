# test-spec-v1-legacy-flow (e2e-generic layer)

outbox への書込 → CDC による取り出し → 複製の状態、という v1 の 3 経路を
**同じ adapter に順に投げて**確かめる。

UI は無い。 `tests/e2e/fixture.ts` が mock adapter を JSON の口として node server に載せ、
browser の `fetch` がそこを叩く。 `page.goto(origin)` で同じ origin に置いてから投げる。

- module: v1-legacy-flow
- layer: e2e-generic

## 対象機能

| 経路 | adapter の op | 実体 |
|---|---|---|
| `/outbox` | `driveOutbox` | `src/outbox/index.ts` → `@kiwa-lab/orm` |
| `/cdc-pickup` | `driveCdcPickup` | `src/cdc/index.ts` + `src/consumer/index.ts` |
| `/replication` | `driveReplication` | `src/flows/postgres-flows.ts` |

## 仕様の要約

### outbox と CDC が状態を共有する

**この仕様書で最も重要な性質。** `/cdc-pickup` は自分が受け取った注文だけを見るのではない。

```
pickupSince(outbox.outbox(), consumer.state().ackedLsn)
```

**まだ ack していない outbox の行をすべて復号する。** 直前の `/outbox` が書いた行も含む。
ここで filter に使うのは consumer 側の `ackedLsn`。 pickup 後に 1 件以上 deliver できた時だけ、
その値を `outbox.acknowledgeUpTo()` に渡して outbox 側の `confirmedLsn` も進める。

実測した推移。

| 呼出 | 入力 | `decodedCount` |
|---|---|---|
| `/outbox` | 注文 2 件 | — (`writes: 2`) |
| `/cdc-pickup` | 注文 1 件 | **3** (前段の 2 件 + 自分の 1 件) |
| `/cdc-pickup` | 注文 1 件 | **1** (前段は ack 済) |
| `/cdc-pickup` | 注文なし | 0 |

`decodedCount` を「投げた注文の数」 と読むと合わない。

### outbox の観測値

| 項目 | 意味 |
|---|---|
| `writes` | **この呼出で渡した注文の数**。 累積ではない |
| `highWaterLsn` | adapter が起動してからの累積書込数 |
| `ackedLsn` | outbox 側の確定位置。 `/cdc-pickup` が deliver して同期するまで 0 |
| `sealed` | session の状態が `ordered` か `delivered` なら真 |

**既に outbox 行がある adapter へ注文 0 件で再度投げても `sealed` は真**。 実測で空配列と
既定 (未指定) のどちらも `writes: 0` / `sealed: true` を返し、`highWaterLsn` は直前の値のまま
動かなかった。 fresh adapter の最初の呼出が 0 件なら `seal()` が空 outbox を拒否し、HTTP は 500 を返す。

まっさらな server で実測した推移。

| 呼出 | 入力 | 結果 |
|---|---|---|
| 1 回目 | 注文 0 件 | **500** `{"errorKind":"seal: outbox is empty, nothing to seal"}` |
| 2 回目 | 注文 2 件 | 200 / `writes: 2` / `sealed: true` |
| 3 回目 | 注文 0 件 | 200 / `writes: 0` / `sealed: true` |

**同じ入力が 1 回目と 3 回目で違う結果になる。** 差は「outbox に行があるか」 だけ。

### reset 後を含む session ごとの最初の複製は promoted で終わる

`/replication` は入力を取らない。 実測した値。

| 項目 | 値 |
|---|---|
| `primaryLsn` | 384 |
| `replicaLag` | 284 |
| `failoverState` | **`promoted`** |
| `promotedReplicaId` | `replica-b` |

`failoverState` は `streaming` / `lagged` / `failover-in-progress` / `promoted` の 4 値を持つが、
**reset 後を含む新しい replication session で最初の `/replication` 成功呼出は `promoted` を返す**。
他の 3 状態は HTTP 応答として観測できない。 `promoted` は terminal state なので、同じ server で
`/reset` を挟まず `/replication` を再度呼ぶと最初の `primaryWrite()` が拒否し、HTTP は 500 を返す。

実測した推移。

| 呼出 | 結果 |
|---|---|
| 1 回目 | 200 / `failoverState: 'promoted'` |
| 2 回目 | **500** `{"errorKind":"primaryWrite: session is promoted (terminal), primary was demoted"}` |
| 3 回目 | 500 (同じ) |

**`/replication` は `/reset` を挟まない連続呼出では最初の 1 度しか成功しない。** `/reset` は
`replicationSession` を破棄するため、その後の最初の呼出は再び成功する。

### `/reset` は adapter を初期状態へ戻す

上の 2 つの状態依存は、どちらも `/reset` で元に戻る。 実測した推移。

| 呼出 | 結果 |
|---|---|
| `/replication` 1 回目 | 200 / `promoted` |
| `/replication` 2 回目 | 500 (terminal) |
| `/reset` | 200 |
| `/replication` 3 回目 | **200 / `promoted`** (1 回目と同じ値) |
| `/outbox` 注文 2 件 | 200 / `writes: 2` |
| `/reset` | 200 |
| `/outbox` 注文 0 件 | **500** `seal: outbox is empty, nothing to seal` |

**`/reset` の後は「まっさらな server」 と同じ振る舞いに戻る。**
outbox の行も replication session も消えるため、初回だけ現れる 2 つの形が再び現れる。

## 主な品質リスク

- **`decodedCount` が同じ server 内の呼出順に依存する**。 同じ入力でも、先に `/outbox` を
  何回叩いたかで値が変わる。 `bootAdapterServer()` ごとに adapter は新しくなるため、
  server を分けた test case の実行順には依存しない
- **`sealed` が今回の書込有無を区別しない**。 既存行があれば今回 0 件でも真なので、
  「封をした」 を「今回何かを書いた」 と読むと空の呼出を成功と誤認する。 fresh adapter の
  0 件は成功せず 500 になる
- **成功時の `failoverState` が 1 値に固定されている**。 4 状態を持つ型なのに HTTP 応答は
  `promoted` しか返さず、昇格前の状態は実 driver に差し替えるまで検証されない。 同じ adapter
  への 2 回目は別状態を返さず terminal-state error になる
- **`promotedReplicaId` が省略可能 field**。 current mock の成功時は `promoted` と ID を必ず返すため、
  ID が欠けた observation は 1 度も観測していない
- **`highWaterLsn` が adapter 単位で累積する**。 server を使い回すと前の test の値が残る。
  `bootAdapterServer()` ごとに新しい adapter が立つので test 間では独立する

## 推奨テスト構成

`bootAdapterServer()` が mock adapter を 1 つ作り、port 0 で listen する。
**adapter は server ごと**で、`browser.newContext()` の単位ではない。
同じ server に複数の context から繋ぐと状態を共有する。

`page.goto(origin)` を先に呼ぶ。 呼ばないと `about:blank` の null origin から
`content-type: application/json` を付けた `fetch` を投げることになり、
CORS の事前確認で落ちる (server は `Access-Control-*` も `OPTIONS` も持たない)。

**投げる順序が結果に効く。** `/outbox` と `/cdc-pickup` は outbox / consumer の位置を共有し、
`decodedCount` は前段の書込と ack に依存する。 `/replication` は同じ adapter に載るが、
独立した `replicationSession` を使うため前 2 経路の状態には依存しない。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | outbox の書込数 | `writes` が渡した注文の数と一致する |
| 2 | 封の状態 | `sealed` |
| 3 | CDC が何かを復号する | `decodedCount` |
| 4 | 複製が進んでいる | `primaryLsn` |
| 5 | 3 経路の連結 | 同じ page から順に投げて全部通る |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-E2E-001 | v1 の 3 経路が 1 つの page から連続で通る | mock adapter を載せた server と、その origin に置いた page | `/outbox` (注文 2 件) → `/cdc-pickup` (注文 1 件 / `ackBatchSize` 4) → `/replication` を順に `fetch` | outbox は `ok===true`、`writes===2`、`sealed===true`。 CDC は `ok===true`、`decodedCount>0`。 複製は `ok===true`、`primaryLsn>0` | P0 | yes | node | `/outbox` `/cdc-pickup` `/replication` |

## 既存 test との対応

- 探索した runtime — `typescript`
- 探索した path — `examples/dogfood-postgres-cdc-outbox-app/` 配下の `*.test.ts` / `*.test.tsx` / `*.spec.ts` / `*.spec.tsx` (`node_modules` は除外)。 実在したのは `tests/` と `tests/e2e/` の 2 dir
- 探索した test file — 14 件

| TC | 既存 test の候補 | 判定 |
|---|---|---|
| T-E2E-001 | `T-E2E-001 v1 legacy routes drive together` (`examples/dogfood-postgres-cdc-outbox-app/tests/e2e/v1-legacy-flow.spec.ts:31`) | 既覆 (候補) |

## 自動化すべきテスト

既覆 (候補)。

- T-E2E-001 (P0) — `/outbox` (注文 2 件) → `/cdc-pickup` (注文 1 件 / `ackBatchSize` 4) → `/replication` を順に投げ、outbox と CDC が状態を共有することを確かめる happy path

1 件で 3 経路を通す。 同じ adapter の状態共有が必要なのは **`/outbox` と `/cdc-pickup`**。
fresh server を立てる別々の test に分けると adapter が別になり、`/cdc-pickup` が前段の書込を
引き継ぐ性質を確かめられない。 `/replication` は同じ journey に含めるが状態は独立している。

**`decodedCount>0` は範囲の assert** で、値を固定していない。 実測では 3 になる
(前段の `/outbox` が書いた 2 件 + 自分の 1 件)。 **この 3 という数が
「前段を引き継ぐ」 ことの直接の end-to-end 証拠**だが、範囲でしか見ていないため
引き継ぎが壊れて 1 になっても落ちない。

**この 1 件が覆っていない範囲**。 到達可否は表のとおり。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| `decodedCount` の具体値 (3) | できる | 範囲でしか見ていない |
| `delivered` / `pending` / `duplicates` | できる | 応答に含まれるが assert していない |
| `highWaterLsn` / `ackedLsn` | できる | 同上 |
| 既存 outbox 行がある時、注文 0 件でも `sealed` が真になること | できる | 2 件を渡す形だけを送っている |
| `ackBatchSize` を変えた時の `delivered` | できる | 4 だけを送っている |
| `replicaLag` / `failoverState` / `promotedReplicaId` | できる | `primaryLsn` だけを assert している |
| `/at-least-once` 経路 | できる | この test が投げていない (同じ server にある) |
| 同じ server で 2 回目の `/replication` が 500 になること | できる | 1 回だけ投げている |
| `failoverState` の `promoted` 以外の 3 状態 | **できない** | mock は昇格まで進めてから成功応答を返す |

## 手動確認でよいテスト

(なし)

## 不足している仕様

(なし)
