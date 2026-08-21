# test-spec-reorg-4scenario (e2e-generic layer)

chain の巻き戻し (reorg) が dApp の画面と node の状態にどう出るかを、
**実 anvil に対して**確かめる。

他の e2e-generic example と違い、**mock adapter を HTTP の口として立てない**。
Playwright の fixture が実 anvil (port 8557) に繋ぎ、`snapshotChain` / `revertChain` で
実際に chain を巻き戻す。 画面も Next.js の実 page を開く。

- module: reorg-4scenario
- layer: e2e-generic

## 対象機能

| 対象 | 実体 |
|---|---|
| 4 つの筋書き | `src/adapters/interface.ts` の `pendingTx` / `confirmedTx` / `transferEvent` / `nonceGap` |
| mock 実装 | `src/adapters/mock.ts` |
| 一括実行 | `src/flows/scenarios.ts` の `runAllScenarios` |
| e2e の巻き戻し | `@kiwa-lab/dapp` の `snapshotChain` / `revertChain` |

**e2e は adapter を通らない**。 `tests/e2e/reorg-4scenario.spec.ts` は viem の
`publicClient` / `walletClient` を直接使い、adapter の 4 op は単体テストが検証する。

## 仕様の要約

### 4 つの op が返す形は共通

`ReorgScenarioResult` は `op` と `before` / `after` を持つ。

| field | 型 |
|---|---|
| `before.balance` / `after.balance` | `bigint` |
| `before.logCount` / `after.logCount` | `number` |
| `before.nonce` / `after.nonce` | `number` |
| `after.txStatus` | `'pending'` / `'confirmed'` / `'dropped'` / `'unknown'` |

`before` に `txStatus` は無い。

### mock は 4 op のうち 1 つだけ状態を変える

**実測した値** (初期残高 `1000000000000000000000000n`)。

| op | `after.balance` | `after.logCount` | `after.nonce` | `after.txStatus` |
|---|---|---|---|---|
| `pendingTx` | 変わらず | 0 | 0 | `dropped` |
| `confirmedTx` | 変わらず | 0 | 0 | `dropped` |
| `transferEvent` | 変わらず | 0 | 0 | `dropped` |
| `nonceGap` | **`999989000000000000000000n`** | **1** | **1** | **`confirmed`** |

前 3 つは「巻き戻して元に戻った」 ことを `before` と `after` の一致で表す。
`nonceGap` だけは「巻き戻した後に再送して確定した」 ので状態が進む。

### `reset()` は何もしない

`src/adapters/mock.ts` の `reset: async () => {}` が空実装。 **実測でも
`reset()` の前後で `metrics()` の呼出回数と latency 標本が変わらなかった**。

`interface.ts` の `reset()` には doc comment が無く、何を戻すべきかが書かれていない。

### `metrics()` は 4 つの呼出回数と latency の標本を持つ

実測で 4 op を 1 度ずつ呼ぶと `pendingTxInvocations` から `nonceGapInvocations` まで
すべて 1 になり、`latencySamplesMs` に 4 件積まれた。

`metrics()` は内部の配列を copy して返す (`latencySamplesMs: [...metrics.latencySamplesMs]`)
ので、呼出側が書き換えても内部に影響しない。

### `runAllScenarios` は 4 op を宣言順に回す

実測で `pendingTx` → `confirmedTx` → `transferEvent` → `nonceGap` の順に
4 件の結果が返った。

## 主な品質リスク

- **e2e が adapter を通らない**。 `tests/e2e/` は viem の client を直接使うため、
  `src/adapters/` の 4 op は e2e から 1 度も呼ばれない。 mock と実 chain の
  振る舞いが食い違っても e2e では気付けない
- **`reset()` が何もしない**。 空実装なので、test が `reset()` で状態を戻すつもりでも
  戻らない。 何を戻すべきかが `interface.ts` に書かれていない
