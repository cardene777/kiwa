# test-spec-wal-fts5-edge-flow (e2e-generic layer)

SQLite の 3 つの流れ (WAL / FTS5 / edge 配備) を、**1 つの browser context から
同じ server へ順に投げて**確かめる。

UI は無い。 `tests/e2e/fixture.ts` が mock adapter を JSON の口として node server に載せ、
browser の `fetch` がそこを叩く。 `page.goto(origin)` で同じ origin に置いてから投げるため
cross-origin にならない。

- module: wal-fts5-edge-flow
- layer: e2e-generic

## 対象機能

| 経路 | adapter の op | 実体 |
|---|---|---|
| `/wal-full-journey` | `driveWalFullJourney` | `src/wal/index.ts` → `@kiwa-lab/orm` の WAL 5 状態 |
| `/fts5-full-journey` | `driveFts5FullJourney` | `src/fts5/index.ts` → `@kiwa-lab/orm` の FTS5 5 状態 |
| `/edge-roundtrip` | `driveEdgeRoundtrip` | `src/edge/index.ts` の決定的な待ち時間模型 |

## 仕様の要約

### WAL の 5 状態と、既定値

`driveWalJourney` は 4 つの遷移を順に呼ぶ。 途中で失敗すると送出し、server が 500 にする。

```
rollback-journal → wal-enabled → threshold-crossed → checkpointed → shared-memory-mapped
```

| 入力 | 既定 |
|---|---|
| `thresholdBytes` | 4 MiB |
| `walSizeBytes` | 8 MiB |
| `checkpointMode` | `TRUNCATE` |
| `regionBytes` | 32 KiB |

### checkpoint の種類で `walSizeBytes` の結末が変わる

**`TRUNCATE` だけが WAL の大きさを 0 に戻す。** 実測した 4 通り。

| `checkpointMode` | `walSizeBytes` (入力 4096) | `checkpointCount` |
|---|---|---|
| `PASSIVE` | 4096 (そのまま) | 1 |
| `FULL` | 4096 (そのまま) | 1 |
| `RESTART` | 4096 (そのまま) | 1 |
| `TRUNCATE` | **0** | 1 |

`checkpointCount` は種類に依らず 1 で、**1 回の journey が 1 回だけ checkpoint を打つ**ことを表す。

### 閾値を跨がない入力は送出する

`walSizeBytes` が `thresholdBytes` **以下**だと `crossWalSizeThreshold` が送出し、
server が 500 と `{"ok":false,"errorKind":"crossWalSizeThreshold: walSizeBytes must exceed thresholdBytes"}` を返す。

境界は狭義の不等号で、ちょうど同じ値も通らない。

### FTS5 は入力をそのまま返す部分が多い

mock なので実際の転置索引は作らない。 実測した既定値。

| 項目 | 既定 | 由来 |
|---|---|---|
| `tableName` | `notebook_fts` | adapter の設定 |
| `tokenizer` | `unicode61` | 入力をそのまま返す |
| `tokenCount` | **10** | 既定の文書 (10 語) を数えた結果 |
| `matchRank` | **-3.14** | 入力の `rank` をそのまま返す |
| `vocabTerm` / `vocabOccurrences` | `sqlite` / 2 | 入力をそのまま返す |

**`tokenizer` を変えても `tokenCount` は 10 のまま。** `porter` と `trigram` で実測した。
実 SQLite なら分かち方が変わるが、mock は文書を空白で数えるだけで種類を見ない。

### edge の待ち時間は決定的

乱数も実時計も使わない。 `region:runtime` を種にした fnv1a から算出する。

| `runtime` | `coldStartMs` |
|---|---|
| `bun` | 4 |
| `node` | 32 |
| `workerd` | 1 |

warm の標本は `0.4 + jitter` で、`jitter` は種の byte から作る 0〜0.5 ms。
**種に `runtime` も入るため、同じ region でも runtime が違えば標本列が変わる。**
実測で `iad:bun` は `[0.521, 0.711, 0.804, ...]`、`iad:node` は `[0.668, 0.783, 0.841, ...]`。

`requests` が 0 以下なら `driveEdgeRoundtripFlow` が送出し、server が 500 を返す。

## 主な品質リスク

- **`checkpointCount` が種類を区別しない**。 4 種すべてで 1 で、observation に mode も無い。
  `walSizeBytes` から区別できるのは `TRUNCATE` と残り 3 種までで、
  `PASSIVE` / `FULL` / `RESTART` のどれかは判別できない
- **`tokenCount` が tokenizer を見ない**。 空白分割だけで数えるため、tokenizer ごとの
  分割規則を持つ実 SQLite と意味が乖離する
- **`matchRank` が入力の反射**。 検索の順位付けを何も検証していないため、
  この値の assert は「入出力が繋がっている」 以上を保証しない
- **閾値が狭義の不等号**。 ちょうど同じ値で送出するため、境界を跨ぐつもりの入力が 500 になる
- **待ち時間が実測でない**。 `coldStartMs` は runtime ごとの定数で、
  実際の起動時間を測っていない。 性能の回帰は検出できない
- **`requests` に上限も整数検査も無い**。 大きな正数を渡すと、その件数ぶん同期 loop で
  `warmSamplesMs` を作る。 64 KiB の body 上限では数値の大きさを制限できないため、
  local test server の CPU / memory を過剰に消費できる

