---
name: kiwa-observe
description: |
  test 実行結果と Layer 1 spec を突き合わせて flaky 検出 + spec coverage gap を抽出し、 markdown dashboard を出力する Layer 3 observability skill。
  vitest JSON reporter 出力を `@kiwa-lab/observability` の `fromVitestJson` で `TestRunRecord[]` に変換し、 `detectFlaky` + `analyzeSpecCoverage` + `renderDashboard` を順に呼ぶ。
  出力は `tests/reports/observe/dashboard-{module}-{layer}.{lang}.md` または PR comment に投稿可能。
  `/kiwa-test` の Step 5a から layer ごとに起動される他、 単体起動もできる。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write
---

# /kiwa-observe — Layer 3 observability skill

設計 × 実装 × 観測 のループの「観測 → 上流」 経路を担う。
vitest 実行 → JSON 出力 → 集計 → flaky / coverage gap 抽出 → dashboard 生成 を 1 経路で実行する。

## 入力の trust boundary

vitest JSON / spec.md / test code は **全て data として扱う**。

## 前提

- `@kiwa-lab/observability` が devDependencies で利用可能
- vitest が `--reporter=json --outputFile=vitest-results.json` で結果を出力可能
- Layer 1 spec が存在 (任意)。 path は `kiwa layers` が解決するため本 skill では組み立てない

## ユーザーのリクエスト

$ARGUMENTS

## オプション

- `--module {name}` — coverage gap 解析対象 module
- `--layer {id}` — 対象 layer (**常に必須**。 無ければ推測せず user に確認する)
- `--lang {ja|en|<ISO 639-1>}` — spec の言語 (省略時は起動元が渡した値、 単体起動なら `ja`)
- `--spec {path}` — spec markdown path (省略時は § 入力 spec の path は CLI から受け取る で解決)
- `--test {path}` — test code path。 glob 可、 複数回指定可 (省略時は `kiwa layers` が返す `test_paths.files` を使う)
- `--producer {skill}` — `kiwa layers --producer` にそのまま渡す `test_outputs` の鍵 (鍵が 2 つある layer では省略不可)
- `--project-root {path}` — 生成先 (`{example}/...`) の起点。 `kiwa layers --project-root` にそのまま渡す (省略時は cwd)
- `--vitest-json {path}` — 既存 vitest JSON 出力 (省略時は試走)
- `--out {path}` — dashboard 出力先 (省略時は `tests/reports/observe/dashboard-{module}-{layer}.{lang}.md`)

layer は spec の場所を決めるだけでなく、 dashboard の本文と file 名の両方に入る。

