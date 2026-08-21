# test-spec-emit-fidelity-flow (e2e-generic layer)

5 つの op を 1 巡させた後、**その記録が正しく積み上がっているか**を確かめる。

adapter は op ごとに 1 つの待ち時間標本と 1 件の trace を残す。 この仕様書が対象にするのは
op そのものの結果ではなく、**記録の側**になる。

- module: emit-fidelity-flow
- layer: e2e-generic

## 対象機能

| 経路 | adapter の op | 記録に効くか |
|---|---|---|
| `/wal-full-journey` | `driveWalFullJourney` | 効く |
| `/fts5-full-journey` | `driveFts5FullJourney` | 効く |
| `/edge-roundtrip` | `driveEdgeRoundtrip` | 効く |
| `/testcontainers-probe` | `driveTestcontainersProbe` | 効く |
| `/emit-fidelity` | `emitFidelity` | 効く |
| `/metrics` | `metrics` | **効かない** |
| `/traces` | `traces` | **効かない** |
| `/reset` | `reset` | 記録を消す |

## 仕様の要約

### 記録を残すのは 5 op だけ

待ち時間標本を足すのは `timed()`、成功 trace を足すのは各 op 内の `record()` になる
(`timed()` 自身が trace を足すのは失敗時だけ)。 上表の「効く」 5 つは両方を通る。
`metrics` / `traces` はどちらも呼ばないため、**何度読んでも標本も trace も増えない**。
`reset` もどちらも呼ばず、既存の記録を消す。

実測で確認した。 `/metrics` を 6 回呼んでも `latencySamplesMs` は op の数のまま。

### 積み上がり方

| 項目 | 増え方 |
|---|---|
| `latencySamplesMs` | op 1 回につき **1 標本** |
| `traces()` | op 1 回につき **1 件** |
| `walJourneySteps` | 1 回につき **+4** (状態遷移の履歴の長さ) |
| `fts5JourneySteps` | 1 回につき **+4** (同上) |
| `edgeInvocations` | 1 回につき **+`requestsHandled`** (回数そのもの) |
| `testcontainersProbes` | 1 回につき **+1** |

**`edgeInvocations` だけ単位が違う。** 他は「op を何回呼んだか」 に比例するが、
これは「何回の要求を捌いたか」 を足す。 既定の `requests` は 10 なので、
`/edge-roundtrip` を 1 回呼ぶと 10 増える。

実測で `/wal-full-journey` を 2 回呼ぶと `walJourneySteps` が 8 に、
`/edge-roundtrip` を `requests: 3` で 1 回呼ぶと `edgeInvocations` が 3 になった。

### `reset` が消すもの

trace を空にし、metric の 5 field のうち `latencySamplesMs` を空配列、4 counter を 0 に戻す。
実測で `reset` 後の `/metrics` が初期値、`/traces` が空配列を返すことを確認した。

### 失敗した op も標本を残す

`timed()` は `catch` の中でも標本を積む。 送出した op は trace に
`ok: false` と `errorKind: 'SQLITE_MOCK_ERROR'` を残す。

入力の検証は `@kiwa-lab/orm` 側や `src/edge/index.ts` が `timed()` の内側で行う。
そこでの送出は失敗 trace を残して adapter から再送出され、server が捕捉して 500 と
`errorKind` を返す。

## 主な品質リスク

- **`edgeInvocations` の単位が他と違う**。 「op の呼出回数」 と読むと 10 倍ずれる。
  release gate がこの値を op 数として扱うと、edge だけが過大評価される
- **`metrics` / `traces` 自体が記録されない**。 読み取りの回数は追跡できないため、
  「誰がいつ読んだか」 は分からない
- **`walJourneySteps` の +4 は履歴 entry 数に依存する**。 現在の `driveWalJourney()` は
  4 つの ORM 操作を呼び、各操作が `session.history` に 1 件ずつ記録する。 呼ぶ操作または
  1 操作あたりの記録数が変わると値も変わるため、4 は adapter 契約ではない
