# test-spec-logical-replication-slot-flow (e2e-generic layer)

Postgres 16 の進んだ 3 経路 (論理複製 / 複製 slot の寿命 / pgvector) を、
同じ adapter に順に投げて確かめる。

いずれも **入力を取らない**。 mock は決まった値を返すため、この仕様書が保証するのは
「口が繋がっていて、期待の終端状態に至る」 ことになる。

- module: logical-replication-slot-flow
- layer: e2e-generic

## 対象機能

| 経路 | adapter の op | 実体 |
|---|---|---|
| `/logical-replication` | `driveLogicalReplicationAdvanced` | `src/logical-replication/index.ts` |
| `/slot-advance` | `driveSlotAdvance` | `src/slot-advance/index.ts` |
| `/pgvector` | `drivePgvector` | `src/pgvector/index.ts` |

## 仕様の要約

### 3 経路とも引数を取らない

`fixture.ts` の route は body を読まずに op を呼ぶ。

```ts
'/logical-replication': async (adapter) => adapter.driveLogicalReplicationAdvanced(),
'/slot-advance':        async (adapter) => adapter.driveSlotAdvance(),
'/pgvector':            async (adapter) => adapter.drivePgvector(),
```

**何を POST しても結果は変わらない。** body の内容は捨てられる
(壊れた JSON だけは server が先に 400 を返す)。

### 実測した返り値

| 経路 | 値 |
|---|---|
| `/logical-replication` | `startLsn: 10000`、`originId: 'origin_orders_subscriber'`、`confirmedFlushLsn: 11200`、`synchronousStandbys: 2`、`cascadedSubscribers: 1`、`finalState: 'cascade-synced'` |
| `/slot-advance` | `slotName: 'outbox_slot_v2'`、`retainedLsn: 20000`、`advancedLsn: 24096`、`dropped: true`、`recycledBytes: 4096` |
| `/pgvector` | `indexKind: 'ivfflat'`、`dimensions: 8`、`lists: 3`、`searchCount: 2`、`computedDistance: 1`、`bothSearchesRecorded: true` |

いずれも呼ぶたびに同じ値を返す。 乱数も実時計も使わない。

### 値どうしの関係

| 関係 | 実測 |
|---|---|
| `advancedLsn - retainedLsn` | 4096 = `recycledBytes` |
| `confirmedFlushLsn - startLsn` | 1200 |
| `searchCount` | 2 (k-NN と hybrid の 2 回) |
| `bothSearchesRecorded` | `searchCount === 2` と対応する |

`recycledBytes` が差と一致するのは実装がそう組んでいるためで、
**この関係を test は確かめていない** (両方を assert していない)。

### metric への効き方

| 経路 | 増える counter | 増分 |
|---|---|---|
| `/logical-replication` | `logicalReplicationSteps` | 状態遷移の数 |
| `/slot-advance` | `slotAdvanceOps` | 1 |
| `/pgvector` | `pgvectorSearches` | **2** (`searchCount` を足す) |

`pgvectorSearches` は呼出回数ではなく検索回数を足す。 実測で 1 回の呼出で 2 増えた。

## 主な品質リスク

- **3 経路とも入力を取らない**。 分岐が 1 本しかないため、mock の段階では
  異常系も境界も存在しない。 実 driver に差し替えた時に初めて分岐が生まれる
- **`dropped: true` が常に返る**。 slot を落とさない経路が無いため、
  「落とさずに保持し続ける」 状態の検証手段が無い
- **`pgvectorSearches` の単位が呼出回数でない**。 release gate がこれを op 数として扱うと
  2 倍に見える (`@kiwa-lab/quality-metrics` の 13 軸 gate が消費する)
- **`computedDistance: 1` の意味が値から読めない**。 cosine 距離なら 1 は直交を表すが、
  mock が計算しているのか定数なのかを応答からは区別できない
- **body が捨てられる**。 誤って別の経路の body を投げても 200 が返るため、
  呼び違いに気付けない

## 推奨テスト構成

`bootAdapterServer()` が mock adapter を 1 つ作り、port 0 で listen する。
**adapter は server ごと**で、`browser.newContext()` の単位ではない。

`page.goto(origin)` を先に呼ぶ (`about:blank` からだと CORS の事前確認で落ちる)。

3 経路は互いの状態に依存しないため、順序を変えても値は変わらない
(`/cdc-pickup` を含む v1 の経路とはここが違う)。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | 論理複製の終端状態 | `finalState` / `cascadedSubscribers` |
| 2 | slot の寿命 | `dropped` / `recycledBytes` |
| 3 | pgvector の索引と検索 | `indexKind` / `bothSearchesRecorded` |
| 4 | 3 経路の連結 | 同じ page から順に投げて全部通る |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-E2E-001 | v2 の 3 経路が 1 つの page から連続で通る | mock adapter を載せた server と、その origin に置いた page | `/logical-replication` → `/slot-advance` → `/pgvector` を空の body で順に `fetch` | 論理複製は `finalState==='cascade-synced'`、`cascadedSubscribers>=1`。 slot は `dropped===true`、`recycledBytes>0`。 pgvector は `indexKind==='ivfflat'`、`bothSearchesRecorded===true` | P0 | yes | node | `/logical-replication` `/slot-advance` `/pgvector` |

## 自動化方針

1 件で 3 経路を通す。 3 つが互いに依存しないため分けても値は変わらないが、
**1 つの adapter が 3 op を続けて処理できる**ことを 1 件で示す形にしてある。

assert は終端状態と真偽値に寄せてあり、**数値は 1 つも固定していない**。
`cascadedSubscribers>=1` と `recycledBytes>0` はどちらも範囲で、実測値 (1 と 4096) を pin しない。

**この 1 件が覆っていない範囲**。 いずれも同じ経路から到達できる。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| `startLsn` / `confirmedFlushLsn` / `originId` / `synchronousStandbys` | できる | 応答に含まれるが assert していない |
| `slotName` / `retainedLsn` / `advancedLsn` | できる | 同上 |
| `advancedLsn - retainedLsn === recycledBytes` の関係 | できる | 両方を読んでいない |
| `dimensions` / `lists` / `searchCount` / `computedDistance` | できる | 同上 |
| metric への効き方 (`pgvectorSearches` が +2) | できる | `/metrics` を読んでいない |
| body を変えても結果が変わらないこと | できる | 空の body だけを送っている |

到達できない範囲は無い。 3 経路とも mock が 1 本の分岐しか持たないため、
**この test が通る限り mock 側に未検証の分岐は残らない** (real 側は別 adapter で、
`fixture.ts` に注入口が無いため e2e からは到達しない)。
