---
name: kiwa-gap
description: |
  カバレッジと実行時間の「未達」 を安い順に並べて返す調査 skill。
  生成側の skill が Step の最後に本 skill を呼び、次に埋めるべき 1 件を得る。
  `--metric coverage` は未実行 statement / 未通過 branch / 未呼出 function を 100% までの残り量で並べ、
  `--metric duration` は遅い test を lever (何をすれば速くなるか) 別に分類する。
  判定も修正も行わず、並べて返すだけ。 判定は既存 gate、修正は生成 skill、仕分けは /kiwa-verdict が担う。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write
---

# /kiwa-gap — 未達を安い順に並べる調査 skill

`coverage-high-water.json` の ratchet は単調性を保証する = 一度上げた値は下がらない。
つまり **毎回 1 歩でも進めれば必ず 100% に着く**構造は既にある。

足りていなかったのは「次にどこを埋めるか」 を返すものだけで、無いために実測で
ratchet 登録 25 package のうち 20 package が 100% 未満で止まっていた。

実行時間側は仕組みが 1 つも無かった。 `/kiwa-observe` の dashboard に表示があるだけで、
baseline も回帰判定も無かった。

**判定は今も持たない**。 wall time の絶対値は同じ code で 6 倍振れるため gate を作れない
(Issue #2196)。 順位と lever 別の偏りだけが負荷に依らず保たれるので、そこを返す。

## 前提

- `--metric coverage` は `<pkg>/coverage/coverage-final.json` を読む。 無い package は
  「測っていない」 として別枠に出す (「gap 0 件」 と同じ形にしない)
- `--metric duration` は vitest の `--reporter=json` 出力を要求する。 本 skill は test を
  走らせない = 測る役と読む役を分ける
- coverage の行番号は **target による**。 `.vitest-dist` を作る 38 件 (主に `test:cov` を持つ
  package) では compile 後の行番号になり、`tsconfig.vitest.json` が sourceMap を出さないため
  source の行に正確には戻せない (file path だけ戻す)。 作らない target では source の行番号が
  そのまま出る。 どちらかに決め打たず、その target が作るかで分岐する
  (`_shared/references/test-execution.md § 5` SSOT)

## ユーザーのリクエスト

$ARGUMENTS

## オプション

- `--metric {coverage|duration}` — 何の未達を並べるか (省略時は `coverage`)
- `--package {path}` — 1 package に絞る (`--metric coverage` のみ、例 `packages/auth`)
- `--report {path}` — vitest の json report (`--metric duration` では必須)
- `--json` — 機械可読な JSON で出す (省略時は Markdown)
- `--out {path}` — report file の書き出し先 (省略時は `tests/reports/gap/gap-{target}[-{pkg}].md`)

## 実行フロー

### Step 1 — target を確定する

引数から `--metric` を読む。 省略時は `coverage`。

`duration` を選んだ場合、`--report` が無ければ **止める**。 report を作る手順を案内して終了する。

```bash
cd tests/release-smoke
npx vitest run tests --exclude '**/.vitest-dist/**' --environment node --testTimeout 30000 \
  --reporter=json --outputFile=../../.context/scratch/rs-report.json
```

**`.vitest-dist` を走らせない**。 `tests/release-smoke` は `.vitest-dist` を作り直す script を
持たないので、そこにあるのは #2205 以前の残骸になる (実測で 5 件が source より古く、
3 件は copy が存在しなかった)。 走らせると新しい検査を 0 件として数え、古い copy の所要を
今の値として報告する。 契約は `_shared/references/test-execution.md § 2` が SSOT。

**`--report` を推測で埋めない**。 古い report を黙って読むと「もう速い」 と誤報する。

### Step 2 — gap を取る

```bash
node scripts/coverage-gap-report.mjs --json
node scripts/duration-gap-report.mjs --report <path> --json
```

script が非 0 で終わったら **その理由をそのまま報告して止める**。 空の結果を「未達なし」 と
読み替えない。

### Step 3 — 読み方を添える

出力をそのまま貼らない。 次の 3 点を書く。

| 項目 | coverage | duration |
|---|---|---|
| 総量 | 残り件数と対象 package 数 | 合計秒数と file 数 |
| 偏り | 上位 3 package が全体の何割か | lever 別の合計 (どの lever が支配的か) |
| 次の 1 件 | 一番安い file と、その中の行番号 | 一番重い file と、その lever の直し方 |

**偏りを必ず書く**。 実測で `tests/release-smoke` は 164.6 秒のうち 131.1 秒 (80%) が
`subprocess` lever に集中していた。 並べただけでは「32 file 直す」 に見えるが、
偏りを見れば「子プロセス起動を畳む」 の 1 手に絞れる。

### Step 4 — report を Write する

`--out` (省略時は `tests/reports/gap/gap-{target}[-{pkg}].md`) に Markdown を書く。