## 推奨テスト構成

`bootAdapterServer()` が port 0 で listen し、`127.0.0.1` の空き port に載る。
新しい adapter が立つ境界は `browser.newContext()` ではなく `bootAdapterServer()` の呼出になる。
各 test が server を起動し直す現在の構成では test 間で状態を共有しない。同じ server を向く
複数 context があれば、その context 間では 1 つの adapter を共有する。

**`page.goto(origin)` を先に呼ぶ。** 呼ばないと `about:blank` の null origin から
`content-type: application/json` を付けた `fetch` を投げることになり、
CORS の事前確認で落ちる (server は `Access-Control-*` も `OPTIONS` も持たない)。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | WAL の終端状態 | `finalJournalMode` / `finalState` |
| 2 | checkpoint の効果 | `checkpointCount` と `walSizeBytes` |
| 3 | FTS5 の終端状態 | `finalState` / `tokenizer` / `tokenCount` |
| 4 | edge の待ち時間 | `coldStartMs` / `warmMeanMs` |
| 5 | 3 経路の連続到達 | 同じ page / origin から順に投げて全部通る |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-E2E-001 | 3 経路が 1 つの context から連続で通る | mock adapter を載せた server と、その origin に置いた page | `/wal-full-journey` (閾値 1024 / WAL 4096 / `TRUNCATE` / 領域 16384) → `/fts5-full-journey` (既定) → `/edge-roundtrip` (`iad` / `bun` / 6 回) を順に `fetch` | WAL は `finalJournalMode==='WAL'`、`finalState==='shared-memory-mapped'`、`checkpointCount>0`、`walSizeBytes===0`。 FTS5 は `finalState==='vocab-inspected'`、`tokenizer==='unicode61'`、`tokenCount>0`。 edge は `runtime==='bun'`、`coldStartMs<10`、`warmMeanMs<1`、`requestsHandled===6` | P0 | yes | node | `/wal-full-journey` `/fts5-full-journey` `/edge-roundtrip` |

## 既存 test との対応

- 探索した runtime — `typescript`
- 探索した path — `examples/dogfood-sqlite-wal-fts-app/` 配下の `*.test.ts` / `*.test.tsx` / `*.spec.ts` / `*.spec.tsx` (`node_modules` は除外)。 実在したのは `tests/` と `tests/e2e/` の 2 dir
- 見つけた既存 test — 43 件 (`describe` / `it` / `test`)

| TC | 既存 test の候補 | 判定 |
|---|---|---|
| T-E2E-001 | `T-E2E-001 wal + fts5 + edge routes drive the full 3-flow surface together` (`examples/dogfood-sqlite-wal-fts-app/tests/e2e/wal-fts5-edge-flow.spec.ts:31`) | 既覆 (候補) |

## 自動化すべきテスト

既覆 (候補)。

- T-E2E-001 (P0) — `/wal-full-journey` (閾値 1024 / WAL 4096 / `TRUNCATE` / 領域 16384) → `/fts5-full-journey` (既定) → `/edge-roundtrip` (`iad` / `bun` / 6 回) を順に投げ、3 経路が 1 つの context から連続で通ることを確かめる happy path

1 件で 3 経路を通すため、同じ page / origin から 3 route へ順に到達できることを確かめる。
実装上は 3 route が同じ adapter を使うが、この test は `/metrics` / `/traces` を読まないため、
adapter の同一性や route 間の状態共有までは観測していない。

**この 1 件が覆っていない主要な範囲**を明示する。 いずれも同じ経路から到達できる。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| `PASSIVE` / `FULL` / `RESTART` の `walSizeBytes` | できる | `TRUNCATE` だけを送っている |
| `checkpointCount===1` | できる | `>0` の範囲でしか見ていない |
| `sharedMemoryBytes===16384` | できる | response から読んでいない |
| 閾値を跨がない入力の 500 | できる | 正常系だけを送っている |
| `porter` / `trigram` の tokenizer | できる | 既定の `unicode61` だけを送っている |
| `tokenCount===10` | できる | `>0` の範囲でしか見ていない |
| `tableName` / `matchRank` / vocab 2 項目 | できる | response から読んでいない |
| `node` / `workerd` の `coldStartMs` | できる | `bun` だけを送っている |
| region を変えた時の標本列 | できる | `iad` だけを送っている |
| response の `region==='iad'` | できる | response から読んでいない |
| `requests` が 0 以下の 500 | できる | 正の値だけを送っている |
| `requests` の上限 / 整数性 | できる | `6` だけを送っている |
| `warmSamplesMs` の中身 | できる | 平均だけを assert し、列そのものを見ていない |
| 3 route 間の adapter 状態共有 | できる | `/metrics` / `/traces` を読んでいない |

`checkpointCount>0` / `tokenCount>0` / `coldStartMs<10` / `warmMeanMs<1` は
**範囲の assert** で、決定的な値を固定していない。 実装から導ける値は順に
1 / 10 / 4 / 0.671 (`iad:bun`、6 回)。 値を固定すれば模型が変わった時に落ちるが、
現状は範囲を外れるまで気付けない。

## 手動確認でよいテスト

(なし)

## 不足している仕様

(なし)
