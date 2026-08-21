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

**parse 可能で 64 KiB 以下なら何を POST しても結果は変わらない。** body の内容は捨てられる。
壊れた JSON は server が先に 400、64 KiB を超える body は route 到達前に 413 を返す。

### 実測した返り値

| 経路 | 値 |
|---|---|
| `/logical-replication` | `startLsn: 10000`、`originId: 'origin_orders_subscriber'`、`confirmedFlushLsn: 11200`、`synchronousStandbys: 2`、`cascadedSubscribers: 1`、`finalState: 'cascade-synced'` |
| `/slot-advance` | `slotName: 'outbox_slot_v2'`、`retainedLsn: 20000`、`advancedLsn: 24096`、`dropped: true`、`recycledBytes: 4096` |
| `/pgvector` | `indexKind: 'ivfflat'`、`dimensions: 8`、`lists: 3`、`searchCount: 2`、`computedDistance: 1`、`bothSearchesRecorded: true` |

いずれも呼ぶたびに同じ値を返す。 乱数も実時計も使わない。

**同じ server で 2 回ずつ呼んで確かめた。** 3 経路とも 1 回目と 2 回目で応答が完全に一致する。

これは v1 の `/outbox` と `/replication` と対照的で、あちらは 2 回目の結果が変わる
(`/outbox` は行の有無で、`/replication` は terminal state に達して 500 になる)。

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

- **3 つの HTTP 経路は adapter op への入力を取らない**。 adapter が各 flow を既定値で呼ぶため、
  route 到達後の adapter 応答には HTTP から選べる正常系・境界・異常系の分岐が無い。 下位の
  `driveSlotAdvanceFlow()` には `advancedLsn <= retainedLsn` の拒否分岐があるが、`fixture.ts` の
  route からは入力できない。 route 到達前の JSON parse / body-size 分岐は別に存在する
- **`dropped: true` が常に返る**。 slot を落とさない経路が無いため、
  「落とさずに保持し続ける」 状態の検証手段が無い
- **`pgvectorSearches` の単位が呼出回数でない**。 1 呼出を 1 op とみなす consumer が
  この counter を使うと 2 倍に見える。 現在の fidelity release gate は trace の op coverage を使い、
  `pgvectorSearches` を直接は消費しない
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
| T-E2E-001 | v2 の 3 経路が 1 つの page から連続で通る | mock adapter を載せた server と、その origin に置いた page | `/logical-replication` → `/slot-advance` → `/pgvector` を空の body で順に `fetch` | 論理複製は `finalState==='cascade-synced'`、`cascadedSubscribers>=1`。 slot は `dropped===true`、`recycledBytes>0`。 pgvector は `indexKind==='ivfflat'`、`bothSearchesRecorded===true`、`searchCount>=2` | P0 | yes | node | `/logical-replication` `/slot-advance` `/pgvector` |

## 既存 test との対応

- 探索した runtime — `typescript`
- 探索した path — `examples/dogfood-postgres-cdc-outbox-app/` 配下の `*.test.ts` / `*.test.tsx` / `*.spec.ts` / `*.spec.tsx` (`node_modules` は除外)。 実在したのは `tests/` と `tests/e2e/` の 2 dir
- 探索した test file — 14 件

| TC | 既存 test の候補 | 判定 |
|---|---|---|
| T-E2E-001 | `T-E2E-001 logical-replication + slot-advance + pgvector routes drive together` (`examples/dogfood-postgres-cdc-outbox-app/tests/e2e/logical-replication-slot-flow.spec.ts:31`) | 既覆 (候補) |

## 自動化すべきテスト

既覆 (候補)。

- T-E2E-001 (P0) — `/logical-replication` → `/slot-advance` → `/pgvector` を 1 つの page から順に投げ、3 経路が同じ adapter で続けて処理されることを確かめる happy path

1 件で 3 経路を通す。 3 つが互いに依存しないため分けても値は変わらないが、
**1 つの adapter が 3 op を続けて処理できる**ことを 1 件で示す形にしてある。

assert は終端状態と真偽値に寄せてあり、**数値の完全一致は 1 つもない**。
`cascadedSubscribers>=1`、`recycledBytes>0`、`searchCount>=2` はいずれも範囲で、
実測値 (1、4096、2) を pin しない。

**この 1 件が覆っていない範囲**。 いずれも同じ経路から到達できる。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| `startLsn` / `confirmedFlushLsn` / `originId` / `synchronousStandbys` | できる | 応答に含まれるが assert していない |
| `slotName` / `retainedLsn` / `advancedLsn` | できる | 同上 |
| `advancedLsn - retainedLsn === recycledBytes` の関係 | できる | 両方を読んでいない |
| `dimensions` / `lists` / `computedDistance` | できる | 応答に含まれるが assert していない |
| `searchCount` の具体値 (2) | できる | `>=2` の範囲でしか assert していない |
| metric への効き方 (`pgvectorSearches` が +2) | できる | `/metrics` を読んでいない |
| body を変えても結果が変わらないこと | できる | 空の body だけを送っている |

3 つの mock adapter op が返す成功時の応答については、別の結果を選ぶ入力分岐が無い。
一方、下位 flow を直接呼ぶ時の override / 拒否分岐と real adapter はこの HTTP test の範囲外で、
`fixture.ts` に注入口が無いため e2e からは到達しない。 shared server の JSON parse / body-size /
未知 route / method の分岐も、この test case は通していない。

## 手動確認でよいテスト

(なし)

## 不足している仕様

(なし)
