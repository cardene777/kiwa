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

### 3 経路が状態を共有する

**この仕様書で最も重要な性質。** `/cdc-pickup` は自分が受け取った注文だけを見るのではない。

```
pickupSince(outbox.outbox(), consumer.state().ackedLsn)
```

**まだ ack していない outbox の行をすべて復号する。** 直前の `/outbox` が書いた行も含む。

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
| `ackedLsn` | 確定済の位置。 `/cdc-pickup` が ack するまで 0 |
| `sealed` | session の状態が `ordered` か `delivered` なら真 |

**注文が 0 件でも `sealed` は真**。 実測で空配列と既定 (未指定) のどちらも
`writes: 0` / `sealed: true` を返し、`highWaterLsn` は直前の値のまま動かなかった。

### 複製は必ず promoted で終わる

`/replication` は入力を取らない。 実測した値。

| 項目 | 値 |
|---|---|
| `primaryLsn` | 384 |
| `replicaLag` | 284 |
| `failoverState` | **`promoted`** |
| `promotedReplicaId` | `replica-b` |

`failoverState` は `streaming` / `lagged` / `failover-in-progress` / `promoted` の 4 値を持つが、
**mock は常に `promoted` を返す**。 他の 3 状態は HTTP 経由で観測できない。

## 主な品質リスク

- **`decodedCount` が呼出順に依存する**。 同じ入力でも、直前に `/outbox` を何回叩いたかで
  値が変わる。 test を並べ替えると期待値が変わる
- **`sealed` が書込の有無を区別しない**。 0 件でも真なので、
  「封をした」 を「何かを書いた」 と読むと空の呼出を成功と誤認する
- **`failoverState` が 1 値に固定されている**。 4 状態を持つ型なのに mock は 1 つしか返さず、
  昇格以外の分岐は実 driver に差し替えるまで検証されない
- **`promotedReplicaId` が省略可能 field**。 `promoted` 以外の状態では欠ける想定だが、
  mock がその状態を返さないため欠けた形を 1 度も観測していない
- **`highWaterLsn` が adapter 単位で累積する**。 server を使い回すと前の test の値が残る。
  `bootAdapterServer()` ごとに新しい adapter が立つので test 間では独立する

## 推奨テスト構成

`bootAdapterServer()` が mock adapter を 1 つ作り、port 0 で listen する。
**adapter は server ごと**で、`browser.newContext()` の単位ではない。
同じ server に複数の context から繋ぐと状態を共有する。

`page.goto(origin)` を先に呼ぶ。 呼ばないと `about:blank` の null origin から
`content-type: application/json` を付けた `fetch` を投げることになり、
CORS の事前確認で落ちる (server は `Access-Control-*` も `OPTIONS` も持たない)。

**投げる順序が結果に効く。** `/cdc-pickup` の `decodedCount` は直前の `/outbox` に依存する。

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

## 自動化方針

1 件で 3 経路を通す。 分けないのは、**3 つが同じ adapter の状態を共有する**ため。
別々の test にすると adapter が別になり、`/cdc-pickup` が前段の書込を引き継ぐ性質を確かめられない。

**`decodedCount>0` は範囲の assert** で、値を固定していない。 実測では 3 になる
(前段の `/outbox` が書いた 2 件 + 自分の 1 件)。 **この 3 という数が
「前段を引き継ぐ」 ことの唯一の証拠**だが、範囲でしか見ていないため
引き継ぎが壊れて 1 になっても落ちない。

**この 1 件が覆っていない範囲**。 いずれも同じ経路から到達できる。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| `decodedCount` の具体値 (3) | できる | 範囲でしか見ていない |
| `delivered` / `pending` / `duplicates` | できる | 応答に含まれるが assert していない |
| `highWaterLsn` / `ackedLsn` | できる | 同上 |
| 注文 0 件でも `sealed` が真になること | できる | 2 件を渡す形だけを送っている |
| `ackBatchSize` を変えた時の `delivered` | できる | 4 だけを送っている |
| `replicaLag` / `failoverState` / `promotedReplicaId` | できる | `primaryLsn` だけを assert している |
| `/at-least-once` 経路 | できる | この test が投げていない (同じ server にある) |
| `failoverState` の `promoted` 以外の 3 状態 | **できない** | mock が常に `promoted` を返す |