dir が無ければ `mkdir -p` する。 既存 file は上書きする = gap は現時点の状態で、
履歴は git が持つ。

### Step 5 — 呼出元に返す

`/kiwa-loop` から呼ばれた場合は JSON をそのまま返す。 単体起動の場合は Step 3 の 3 点を
応答に書く。

## lever の一覧 (`--metric duration`)

実測から起こした。 遅さの出所が違えば直し方が違うので、遅い順に並べるだけでは足りない。

| lever | 判定材料 | 直し方 |
|---|---|---|
| `real-io` | `testcontainers` / `playwright` / `@viem/anvil` の import、`GenericContainer` / `createAnvil` / `chromium.launch` の呼出 | container / anvil / browser を共有 fixture へ寄せる |
| `subprocess` | `node:child_process` の import、`spawnSync` / `execFileSync` / `execSync` / `execFile(` の呼出 | 1 回に畳むか module を in-process で import する |
| `compile` | `typescript` の import、`createSourceFile` / `createProgram` / `transpileModule` の呼出 | 1 度だけ parse して結果を共有する |
| `wall-clock` | `setTimeout` / `setInterval` / `sleep` / `delay` の呼出 (`useFakeTimers` があれば除外) | fake timer に置き換える |
| `filesystem` | `mkdtempSync` / `mkdirSync` / `writeFileSync` / `readdirSync` の呼出 | 一時 dir を 1 つ共有して中身だけ差し替える |
| `inherent` | 上のどれにも当たらない | 出所が読み取れない。 実測して budget に計上するか個別に調べる |

判定は **module 指定子と呼出** で行い、comment を落としてから見る。 生の文字列一致にすると
comment 内の言及で誤判定する (実測で `mutation-gate-coverage.test.ts` が playwright を
1 度も使わずに `real-io` に分類された。 出現箇所は説明の comment 2 行だけだった)。

`inherent` は `unknown` ではない。 「分類できなかった」 を「直し方が無い」 と読ませないため、
対処のある lever と対処を決めていない file を名前で区別する。

## 呼出は 1 行に書く

生成 skill の完了条件に `/kiwa-gap` の呼出を書く時は、**呼出名から option まで 1 物理行**に
収める。 折り返すと `skill-gap-wiring.test.ts` の T-SKG-013 が offender として報告する。

```
- `/kiwa-gap --metric coverage --package {pkg}` を実行し、…    ← よい
- `/kiwa-gap`
  `--metric coverage --package {pkg}` を実行し、…              ← 落ちる
```

複数行にまたがる呼出を解析する形は採らない。 Markdown の code span / fence / 表 cell /
箇条書きの継続行がそれぞれ違う畳まれ方をし、静的に「同じ呼出の続き」 を判定する手が
定まらないため。 1 行に収める制約は書き手が守れるので、判定を単純に保つ。

## 出力 path 早見

| target | 出力 path |
|---|---|
| coverage (全 package) | `tests/reports/gap/gap-coverage.md` |
| coverage (1 package) | `tests/reports/gap/gap-coverage-{pkg}.md` |
| duration | `tests/reports/gap/gap-duration.md` |

## 責務外

- **判定しない**。 coverage の gate は `scripts/check-coverage-gates.mjs` の責務。
  duration には gate が無い (絶対値が振れるため、Issue #2196)
- **埋めない**。 test を書くのは生成 skill (`/kiwa-vitest` / `/kiwa-forge` 等)
- **仕分けない**。 埋まらなかったものの分類は `/kiwa-verdict`
- **実装を消さない**。 dead code の判定も削除も行わない
- **閾値を変えない**。 `THRESHOLDS` (90/80) と `MARGIN` (30%) は script 側の SSOT

## 完了条件

- `--metric` が `coverage` / `duration` のいずれかに確定している
- `--metric duration` で `--report` を推測で埋めていない (無ければ止めて手順を案内した)
- script が非 0 で終わった場合、その理由をそのまま報告して止めた
- 応答に「総量」「偏り」「次の 1 件」 の 3 点が書かれている
- report file が `--out` (または既定 path) に Write 済
- `coverage-high-water.json` を書き換えていない

## references

- `references/loop-stop-conditions.md` — ループの停止条件と 4 分類 (`/kiwa-loop` / `/kiwa-verdict` 共用 SSOT)

## 関連

- 下流 = `/kiwa-loop` が毎 round 本 skill を呼ぶ
- 下流 = `/kiwa-verdict` が本 skill の出力を仕分ける
- 実装 = `scripts/coverage-gap-report.mjs` / `scripts/duration-gap-report.mjs`
- 検査 = `tests/release-smoke/tests/coverage-gap-report.test.ts` (17 件) /
  `tests/release-smoke/tests/duration-gap-report.test.ts` (22 件)
- 起点 = Issue #2193