- **前 3 つの op が同じ観測を返す**。 `pendingTx` / `confirmedTx` / `transferEvent` は
  mock ではどれも「状態が変わらず `dropped`」 になるため、応答から 3 つを区別できない
  (`op` field を見るしかない)
- **実 anvil の port が固定**。 fixture は 8557 を決め打ちするため、
  他の process が使っていると衝突する
- **per-test の `stop` が空**。 fixture の `_anvilHandle.stop` は `async () => {}` なので、
  各 test の終了時には anvil を止めず、同じ process と chain state を共有する。 suite 終了時は
  `tests/global-teardown.ts` が PID file を使って anvil を止める

## 推奨テスト構成

`tests/fixture.ts` が `@kiwa-lab/dapp` の `dappE2eTest` を拡張し、
port 8557 の anvil に繋ぐ。 実 anvil が要る。

**巻き戻しは `snapshotChain` → 変更 → `revertChain` の 3 段**で行う。
`revertChain` は真偽値を返し、成功で `true`。

画面は Next.js の実 page を開く (`page.goto('/')`)。 warmup は `networkidle`、
4 scenario は wallet 接続・RPC idle・`sender-balance` の load 完了を待ってから
`data-testid` を読む。

## テスト観点一覧

| # | 観点 | 対象 |
|---|---|---|
| 1 | 画面が描画される | warmup |
| 2 | 未確定 tx を巻き戻し後に明示的に落とせる | `getTransaction` が `null` |
| 3 | 確定 tx の chain 残高が戻り、巻き戻し後に開いた画面へ反映される | `balanceOf` / `sender-balance` |
| 4 | Transfer log が戻り、巻き戻し後に開いた画面へ件数が反映される | `getLogs` / `past-transfers-count` |
| 5 | 巻き戻し後の nonce から別の tx を 1 件確定できる | `getTransactionCount` |

## テストケース一覧

| ID | Observation | Given | When | Then | Priority | Automation | Mode | Route |
|---|---|---|---|---|---|---|---|---|
| T-DR-000 | 画面が接続済みになる | 実 anvil (port 8557) と Next.js の page | `page.goto('/')` して `networkidle` と RPC idle を待つ | `connection-status` が `status: connected` になる | P2 | yes | ssr | `/` |
| T-DR-001 | 未確定 tx を明示的に落とす | 同上 | `snapshotChain` → 未確定 tx を送る → `revertChain` → `anvil_dropTransaction` → automine を戻して 1 block 掘る | drop 前は `hash` が一致し `blockNumber` が `null`。 `revertChain` が `true`。 明示的な drop 後は `getTransaction` が `null` | P0 | yes | ssr | `/` |
| T-DR-002 | 確定 tx の残高を巻き戻す | 同上 | `snapshotChain` → 100 単位を transfer して確定 → `revertChain` → page を開く | 確定時は `receipt.status==='success'` で残高が 100 減る。 `revertChain` が `true`。 chain の残高が元に戻り、巻き戻し後に開いた画面の `sender-balance` が元の値を表示する | P0 | yes | ssr | `/` |
| T-DR-003 | Transfer log を巻き戻す | 同上 | `snapshotChain` → transfer を 3 件 → `revertChain` → page を開く | 途中の `getLogs` が `countBefore + 3`。 `revertChain` が `true`。 chain の log 数が `countBefore` に戻り、巻き戻し後に開いた画面の `past-transfers-count` が `countBefore` を表示する | P0 | yes | ssr | `/` |
| T-DR-004 | 巻き戻し後に別の tx を確定する | 同上 | `snapshotChain` → tx を送る → `revertChain` → 別の tx を送る | `revertChain` が `true`。 巻き戻し後の nonce が `nonceBefore`。 2 件目は `receipt.status==='success'` で `hash` が 1 件目と異なり、最終 nonce が `nonceBefore + 1` | P0 | yes | ssr | `/` |

## 既存 test との対応

