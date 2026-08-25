---
name: kiwa-plan-run
description: |
  sweep を回す前に機械を測り、その日の `--jobs` と理由を返す計画 skill。
  コア数だけで決めると外れる (swap 95% / load 24 の機械で `--jobs 4` は 3-4 倍遅くなった) ため、
  swap / メモリ余力 / load / docker / 直列車線の床を見て決める。
  計画を返すだけで sweep は回さない。 測れなかった値は「余裕がある」 ではなく 1 に倒す。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read
---

# /kiwa-plan-run — 今日の `--jobs` を機械から決める

`pnpm test:all` の `--jobs` は固定値で決められない。
同じ 12 コアの機械でも、swap が空いている時と 95% 埋まっている時では最適値が違う。

実測 = swap 95% / load 24 の状態で `--jobs 4` を回したところ、
`examples/nextjs-bridge` が 49.6 秒 → 195.9 秒 (3.9 倍) になった。

本 skill は測って決めるところまでを担い、**sweep は回さない**。
計画だけ見たい場合 (今日は何並列が妥当か) と、回す場合を分けるため。

## 実行

```bash
node --input-type=module -e "
const m = await import('$(git rev-parse --show-toplevel)/scripts/lib/run-plan.mjs');
const lanes = ['packages/orm','packages/e2e','packages/ui','examples/full-stack-poc',
  'examples/orm-prisma-mysql-poc','examples/orm-prisma-postgres-poc',
  'examples/orm-drizzle-mysql-poc','examples/orm-drizzle-postgres-poc',
  'examples/dogfood-oauth21-provider','examples/dogfood-oidc-federation'];
const snap = m.measure({ repoRoot: process.cwd(), serialLaneDirs: lanes });
const plan = m.planJobs(snap);
console.log('pnpm test:all -- --jobs ' + plan.jobs);
console.log(plan.reason);
"
```

出力は 2 行。 1 行目が打つべき command、2 行目がその根拠。

```
pnpm test:all -- --jobs 1
swap が上限 (swap 94% 使用) → 1。 他: cores 10 / memory 8 / load 4 / floor 12
```

**理由を必ず出す**。 黙って決めると、遅かった時に機械のせいか設定のせいか読み手が分けられない。

## 何を見て決めるか

判定は `scripts/lib/run-plan.mjs` が SSOT。 各入力が独立した上限を出し、**最も低いものが採用される**。

| 入力 | 上限の出し方 |
|---|---|
| 論理コア | `cores - 2` (OS と sweep 自身の分を残す) |
| メモリ余力 | `vm_stat` の free + inactive + speculative を 1 target 1.5GB で割る |
| swap 使用率 | 80% 以上で 1、50% 以上でコア数の半分 |
| load average (1 分) | `cores - load1` |
| 直列車線の合計 | free 車線 ÷ 直列車線 (これ以上は壁時計が縮まない) |

docker daemon の可否は **数値を変えない**。 落ちていれば docker 車線が blocked になるだけなので、理由に書くに留める。

### メモリは swap を主指標にする

同じ瞬間に 4 つの指標が食い違う。

| 指標 | 値 | 読み |
|---|---|---|
| `os.freemem()` | 1.59GB | 危機的に見える |
| `vm_stat` の free + inactive + speculative | 15.1GB | 余裕に見える |
| `memory_pressure -Q` | free 60% | 余裕に見える |
| `sysctl vm.swapusage` | 22.5GB 中 21.4GB 使用 | **危機的** |

`os.freemem()` は再利用可能な inactive を数えず、`memory_pressure` は圧縮を勘定に入れるので
swap が溢れていても余裕に見える。 **swap が主指標で、メモリ余力は「何件入るか」 の上限**。

### 測れなかった値は 1 に倒す

「測れなかった」 は「余裕がある」 ではない。
逐次で回す代償は数分だが、載らない機械で 8 並列にすると sweep が逐次より遅くなり、
結果が code ではなく競合を表す。

**床だけは例外**。 これは「これ以上上げても無駄」 を表すだけで危険を表さないので、
測れなければ cap を適用せずその旨を理由に書く。

床の入力は過去の sweep log (`.context/scratch/sweep/jobs-*.log`) から読む。
**verdict 行 (`green: N ...`) が無い log は読まない** = 途中で止まった run は短い測定ではなく
別の測定で、実測では 79/166 で止まった log が 12 秒の「直列車線」 を返し、
機械が許す 12 倍の並列度を通すところだった。

## `test-all.mjs` の既定は動かさない

`--jobs` の既定は `1` のまま。

自動判定を script の既定にすると **同じ command が機械の状態で違う挙動をする**。
sweep の結果を過去の run と比べられなくなるので、script は言われた通りに動く層のままにして、
判断はこの skill が持つ。

## `/kiwa-loop` との合流

`/kiwa-loop` の各周回が sweep を回す時、本 skill を通して `--jobs` を決める。
ループは「測る → 一番安い 1 件を埋める → 再測」 を回すので、周回ごとに機械の状態が変わりうる。

## 責務外

| 対象 | 持ち主 |
|---|---|
| sweep の実行 | `scripts/test-all.mjs` |
| カバレッジの判定とループ | `/kiwa-gap` と `/kiwa-loop` |
| 実行中の資源記録 | `scripts/measure-sweep-vitals.sh` |
| 遅い target を速くすること | 個別の PR |

## 関連

- 判定の SSOT = `scripts/lib/run-plan.mjs`
- 検査 = `tests/release-smoke/tests/run-plan.test.ts`
- test 実行の契約 = `_shared/references/test-execution.md`
- 直列車線の実測 = `docs/quality/test-parallelism.md`
