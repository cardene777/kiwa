# test-spec-group-replication-router-flow (e2e-generic layer)

MySQL の 3 経路 (group replication / binlog の前進 / router の読み書き分離) を、
同じ adapter に順に投げて確かめる。

3 つの **adapter op は入力を取らない**。 mock は決まった値を返すため、
この仕様書が保証するのは「口が繋がっていて、期待の終端状態に至る」
ことになる。下位 flow は入力を取るが、adapter がそれらを固定値で呼ぶ。

- module: group-replication-router-flow
- layer: e2e-generic

## 対象機能

| 経路 | adapter の op | 実体 |
|---|---|---|
| `/group-replication` | `driveGroupReplication` | `src/adapters/mock.ts` + `src/group-replication/index.ts` |
| `/binlog-advance` | `driveBinlogAdvance` | `src/adapters/mock.ts` + `src/binlog-advance/index.ts` |
| `/router-split` | `driveRouterSplit` | `src/adapters/mock.ts` + `src/router-split/index.ts` |

## 仕様の要約

### 3 経路とも adapter の op は引数を取らない

`fixture.ts` の route は body を読まずに op を呼ぶ。

```ts
'/group-replication': async (adapter) => adapter.driveGroupReplication(),
'/binlog-advance':    async (adapter) => adapter.driveBinlogAdvance(),
'/router-split':      async (adapter) => adapter.driveRouterSplit(),
```

**route に到達すれば、何を POST しても結果は変わらない。**
ただし route へ到達する前に server 側の分岐がある = 壊れた JSON は 400、
64 KiB 超の body は 413 で、いずれも adapter を呼ばない。

### 実測した返り値

| 経路 | 値 |
|---|---|
| `/group-replication` | `groupName: 'kiwa_orgs_group_v2'`、`primaryId: 'mysql-node-1'`、`peakMemberCount: 2`、`conflictCount: 1`、`finalState: 'member-left'` |
| `/binlog-advance` | `serverId: 'mysql-node-1'`、`binlogFile: 'mysql-bin.000042'`、`binlogPosition: 4096`、`format: 'ROW'`、`gtidCount: 2`、`gapDetected: true` |
| `/router-split` | `poolId: 'mysql_router_rw_pool_v2'`、`readHits: 4`、`writeHits: 2`、`warmedConnections: 8`、`finalState: 'metrics-exported'` |

**同じ server で 2 回ずつ呼んで応答が完全一致することを確かめた。** 乱数も実時計も使わない。

### 終端状態が示すもの

| 経路 | 終端 | 意味 |
|---|---|---|
| group replication | `member-left` | member が抜けた後まで進む |
| router split | `metrics-exported` | 計測の書き出しまで進む |

`gapDetected: true` と `conflictCount: 1` は **異常が起きた状態を正常な終端として返す**。
mock は「異常を検出できた」 ことを成功として表す。

### metric への効き方

| 経路 | 増える counter | 増分 |
|---|---|---|
| `/group-replication` | `groupReplicationSteps` | **5** (`session.history.length` = join 2 + elect 1 + conflict 1 + leave 1) |
| `/binlog-advance` | `binlogAdvanceOps` | **5** (`session.history.length` = position 1 + GTID 2 + format 1 + gap 1) |
| `/router-split` | `routerSplitOps` | **1** |

**counter は 4 経路とも fresh server で実測した** (経路ごとに新しい server を立て、
`/metrics` の非 0 field を読む)。

| 経路 | 非 0 の counter | trace |
|---|---|---|
| `/group-replication` | `groupReplicationSteps=5` | 1 件 |
| `/binlog-advance` | `binlogAdvanceOps=5` | 1 件 |
| `/router-split` | `routerSplitOps=1` | 1 件 |
| `/testcontainers-probe` | `testcontainersProbes=1` | 1 件 |

**trace は 4 経路とも 1 件で揃うが、counter の単位は揃わない。**
前 2 つは履歴の要素数を足し、後 2 つは呼出回数を足す。

`/router-split` は `readHits: 4` / `writeHits: 2` を返すが、counter は 1 しか増えない。
**返り値の回数と counter の単位が違う** (postgres の `pgvectorSearches` とは逆の関係)。

## 主な品質リスク