- 探索した runtime — `typescript`
- 探索した path — `examples/dogfood-dapp-e2e-reorg/` 配下の `*.test.ts` / `*.test.tsx` / `*.spec.ts` / `*.spec.tsx` (`node_modules` / `.next` / `.turbo` / `dist` / `.vitest-dist` は除外)。 実在したのは `tests/e2e/` と `tests/unit/` の 2 dir
- 探索した test file — 5 件

| TC | 既存 test の候補 | 判定 |
|---|---|---|
| T-DR-000 | `T-DR-000 warmup page render` (`examples/dogfood-dapp-e2e-reorg/tests/e2e/reorg-4scenario.spec.ts:151`) | 既覆 (候補) |
| T-DR-001 | `T-DR-001 pending tx → reorg → dropped` (`examples/dogfood-dapp-e2e-reorg/tests/e2e/reorg-4scenario.spec.ts:159`) | 既覆 (候補) |
| T-DR-002 | `T-DR-002 confirmed tx → reorg → balance rollback` (`examples/dogfood-dapp-e2e-reorg/tests/e2e/reorg-4scenario.spec.ts:222`) | 既覆 (候補) |
| T-DR-003 | `T-DR-003 Transfer event → reorg → history disappears + refetch` (`examples/dogfood-dapp-e2e-reorg/tests/e2e/reorg-4scenario.spec.ts:285`) | 既覆 (候補) |
| T-DR-004 | `T-DR-004 nonce gap → mempool re-send` (`examples/dogfood-dapp-e2e-reorg/tests/e2e/reorg-4scenario.spec.ts:344`) | 既覆 (候補) |

## 自動化すべきテスト

既覆 (候補)。

- T-DR-000 (P2) — 画面が描画されることを確かめる warmup
- T-DR-001 (P0) — 未確定 tx を巻き戻し後に明示的に落とせることを確かめる
- T-DR-002 (P0) — 確定 tx の残高が巻き戻り、後から開いた画面が元の値を表示することを確かめる
- T-DR-003 (P0) — Transfer log が巻き戻り、後から開いた画面が元の件数を表示することを確かめる
- T-DR-004 (P0) — 巻き戻し後の nonce から別の tx が 1 件確定することを確かめる

**5 件とも実 anvil と実 page を使う**。 他の e2e-generic example が mock adapter を
HTTP の口として立てるのと違い、この example は chain の実挙動そのものを見る。

**この 5 件が覆っていない範囲**。

| 覆っていないもの | 到達 | 理由 |
|---|---|---|
| `src/adapters/` の 4 op | できる | e2e は viem の client を直接使い adapter を通らない (単体テストが担う) |
| `runAllScenarios` の並び | できる | 同上 |
| `metrics()` の値 | できる | 同上 |
| `reset()` が何もしないこと | できる | 同上 |
| mock と実 chain の食い違い | できる | 現在は両者を同じ test で突き合わせる観測点が無い。 e2e から mock adapter も呼び、同じ 4 op の観測値を比較する test を追加すれば到達できる |

到達できない項目は無い。 現在は mock の振る舞いを `tests/unit/mock-scenarios.test.ts` が、
実 adapter の skip 経路を `tests/unit/real-adapter.test.ts` が別々に確かめるだけで、
mock と実 anvil の観測値を直接比較する test は無い。

## 手動確認でよいテスト

(なし)

## 不足している仕様

- `reset()` が何を戻すかが決まっていない。 `interface.ts` の宣言に doc comment が無く、
  mock は空実装 (`async () => {}`) なので chain の状態も `metrics()` も戻らない。
  test が状態を戻す手段として使えるのかどうかが書かれていない
- mock の `pendingTx` / `confirmedTx` / `transferEvent` が同じ観測を返してよいかが
  決まっていない。 3 つとも「状態が変わらず `dropped`」 になるため、
  `op` field を見ない限り応答から区別できない