- **`reset` に認可が無い**。 server は `127.0.0.1` の一時 port にだけ bind するが、
  そこへ POST できる local client は記録を消せる。 外部公開する実装へ同じ route を
  持ち込む場合は、認可なしで監査記録を消せる経路になる

## 推奨テスト構成

`bootAdapterServer()` が mock adapter を載せた server を port 0 で立てる。
`page.goto(origin)` で同じ origin に置いてから `fetch` を投げる。

**op を投げる順序が結果に効く。** 記録は積み上がるため、`/metrics` を読む前に
何を何回投げたかで期待値が決まる。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | 5 op の巡回 | 5 op の成功 trace が揃う |
| 2 | 標本の数 | `latencySamplesMs` が op の数と一致する |
| 3 | trace の数と成否 | 5 件すべてが `ok: true` |
| 4 | metric の内訳 | 4 つの counter が期待値になる |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-E2E-001 | 5 op を 1 巡した後の記録が期待どおり積み上がる | mock adapter を載せた server と、その origin に置いた page | `/wal-full-journey` → `/fts5-full-journey` → `/edge-roundtrip` → `/testcontainers-probe` → `/emit-fidelity` を既定の入力で順に投げ、`/metrics` と `/traces` を読む | `emit` が `ok===true`。 `walJourneySteps===4`、`fts5JourneySteps===4`、`edgeInvocations>0`、`testcontainersProbes===1`、`latencySamplesMs.length===5`。 trace が 5 件で全件 `ok===true` | P0 | yes | node | `/wal-full-journey` `/fts5-full-journey` `/edge-roundtrip` `/testcontainers-probe` `/emit-fidelity` `/metrics` `/traces` |

## 既存 test との対応

- 探索した runtime — `typescript`
- 探索した path — `examples/dogfood-sqlite-wal-fts-app/` 配下の `*.test.ts` / `*.test.tsx` / `*.spec.ts` / `*.spec.tsx` (`node_modules` は除外)。 実在したのは `tests/` と `tests/e2e/` の 2 dir
- 見つけた既存 test — 43 件 (`describe` / `it` / `test`)

| TC | 既存 test の候補 | 判定 |
|---|---|---|
| T-E2E-001 | `T-E2E-001 emit-fidelity + metrics + traces routes return the full mock surface` (`examples/dogfood-sqlite-wal-fts-app/tests/e2e/emit-fidelity-flow.spec.ts:32`) | 既覆 (候補) |

## 自動化すべきテスト

既覆 (候補)。

- T-E2E-001 (P0) — 5 op を既定の入力で 1 巡してから `/metrics` と `/traces` を読み、記録が期待どおり積み上がることを確かめる happy path

**`latencySamplesMs.length===5` と `trace.length===5` が、この test の要**になる。
この assert が示すのは、各 endpoint が返した snapshot の観測時点で 5 件ずつだったこと。
`/metrics` が後続の `/traces` に trace を増やす実装なら検出できるが、1 回ずつしか読まないため、
反復しても増えないことや `/traces` 自身が snapshot 作成後に記録しないことまでは保証しない。

`edgeInvocations` だけ `>0` の範囲 assert で、値を固定していない。 既定の `requests` は 10 なので
10 になるが、既定が変わっても落ちない。 **単位が他と違うことを示す唯一の値なので、
固定した方が意図が伝わる。**

**この 1 件が覆っていない主要な範囲**。 いずれも同じ経路から到達できる。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| `/reset` の効果 | できる | 投げていない |
| 失敗した op の trace (`ok: false`) | できる | 正常系だけを投げている |
| `edgeInvocations` の具体値 | できる | 範囲でしか見ていない |
| 同じ op を 2 回投げた時の増分 | できる | 各 op を 1 回ずつしか投げていない |
| `metrics` / `traces` を複数回読んでも増えないこと | できる | 1 回ずつしか読んでいない |

## 手動確認でよいテスト

(なし)

## 不足している仕様

(なし)