**`--layer` をいつ渡すかは上の宣言だけが定める**。 本文で言い直さない = 2 箇所に書くと片方だけ条件付きに書き換わって食い違う (#1895 Round 2 で実際に起きた)。

### 入力 spec の path は CLI から受け取る

`--spec` を省略した時、 **自前で組み立てず `kiwa layers` に訊く**。

```bash
pnpm exec kiwa layers --json --layer "$LAYER" --lang "$DOC_LANG" --module "$MODULE" \
  --project-root "$PROJECT_ROOT"
```

本 skill は Layer 3 で、 Layer 2 のように扱う layer が決まっていない。 **どの layer の spec と突き合わせるかは `--layer` で受け取る**。 `docs/layers.json` が宣言する id をそのまま渡す。

layer が違えば spec dir も suffix も違うため、 別 layer の spec を読んで coverage gap を計算すると「仕様に無い test がある」 と「test が無い仕様がある」 が両方まとめて誤検出になる。 取り違えの害が大きいので、 渡され方は § オプション の宣言に従う。

返る `spec_path` は言語と module 名まで解決済 (`packages/cli/src/detect/layers.ts` の `withLangSuffix` / `withModule`)。 skill 側で `sed` を挟まない = module 名に separator が入ると path が spec directory の外を指す (`test-spec-../../etc/passwd.ui.md` を実測)。 CLI が `[a-z0-9-]` 1-32 字を強制して弾く。

`$DOC_LANG` は skill 引数の `--lang`。 **`LANG` を使わない** = shell の locale 変数で `ja_JP.UTF-8` 等が入っており、 CLI が ISO 639-1 でないとして拒否する。 `--lang` 省略時の既定は起動元が渡した値、 単体起動なら `ja`。

`$MODULE` は skill 引数の `--module`。 必須で、 推測しない。

`$PROJECT_ROOT` は skill 引数の `--project-root` (省略時は `.`)。 **返る `spec_path` はこれを起点にする**ため、 省くと example 配下の spec を repo root から探すことになる。

#### 2 つの path は起点が違う

**`spec_path` は `--project-root` 起点、 `test_paths.files` は cwd 起点**。 同じ応答の中で基準が分かれているので、 同列に「返った値を Read する」 と読むと spec だけ外す。

| field | 起点 | Read する時 |
|---|---|---|
| `spec_path` | `--project-root` (省略時は cwd) | `$PROJECT_ROOT` を前置して開く |
| `test_paths.patterns` / `test_paths.files` | cwd | そのまま開く |

CLI 側は `spec_path` に lang と module しか差し込まず (`applyLang`)、 `test_paths` だけ `relativeTo(cwd, join(projectRoot, …))` で cwd 基準に直している。 宣言の出所が `docs/layers.json` と生成先で違うためで、 揃える先は skill ではなく CLI にあるが、 **読む側が起点を知らないまま使うと必ず外す** (`skills/kiwa-review/SKILL.md` § 2 つの path は起点が違う SSOT)。

実測 (cwd = repo root、 data layer / module `orders` / `examples/queue-poc`)。 応答は下の検証表を全行 pass するが、 そのまま `spec_path` を開くと `No such file or directory` になる。


#### test code の path も同じ CLI が返す

`--test` を省略した時、 **同じ呼出に `--producer` と `--project-root` を足して `test_paths` を受け取る**。 skill 側で組み立てない。

```bash
pnpm exec kiwa layers --json --layer "$LAYER" --lang "$DOC_LANG" --module "$MODULE" \
  --producer "$PRODUCER" --project-root "$PROJECT_ROOT"
```

返る `test_paths` の中身。

| field | 内容 |
|---|---|
| `producer` | 実際に読んだ `test_outputs` の鍵 |
| `anchor` | `project` (生成先) / `fixtures` (退避先) / `null` (どちらも 0 件) |
| `patterns` | 探した先。 0 件だった時に「どこを見たか」 を user に返すために使う |
| `files` | 読む file の全件。 そのまま `TEST_PATHS` に入れる |

**skill 側で glob しない**。 `files` は既に match した実 file で、 生成先と退避先のどちらを採るか、 placeholder をどう埋めるか、 起点の外を指す宣言をどう扱うかも CLI が決めている (`packages/cli/src/detect/layers.ts` の `resolveTestPaths`)。

**match した file を全て読んで連結する** = `analyzeSpecCoverage` は test code を 1 つの文字列として受けるため、 先頭 1 件だけ読むと残りの test が gap に出る。

この解決を本 file が 5 段の手順として持っていた間、 2 つの欠陥が 8 round の review を通り抜けた (#1896)。 退避済 example では必ず 0 件になる規則と、 `{example}` を repo root 相対に解決して存在しない path を作る規則で、 どちらも markdown の review では見えない。 CLI へ寄せて 4 状態 (生成先のみ / 退避先のみ / 両方 / どちらも無し) の test で塞いだ (#1899)。

`$PRODUCER` は skill 引数の `--producer`。 鍵が 2 つある layer は実測で `contract` の 1 つだけで、 そこでは CLI が省略を拒否する。 **`consumer_skill` を鍵として使わない**。 `contract` の `consumer_skill` は常に `kiwa-forge` で、 `kiwa-hardhat` は `also_consumed_by` 側にある。 `consumer_skill` で引くと、 Hardhat で走らせた時も Foundry の `.t.sol` を観測しようとして 0 件 match になる。 CLI も同じ理由で fallback を持たないので、 どちらを観測するかを知っている呼出側が `--producer` で渡す。

`$PROJECT_ROOT` は skill 引数の `--project-root`。 `{example}/...` の起点で、 `/kiwa-test` は `examples/{example}`、 `/kiwa-app` は利用者 project の root を渡す。 省略時は cwd。

**cwd と同じ値を渡した時、 CLI は `tests/fixtures/...` を候補にしない**。 そこは kiwa repo 内部の場所で、 利用者 project にたまたま同名の dir があるとそちらを読むことになる。

単体起動で起点が判らない時は **`--test` を明示して渡してもらう**。 推測すると、 存在しない dir を探して「観測対象が無い」 と報告することになる (#1896 で実測)。

**`--test` は CLI を通らない**。 起点の外を指す値の拒否も、 symlink を辿らない照合も、 matcher 構文の検査も `kiwa layers` 側にあるため、 明示した path はそのまま Read される。 渡す値の妥当性は渡した側が持つ = **推測した値を `--test` に入れて検査を省く経路として使わない**。 起点が判るなら `--project-root` を渡して CLI に解決させる。

#### 解決に失敗したら止める

**exit code を見る。 0 でなければ中断して user に返す**。 pipeline で握り潰すと、 空 path を Read しようとして「spec が無い」 と報告することになり、 本当の原因 (layer 名の誤り / 不正な module / CLI 未 install) が消える。

判定は **件数ではなく「必要な layer が取れたか」**で行う。 `--layer` を省くと 30 件返るので、 件数で判定すると全 layer を一度に解決する経路が「異常」 に落ちる。

**「読める」 と「期待した形をしている」 を分ける**。 JSON として parse できることは、 中身が使える形だと言っていない。

| 結果 | 扱い |
|---|---|
| exit != 0 | stderr をそのまま user に返して中断 |
| stdout が JSON として読めない | 中断 (CLI 未 install / 別 command の出力) |
| `layers` が配列でない | 中断 (応答が壊れている) |
| 必要な `id` が `layers` に無い | layer 名が誤り。 中断 |
| 同じ `id` が 2 件以上ある | どちらを使うか決められない。 中断 |
| その layer の `spec_path` が文字列でない、 または空 | spec を持たないか応答が壊れている。 中断 |
| `spec_path` に `{module}` が残っている | `--module` が効いていない。 中断 |
| `test_paths.files` が空 | 観測対象が存在しない。 中断。 理由に `test_paths.patterns` を添える |
| `$PROJECT_ROOT` を前置した path に file が無い | spec が未生成か `--project-root` が誤り。 **開いた path をそのまま添えて中断** |
| 上記いずれでもない | `spec_path` を `$PROJECT_ROOT` 起点で、 `test_paths.files` を cwd 起点で開く |

「解決先に file が無い」 行を置くのは、 **上の全行を pass した応答でも Read が落ちる**から。 検査が「応答の形」 までで止まっていると、 起点違いも spec 未生成も同じ「spec が無い」 に潰れる。

鍵の選択 (`--producer` の要否 / 宣言に無い鍵) と起点の妥当性 (`--project-root` が無い dir / cwd の外) は CLI が非 0 で返すため、 1 行目の exit code 判定で捕まる。 skill 側で二重に判定しない。

`.layers[] | select(.id == "<layer>")` で先に絞ってから、 取れた 1 件を見る。

`jq` が無い環境では `--json` の出力をそのまま読む。 `jq` は整形の手段であって、 解決の一部ではない。

#### 解決した値の使い先

本 skill は下流を持たない (Layer 3 の終端で、 dashboard を書いて終わる)。 解決した値は Step 1 の `SPEC_PATH` と `TEST_PATHS` にそのまま入れる。

`--out` を省略した時の出力先は `tests/reports/observe/dashboard-{module}-{layer}.{lang}.md`。 **layer を名前に含める** = 含めないと、 呼出側が複数 layer を続けて観測した時に最後の 1 枚しか残らない。 `tests/reports/` 配下は `kiwa layers` が解決する先ではないので、 この path は本 skill が組み立てる。

**同じ layer を 2 つの producer で観測する時は呼出側が `--out` を明示する**。 既定は layer までしか区別しないため、 `contract` を Foundry と Hardhat の両方で観測すると 2 枚目が 1 枚目を上書きする。 producer を既定に混ぜないのは、 鍵が 2 つある layer が `contract` の 1 つだけで、 残り 19 layer の file 名に常に冗長な語が付くため。

自前で suffix を組むと 2 経路になり、 CLI 側の規約が変わった時に取り残される。 `--lang ja` を付けると Layer 1 が書いた file を Layer 2 が探せなかったのがこの形 (#1855 / #1861)。

本 SKILL.md 内の spec path 表記は説明のための例示で、 解決の指示ではない。

## 実行フロー

### Step 0: vitest を JSON で走らせる

**観測対象の project に範囲を絞る**。 絞る先は `--project-root` と同じ値で、 これは観測対象の
起点として既に受け取っている。

```bash
pnpm exec vitest run --root "$PROJECT_ROOT" --passWithNoTests \
  --exclude '**/node_modules/**' --exclude '**/.vitest-dist/**' \
  --reporter=json --outputFile=tests/reports/vitest-results.json
```

**build 出力を除く**。 例の多くは `tsc -p tsconfig.vitest.json` で `.vitest-dist/` に
compile してからそこだけを走らせる。 その残骸が消えていないと、 本 command は
**source (`tests/*.tsx`) と compiled (`.vitest-dist/tests/*.js`) の両方を収集して同じ test を
2 回数える** (実測で 19 件が 38 件になった)。

例自身の `test` script は毎回 `rmSync` してから走らせるので二重にならない。 本 skill は
別経路から起動するため、 残骸を拾う側になる。

`--exclude` を渡すと既定値を置き換えるため、 `node_modules` も併せて明示する。

`--outputFile` は **`--root` からの相対** で解決される。 repo root からの相対で書くと
`$PROJECT_ROOT/$PROJECT_ROOT/tests/...` に書かれる (実測)。 Step 1 は
`$PROJECT_ROOT/tests/reports/vitest-results.json` を読む。

**`--passWithNoTests` を外さない**。 vitest は test file が 1 件も無いと **exit 1** で終わる
(実測)。 runner が vitest でない layer では 0 件が正常なので、 それを失敗にすると観測が
そこで止まる。 JSON 自体は 0 件の形で書かれるため、 続行して dashboard に「実行結果を
1 件も受け取っていない」 と書かせる。

`--vitest-json` 引数指定時は **Step 0 を走らせず**、 渡された path をそのまま読む。 読み先は
1 箇所に決める = Step 0 が書く先と Step 1 が読む先が別々に決まると、 前 run の結果を読んで
「観測した」 ことになる。

```text
VITEST_JSON = --vitest-json が渡っていればその値
              渡っていなければ $PROJECT_ROOT/tests/reports/vitest-results.json
```

#### 絞らないと観測対象の外を集める

chain は本 skill を repo root から起動する (`/kiwa-test` Step 5a が `--project-root examples/{example}`
を渡す)。 そこで範囲を絞らずに vitest を走らせると、 **monorepo 全体から test を集める**。

実測すると repo root では 332 件を収集し、 その後 `tests/fixtures/*/hardhat-test/*.cjs` を読み込んで
`HardhatError: HH1: You are not inside a Hardhat project.` で停止する (#1914)。

**失敗するより、 失敗しない方が危ない**。 集まるのは別 package の test なので、 dashboard の
Summary が観測対象ではないものの pass / fail を報告することになる。 #1909 で直した「表示が実態を
表さない」 形が別経路で戻る。

`--root` を渡した時の収集は、 その project の vitest 設定が決める。 実測では
`examples/dogfood-dapp-e2e-reorg` が `tests/unit/**/*.test.ts` だけを集め、 同居する Playwright の
`*.spec.ts` は拾わなかった。

#### 環境は project の config が持つ

**`--environment` を本 command で組み立てない**。 project が DOM を要するかは project の性質で、
観測側が知っている値ではない。

宣言が `package.json` の `test` script (`--environment jsdom`) だけに置かれていると、
本 command は既定の `node` で走らせて **全件失敗する**。 dashboard はそれを実測値として
`pass rate 0.0%` と報告するため、 **実装が壊れたのか観測の起動が誤っているのか読み分けられない**
(`examples/react-component-poc` で実測、 16 件全滅)。

対処は観測側ではなく project 側にある。 環境を要する project は `vitest.config.ts` に
`environment` を書く。 script の CLI 引数は config に優先するため、 script 側を残しても
挙動は変わらない。

file ごとに環境が違う project (`examples/full-stack-poc` が該当、 1 file だけ jsdom) は
config の 1 値で表せない。 その形は `--vitest-json` に project 自身の run 結果を渡す。

#### runner が vitest でない layer

`contract` の runner は Foundry (`forge test`) か Hardhat で、 vitest ではない。 その project に
vitest の設定は無く、 範囲を絞った run は **record 0 件** を返す (`--passWithNoTests` を付けて
exit 0、 実測)。 それ自体は異常ではないので観測を止めない =
spec coverage は runner に依存せず (spec markdown と test code の突き合わせ)、 contract でも
機能する。

record 0 件は dashboard 側が「実行結果を 1 件も受け取っていない」 と書く。 **`pass rate` は
出さない** (#1909 以前は 0 件でも `100.0%` と出ており、 走らせていない状態と全部通った状態が
同じ表示だった)。

flaky も同じ。 chain は history を持ち越さないため run は常に 1 回で、 `minRuns` に届く test は
**どの layer でも無い**。 dashboard は「判定していない」 と書く = 「flaky が無い」 とは書かない。

### Step 1: dashboard 生成 script を生成

**script は repo の中に書く**。 置き場所は `<repo>/.context/scratch/` (git 追跡外)。

Node は import を **script file の場所** から解決する (cwd ではない)。 repo の外 (harness の
scratchpad 等) に書くと、 repo の `node_modules` に届かず 1 行目で
`ERR_MODULE_NOT_FOUND: Cannot find package '@kiwa-lab/observability'` になる (#1915 で実測)。

`@kiwa-lab/observability` は repo root が devDependency として宣言しているので、 repo 内の
script なら解決できる。

```ts
import {
  analyzeSpecCoverage,
  collectRunHistory,
  detectFlaky,
  fromVitestJson,
  renderDashboard,
} from '@kiwa-lab/observability';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname } from 'node:path';

/**
 * 過去の run を読む。 **壊れていたら止める**。
 *
 * 空から数え直すと、 判定に届かない状態が「まだ 3 回に達していない」 と区別できず、
 * 毎回そう見える (#1909 / #1910 と同じ「静かな緑」)。 file を 1 つ消せば復旧できるので、
 * 止めても行き止まりにならない。
 */
async function readHistory(path) {
  let raw;
  try {
    raw = await readFile(path, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return { records: [] }; // 初回。 これは正常
    throw err;
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    // 素の SyntaxError には file 名が入らない。 どの file を消せばよいか判らないと、
    // 「止める」 が行き止まりになる。
    throw new Error(`history が JSON として読めない: ${path} (${err.message})`);
  }
  if (!Array.isArray(parsed?.records)) {
    throw new Error(`history が壊れている (records が配列でない): ${path}`);
  }
  // 要素の形も見る。 配列でありさえすればよいとすると、 中身が壊れた history が
  // そのまま判定材料になる。
  const broken = parsed.records.find(
    (r) =>
      typeof r?.testId !== 'string' ||
      typeof r?.runId !== 'string' ||
      typeof r?.status !== 'string',
  );
  if (broken) {
    throw new Error(`history の record が壊れている: ${path} (${JSON.stringify(broken)})`);
  }
  return parsed;
}

// 読み先は § Step 0 の VITEST_JSON 規則で決める (--vitest-json があればその値、
// 無ければ Step 0 が --root の下に書いた path)。
const reportRaw = await readFile(VITEST_JSON, 'utf8');
const report = JSON.parse(reportRaw);

// runId は **run ごとに一意で、 同じ report からは常に同じ値** にする。 GIT_SHA だと同じ
// commit で 3 回走らせても同じ値になり、 flaky を見たい時こそ重複除去が効かない。 逆に
// Date.now() だと同じ report を 2 度観測するたびに別 run になり、 1 run が 2 run に化ける。
// startTime が無い report は中身の hash を使う (#1918)。
// vitest の reporter は常に startTime を出す (実測)。 fallback は vitest 以外が作った
// JSON 用で、 **file の中身が同じなら同じ id** という保証しか持たない。 意味が同じで
// 表記が違う report (property 順 / 空白) は別 id になる。
//
// 意味で正規化する案は採らない。 結果が同じ 2 つの run が同じ id になり、 3 回走らせても
// 1 run に畳まれて **flaky が永久に判定されない** = 直そうとしている欠陥そのものに戻る
// (Round 2 F1 への回答)。
const runId = report.startTime
  ? String(report.startTime)
  : createHash('sha1').update(reportRaw).digest('hex').slice(0, 12);
const records = fromVitestJson(report, { runId });

// 過去の run を読む。 これが無いと同じ test の run は常に 1 回で、 minRuns に届かず
// flaky は永久に判定されない (#1918)。
//
// **path に入る値を検証する**。 MODULE / LAYER をそのまま埋めると、 separator を含む値で
// 起点の外に書ける。 CLI が弾くのは spec path 経路だけで、 ここは通らない。
for (const [name, value] of [['MODULE', MODULE], ['LAYER', LAYER], ['PRODUCER', PRODUCER ?? '']]) {
  if (value && !/^[a-z0-9-]{1,64}$/.test(value)) {
    throw new Error(`${name} が history の file 名に使えない形: ${value}`);
  }
}
// producer が 2 つある layer (contract の forge / hardhat) は別の成果物を観測するので、
// history も分ける。 混ぜると別 producer の run が同じ testId で数えられる。
const HISTORY_KEY = [MODULE, LAYER, PRODUCER].filter(Boolean).join('-');
const HISTORY_PATH = `${PROJECT_ROOT}/tests/reports/observe/history-${HISTORY_KEY}.json`;
const previous = await readHistory(HISTORY_PATH);

// 同じ report を 2 度観測しても 2 run にしない (`--vitest-json` で再利用する経路がある)。
// 同じ run の中に同じ testId が 2 度出る形 (retry / 同名 test) も 1 件に畳む = 畳まないと
// 1 run が複数 run として数えられる。
const key = (r) => `${r.testId}\u0000${r.runId}`;
const recorded = new Set(previous.records.map(key));

// 同じ run の中に同じ testId が 2 度出る形 (retry) は **後の結果を採る**。 先頭を残すと
// retry の最終結果が落ちて、 直った test を失敗として数える (Round 2 F2)。
//
// 畳み込みは **Summary と history の共通入力** にする。 history 側だけに掛けると、
// Summary が両 attempt を数えて pass rate 50% と出る = その run の最終結果を表さない
// (Round 3 F2-R3)。 Map は同じ key で後勝ちし、 挿入順を保つ。
const current = [...new Map(records.map((r) => [key(r), r])).values()];

// 既に history にある run は足さない (`--vitest-json` で同じ report を再利用する経路)。
const fresh = current.filter((r) => !recorded.has(key(r)));

const history = collectRunHistory({ history: previous, records: fresh, maxPerTest: 20 });
await mkdir(dirname(HISTORY_PATH), { recursive: true });
await writeFile(HISTORY_PATH, JSON.stringify(history), 'utf8');
// minRuns は detectFlaky と renderDashboard の両方に渡す。 表示側が「判定した上で
// 無い」 と「判定していない」 を分けるのに同じ値を要る (#1909)。
const FLAKY_MIN_RUNS = 3;
const flaky = detectFlaky({ history, minRuns: FLAKY_MIN_RUNS, threshold: 0.1 });

const specMd = await readFile(SPEC_PATH, 'utf8');
// TEST_PATHS は解決した glob が match した全 file。 1 件だけ読むと、 残りの
// test が「spec にあるが test が無い」 として gap に出る。
const testCode = (await Promise.all(TEST_PATHS.map((p) => readFile(p, 'utf8')))).join('\n');
// MODULE を渡す。 省くと spec 側から読めなかった時に module が空文字になり、
// どの module の dashboard か判らなくなる (実測、 #1896)。
//
// defaultLayer は 8 値しか受けない。 docs/layers.json の 20 layer のうち
// 12 は渡せないので、 allowlist に入る時だけ渡す。 型に合わない値を渡すと
// 解析側が落ちる。
const ANALYSER_LAYERS = ['contract', 'unit', 'integration', 'e2e', 'api', 'ui', 'data', 'cli'];
const gaps = [
  analyzeSpecCoverage({
    specMarkdown: specMd,
    testCode,
    module: MODULE,
    ...(ANALYSER_LAYERS.includes(LAYER) ? { defaultLayer: LAYER } : {}),
  }),
];
// 表示に使う layer を差し替える。 renderDashboard は gaps[].layer を
// `### module (layer)` に出すため、 解析側の値のままだと allowlist 外の
// 12 layer が全て `unit` と表示される (#1898 Round 2)。
const displayGaps = gaps.map((g) => ({ ...g, layer: LAYER }));

// Summary は **この run** を数える。 累積を渡すと、 この run が 0 件でも過去の record で
// pass rate が出て、 走らせていない状態が成功に見える (#1909 で禁じた形)。 flaky の判定
// 材料だけ累積側を渡す。
const dashboard = renderDashboard({
  history: { records: current },
  flakyHistory: history,
  flaky,
  gaps: displayGaps,
  flakyMinRuns: FLAKY_MIN_RUNS,
});
await mkdir(dirname(OUT_PATH), { recursive: true });
await writeFile(OUT_PATH, dashboard, 'utf8');
console.log(`dashboard written to ${OUT_PATH}`);
```

`defaultLayer` が受けるのは 8 値 (`contract` / `unit` / `integration` / `e2e` / `api` / `ui` / `data` / `cli`) だけで、 `docs/layers.json` は 20 layer を宣言する。 **差の 12 layer では `defaultLayer` を渡さない**。 型に合わない値を渡すと解析側が落ちる。

渡せなかった時 `gaps[0].layer` は既定の `unit` になる。 したがって **dashboard の本文には常に `--layer` の値をそのまま書く**。 解析側の値を表示に使うと、 12 layer の観測が全て `unit` と表示される。

| `--layer` の値 | `defaultLayer` | dashboard 本文の表示 |
|---|---|---|
| 8 値のいずれか | 渡す | `--layer` の値 |
| 残り 12 | 渡さない | `--layer` の値 (解析側は `unit` のまま) |

#### run 履歴は観測対象ごとに持ち越す

flaky は 1 回の run では判定できない。 `detectFlaky` は同じ test の run が `minRuns` (既定 3)
に届いて初めて判定するため、 **history を持ち越さないと永久に「判定していない」 になる** (#1918)。

| 項目 | 値 |
|---|---|
| 置き場所 | `$PROJECT_ROOT/tests/reports/observe/history-{module}-{layer}[-{producer}].json` |
| 分け方 | module / layer / producer ごと。 混ぜると別の成果物の run が同じ id で数えられる (`contract` は forge と hardhat の 2 producer を持つ) |
| file 名に入る値 | `[a-z0-9-]{1,64}` を強制。 separator を含む値で起点の外に書けないようにする |
| 上限 | `maxPerTest: 20` (FIFO)。 古い run から落ちる |
| 初回 (file なし) | 空から始める。 これは正常 |
| **壊れている時** | **止める**。 空から数え直さない。 message に file path を出す |

**Summary は「この run」、 flaky の判定材料は「累積」**。 累積を Summary に渡すと、 この run が
0 件でも過去の record で `pass rate` が出て、 走らせていない状態が成功に見える (#1909 で禁じた
形)。 `renderDashboard` は `history` を Summary に、 `flakyHistory` を判定材料に使う。

**上限は test ごと**。 廃止された testId の record は残り続ける (試験数 × 20 で頭打ちになるが、
test を消しても減らない)。 実害が出た時点で別途扱う。

壊れた時に空へ倒すと、 判定に届かない状態が「まだ 3 回に達していない」 と区別できず、 毎回
そう見える (#1909 / #1910 と同じ「静かな緑」)。 file を 1 つ消せば復旧できるので、 止めても
行き止まりにならない。

`runId` は **run ごとに一意で、 同じ report からは常に同じ値** にする。 `GIT_SHA` だと同じ
commit で 3 回走らせても同じ値になり、 **flaky を見たい時こそ** 重複除去が効かない。 逆に
`Date.now()` だと同じ report を 2 度観測するたびに別 run になり、 1 run が 2 run に化ける。
vitest report の `startTime` を使い、 無い report は中身の hash を使う。

同じ report を 2 度観測しても 2 run に数えない (`--vitest-json` で再利用する経路がある)。
`(testId, runId)` が既に history にある record は足さない。 **同じ run の中に同じ testId が
2 度出る形** (retry / 同名 test) も 1 件に畳む = 畳まないと 1 run が複数 run として数えられる。

#### 空の結果と「gap が無い」 を混同しない

`analyzeSpecCoverage` は spec の case 表から `T-XXX-NNN` 形式の ID を読む。 **読めない spec では `missingTcIds` も `extraTcIds` も空になり、 「gap 0 件」 と区別が付かない**。

実測すると `tests/spec/contract/test-spec-mint-nft.ja.md` は `TC-001` 形式で、 解析側は 0 件と返した (#1896)。

したがって **spec の case 件数が 0 なら、 dashboard に「解析できなかった」 と書く**。 「gap 無し」 と書かない。

### Step 2: 結果サマリを user に提示

dashboard 内の `Summary` / `Flaky tests` / `Spec coverage gaps` を一覧する。
gap が 0 でなければ「missing TC を test 化」 / 「extra TC を spec に追加」 のアクションを提案する。

## 完了条件

- vitest 実行が成功 (failure があっても dashboard は生成する)
- dashboard markdown が指定 path に Write 済
- gap / flaky が検出された場合は対応提案を user に提示

## references

- `@kiwa-lab/observability` API ... `packages/observability/README.md`
