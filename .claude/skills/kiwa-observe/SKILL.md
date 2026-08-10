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
- `--layer {id}` — 対象 layer (`--spec` を省略した時に path を解決するため必須)
- `--lang {ja|en|<ISO 639-1>}` — spec の言語 (省略時は起動元が渡した値、 単体起動なら `ja`)
- `--spec {path}` — spec markdown path (省略時は § 入力 spec の path は CLI から受け取る で解決)
- `--test {path}` — test code path。 glob 可 (省略時は同節で `test_outputs` から解決)
- `--vitest-json {path}` — 既存 vitest JSON 出力 (省略時は試走)
- `--out {path}` — dashboard 出力先 (省略時は `tests/reports/observe/dashboard-{module}-{layer}.{lang}.md`)

### 入力 spec の path は CLI から受け取る

`--spec` を省略した時、 **自前で組み立てず `kiwa layers` に訊く**。

```bash
kiwa layers --json --layer "$LAYER" --lang "$DOC_LANG" --module "$MODULE"
```

本 skill は Layer 3 で、 Layer 2 のように扱う layer が決まっていない。 **どの layer の spec と突き合わせるかは `--layer` で受け取る**。 `docs/layers.json` が宣言する id をそのまま渡す。

**`--layer` が無く `--spec` も無い時は推測せず user に確認する**。 layer が違えば spec dir も suffix も違うため、 別 layer の spec を読んで coverage gap を計算すると「仕様に無い test がある」 と「test が無い仕様がある」 が両方まとめて誤検出になる。

返る `spec_path` は言語と module 名まで解決済 (`packages/cli/src/detect/layers.ts` の `withLangSuffix` / `withModule`)。 skill 側で `sed` を挟まない = module 名に separator が入ると path が spec directory の外を指す (`test-spec-../../etc/passwd.ui.md` を実測)。 CLI が `[a-z0-9-]` 1-32 字を強制して弾く。

`$DOC_LANG` は skill 引数の `--lang`。 **`LANG` を使わない** = shell の locale 変数で `ja_JP.UTF-8` 等が入っており、 CLI が ISO 639-1 でないとして拒否する。 `--lang` 省略時の既定は起動元が渡した値、 単体起動なら `ja`。

`$MODULE` は skill 引数の `--module`。 必須で、 推測しない。

#### test code の path も同じ応答から取る

`--test` を省略した時、 **同じ応答の `test_outputs` から取る**。 `--module` から推測しない = 推測は spec path で 1 度直した経路 (#1861) と同じ形で、 生成先の宣言は `docs/layers.json` にあり CLI がそれを返している。

`test_outputs` は **consumer skill ごとに鍵が分かれる**。 その layer の `consumer_skill` の値を使い、 `also_consumed_by` の分は使わない = 同じ layer でも成果物が違う (`contract` は `kiwa-forge` が `.t.sol` を、 `kiwa-hardhat` が `.test.ts` を書く)。 どちらを観測するかは呼出側が `--test` で明示する。

値は 2 形あり、 **`tests/fixtures/` で始まらない方** を使う。

| 形 | 例 | 扱い |
|---|---|---|
| project 起点 | `{example}/test/*.t.sol` | **使う**。 実際に走った test |
| kiwa 内部の fixture | `tests/fixtures/{example}/contract-test/{Contract}.t.sol` | 使わない。 実行後に複製されたもの |

`{example}` は `$MODULE` に、 `{module}` も `$MODULE` に解決する。 `{Contract}` は対象 contract 名で、 決まらなければ glob (`*`) のままにする。

**値が glob の時は match した file を全て読んで連結する**。 `analyzeSpecCoverage` は test code を 1 つの文字列として受けるため、 先頭 1 件だけ読むと残りの test が「spec にあるが test が無い」 として gap に出る。 0 件 match は中断する (観測対象が無い)。

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
| `test_outputs` にその layer の `consumer_skill` の鍵が無い | 観測対象を決められない。 中断 |
| 鍵の下に `tests/fixtures/` 以外の値が無い | 同上。 中断 |
| 解決した `--test` が 1 file も match しない | 観測対象が存在しない。 中断 |
| 上記いずれでもない | その `spec_path` と `test_outputs` を使う |

`.layers[] | select(.id == "<layer>")` で先に絞ってから、 取れた 1 件を見る。

`jq` が無い環境では `--json` の出力をそのまま読む。 `jq` は整形の手段であって、 解決の一部ではない。

#### 解決した値の使い先

本 skill は下流を持たない (Layer 3 の終端で、 dashboard を書いて終わる)。 解決した値は Step 1 の `SPEC_PATH` と `TEST_PATHS` にそのまま入れる。

`--out` を省略した時の出力先は `tests/reports/observe/dashboard-{module}-{layer}.{lang}.md`。 **layer を名前に含める** = 含めないと、 呼出側が複数 layer を続けて観測した時に最後の 1 枚しか残らない。 `tests/reports/` 配下は `kiwa layers` が解決する先ではないので、 この path は本 skill が組み立てる。

自前で suffix を組むと 2 経路になり、 CLI 側の規約が変わった時に取り残される。 `--lang ja` を付けると Layer 1 が書いた file を Layer 2 が探せなかったのがこの形 (#1855 / #1861)。

本 SKILL.md 内の spec path 表記は説明のための例示で、 解決の指示ではない。

## 実行フロー

### Step 0: vitest を JSON で走らせる

```bash
pnpm exec vitest run --reporter=json --outputFile=tests/reports/vitest-results.json
```

`--vitest-json` 引数指定時は既存 file を再利用する。

### Step 1: dashboard 生成 script を生成

```ts
import {
  analyzeSpecCoverage,
  collectRunHistory,
  detectFlaky,
  fromVitestJson,
  renderDashboard,
} from '@kiwa-lab/observability';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const report = JSON.parse(await readFile('tests/reports/vitest-results.json', 'utf8'));
const records = fromVitestJson(report, { runId: process.env.GIT_SHA ?? 'local' });
const history = collectRunHistory({ records, maxPerTest: 20 });
const flaky = detectFlaky({ history, minRuns: 3, threshold: 0.1 });

const specMd = await readFile(SPEC_PATH, 'utf8');
// TEST_PATHS は解決した glob が match した全 file。 1 件だけ読むと、 残りの
// test が「spec にあるが test が無い」 として gap に出る。
const testCode = (await Promise.all(TEST_PATHS.map((p) => readFile(p, 'utf8')))).join('\n');
const gaps = [analyzeSpecCoverage({ specMarkdown: specMd, testCode })];

const dashboard = renderDashboard({ history, flaky, gaps });
await mkdir(dirname(OUT_PATH), { recursive: true });
await writeFile(OUT_PATH, dashboard, 'utf8');
console.log(`dashboard written to ${OUT_PATH}`);
```

### Step 2: 結果サマリを user に提示

dashboard 内の `Summary` / `Flaky tests` / `Spec coverage gaps` を一覧する。
gap が 0 でなければ「missing TC を test 化」 / 「extra TC を spec に追加」 のアクションを提案する。

## 完了条件

- vitest 実行が成功 (failure があっても dashboard は生成する)
- dashboard markdown が指定 path に Write 済
- gap / flaky が検出された場合は対応提案を user に提示

## references

- `@kiwa-lab/observability` API ... `packages/observability/README.md`