- **HTTP から下位 flow の分岐を選べない**。adapter op は入力を取らず、
  固定した既定値だけを下位 flow に渡す。下位 flow に入力 validation と
  状態遷移の異常系は存在するが、この fixture からは到達できない
- **異常が正常な終端として返る**。 `gapDetected` と `conflictCount` が真 / 正の値で固定されているため、
  「異常が無い」 状態を観測する手段が無い。 検出漏れを検証できない
- **`readHits` と `writeHits` が counter に反映されない**。 `routerSplitOps` は 1 しか増えないため、
  分離の回数を metric から追えない
- **`primaryId` が固定**。 昇格が起きた場合の別 id を返す経路が無く、
  primary の切替を検証できない
- **body が捨てられる**。 誤って別の経路の body を投げても 200 が返るため、呼び違いに気付けない

## 推奨テスト構成

`bootAdapterServer()` が mock adapter を 1 つ作り、port 0 で listen する。
**adapter は server ごと**で、`browser.newContext()` の単位ではない。

`page.goto(origin)` を先に呼ぶ (`about:blank` からだと CORS の事前確認で落ちる)。

3 経路は互いの状態に依存しないため、順序を変えても値は変わらない。
実測で 2 回ずつ呼んで応答が一致することも確かめた。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | group replication の終端 | `finalState` / `primaryId` / `peakMemberCount` / `conflictCount` |
| 2 | binlog の前進 | `format` / `gtidCount` / `gapDetected` / `binlogPosition` |
| 3 | router の分離 | `finalState` / `readHits` + `writeHits` / `warmedConnections` |
| 4 | 3 経路の連結 | 同じ page から順に投げて全部通る |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-E2E-001 | v2 の 3 経路が 1 つの page から連続で通る | mock adapter を載せた server と、その origin に置いた page | `/group-replication` → `/binlog-advance` → `/router-split` を空の body で順に `fetch` | group は `finalState==='member-left'`、`primaryId==='mysql-node-1'`、`peakMemberCount===2`、`conflictCount===1`。 binlog は `format==='ROW'`、`gapDetected===true`、`gtidCount===2`、`binlogPosition>0`。 router は `finalState==='metrics-exported'`、`readHits+writeHits>0`、`warmedConnections>0` | P0 | yes | node | `/group-replication` `/binlog-advance` `/router-split` |

## 自動化方針

1 件で 3 経路を通す。 3 つが互いに依存しないため分けても値は変わらないが、
1 つの adapter が 3 op を続けて処理できることを 1 件で示す形にしてある。

**assert の固定度が経路で違う。**

| 経路 | 固定した値 | 範囲でしか見ていない値 |
|---|---|---|
| group replication | `finalState` / `primaryId` / `peakMemberCount` / `conflictCount` | — |
| binlog | `format` / `gapDetected` / `gtidCount` | `binlogPosition>0` (実測 4096) |
| router | `finalState` | `readHits+writeHits>0` (実測 6)、`warmedConnections>0` (実測 8) |

router だけ **和** でしか見ていないため、`readHits: 6` / `writeHits: 0` に変わっても落ちない。
読み書きの分離そのものは検証していない。

**この 1 件が覆っていない範囲**。 いずれも同じ経路から到達できる。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| `groupName` | できる | 応答に含まれるが assert していない |
| `serverId` / `binlogFile` | できる | 同上 |
| `poolId` | できる | 同上 |
| `readHits` と `writeHits` の個別値 | できる | 和でしか見ていない |
| `binlogPosition` / `warmedConnections` の具体値 | できる | 範囲でしか見ていない |
| metric への効き方 | できる | `/metrics` を読んでいない |
| trace の追加 | できる | `/traces` を読んでいない |
| 2 回目の呼出でも同じ値になること | できる | 1 回ずつしか投げていない |
| body を変えても結果が変わらないこと | できる | 空の body だけを送っている |
| 壊れた JSON の 400 / 64 KiB 超の 413 | できる | 正常な body だけを送っている |
| 下位 flow の別入力と異常系 | **HTTP からはできない** | adapter op が引数を取らず、下位 flow を既定値で呼ぶ |

adapter が返す固定応答の field はすべて HTTP から到達できる。一方、
下位 flow (`src/group-replication/index.ts` 等) の別入力とそれに伴う分岐は、
adapter が引数無しで呼ぶため HTTP からは選べない。
