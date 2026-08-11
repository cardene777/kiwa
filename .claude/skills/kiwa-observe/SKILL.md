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
- `--test {path}` — test code path。 glob 可、 複数回指定可 (省略時は同節で `test_outputs` から解決)
- `--producer {skill}` — `--test` を解決する時に見る `test_outputs` の鍵 (省略時は同節の規則で決める)
- `--vitest-json {path}` — 既存 vitest JSON 出力 (省略時は試走)
- `--out {path}` — dashboard 出力先 (省略時は `tests/reports/observe/dashboard-{module}-{layer}.{lang}.md`)

layer は spec の場所を決めるだけでなく、 dashboard の本文と file 名の両方に入る。

**`--layer` をいつ渡すかは上の宣言だけが定める**。 本文で言い直さない = 2 箇所に書くと片方だけ条件付きに書き換わって食い違う (#1895 Round 2 で実際に起きた)。

### 入力 spec の path は CLI から受け取る

`--spec` を省略した時、 **自前で組み立てず `kiwa layers` に訊く**。

```bash
kiwa layers --json --layer "$LAYER" --lang "$DOC_LANG" --module "$MODULE"
```

本 skill は Layer 3 で、 Layer 2 のように扱う layer が決まっていない。 **どの layer の spec と突き合わせるかは `--layer` で受け取る**。 `docs/layers.json` が宣言する id をそのまま渡す。

layer が違えば spec dir も suffix も違うため、 別 layer の spec を読んで coverage gap を計算すると「仕様に無い test がある」 と「test が無い仕様がある」 が両方まとめて誤検出になる。 取り違えの害が大きいので、 渡され方は § オプション の宣言に従う。

返る `spec_path` は言語と module 名まで解決済 (`packages/cli/src/detect/layers.ts` の `withLangSuffix` / `withModule`)。 skill 側で `sed` を挟まない = module 名に separator が入ると path が spec directory の外を指す (`test-spec-../../etc/passwd.ui.md` を実測)。 CLI が `[a-z0-9-]` 1-32 字を強制して弾く。

`$DOC_LANG` は skill 引数の `--lang`。 **`LANG` を使わない** = shell の locale 変数で `ja_JP.UTF-8` 等が入っており、 CLI が ISO 639-1 でないとして拒否する。 `--lang` 省略時の既定は起動元が渡した値、 単体起動なら `ja`。

`$MODULE` は skill 引数の `--module`。 必須で、 推測しない。

#### test code の path も同じ応答から取る

`--test` を省略した時、 **同じ応答の `test_outputs` から取る**。 `--module` から推測しない = 推測は spec path で 1 度直した経路 (#1861) と同じ形で、 生成先の宣言は `docs/layers.json` にあり CLI がそれを返している。

解決は 5 段で、 **順序が意味を持つ**。

##### 1. 鍵を 1 つ選ぶ

`test_outputs` は **producer skill ごとに鍵が分かれる**。 実測すると鍵が 2 つある layer は `contract` の 1 つだけで、 残りは 1 つ。

| 鍵の数 | 選び方 |
|---|---|
| 1 つ | その鍵を使う |
| 2 つ以上 | `--producer` の値を使う。 **無ければ中断する** |

**`consumer_skill` を鍵として使わない**。 `contract` の `consumer_skill` は常に `kiwa-forge` で、 `kiwa-hardhat` は `also_consumed_by` 側にある。 `consumer_skill` で引くと、 Hardhat で走らせた時も Foundry の `.t.sol` を観測しようとして 0 件 match になる。

どちらを観測するかを知っているのは呼出側だけなので、 `--producer` で受ける。

##### 2. 2 形のうち存在する方を採る

選んだ鍵の配列には **同じ test の移動前と移動後** が並ぶ。 `docs/layers.json` の `$comment` がその理由の SSOT で、 `/kiwa-test` の Step 5.5 が `examples/` から `tests/fixtures/` へ移すため、 同じ test は **移動が走ったかで 2 箇所のどちらかにある**。

| 形 | 例 | いつ存在するか |
|---|---|---|
| 生成先 | `{example}/test/*.t.sol` | 移動前 (同一 chain 内で Step 5.5 に到達する前) |
| 退避先 | `tests/fixtures/{example}/contract-test/{Contract}.t.sol` | 移動後 (既存 example に再実行する時) |

**片方を落とさない**。 落とすと、 その状態に無い側を選んだ時に必ず 0 件 match で中断する。 実測すると `mint-nft` は移動済で、 生成先だけを採る規則では 0 件、 退避先を含めると 1 件だった (#1896)。

優先順位は 1 つだけ。 **両方が存在する時は生成先を採る** = 同一 chain 内ではそちらが実際に走ったもので、 退避先はまだ前回の複製が残っているだけのことがある。

##### 3. 残った pattern を全て使う

**1 つ選ばない**。 `a11y` は `{module}.test.tsx` と `{module}.spec.ts` の 2 pattern を宣言しており、 片方だけ取ると実在する test が coverage gap として誤検出される (実測で該当は `a11y` の 1 layer)。

##### 4. placeholder を解決して安全性を確かめる

`{module}` は `$MODULE` に、 `{Contract}` は対象 contract 名に解決する。 決まらなければ `*` にする。

**`{example}` の基準は呼出側が持つ**。 2 形で起点が違い、 生成先は `--target` の作業 dir 起点、 退避先は project root 起点になる。

| 呼出側 | 生成先の起点 | 例 |
|---|---|---|
| `/kiwa-test` (kiwa repo の `examples/` を回す) | `examples/{example}` | `examples/mint-nft/test/*.t.sol` |
| `/kiwa-app` (利用者 project) | project root (`.`) | `test/*.t.sol` |

退避先 (`tests/fixtures/...`) は kiwa repo 内部の場所なので、 どちらの呼出側でも project root 起点で `{example}` を `$MODULE` に解決する。

単体起動で基準が判らない時は **`--test` を明示して渡してもらう**。 推測すると、 存在しない dir を glob して「観測対象が無い」 と報告することになる (#1896 で実測)。

解決後、 **project root 配下に収まることを確かめる**。 収まらない値は落とす。

| 条件 | 扱い |
|---|---|
| 絶対 path で始まる | 落とす |
| `..` を含む | 落とす |
| 正規化して project root の外を指す | 落とす |
| 上記いずれでもない | 使う |

`test_outputs` は宣言なので通常は project 相対だが、 **誤記や改変でこの前提は崩れる**。 崩れた時に読むのは観測対象でない file になる。

##### 5. glob して連結する

各 pattern を glob し、 結果を flatten して重複を除く。 **match した file を全て読んで連結する** = `analyzeSpecCoverage` は test code を 1 つの文字列として受けるため、 先頭 1 件だけ読むと残りの test が gap に出る。

全 pattern 合わせて 0 件 match は中断する (観測対象が無い)。

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
| `test_outputs` の鍵が 2 つ以上あり `--producer` が無い | どちらを観測するか決められない。 中断 |
| `--producer` の値が `test_outputs` の鍵に無い | 同上。 中断 |
| 鍵の下の配列が空 | 観測対象を決められない。 中断 |
| 安全性の確認で全 pattern が落ちた | 同上。 中断 |
| 生成先と退避先の **両方** が 0 件 match | 観測対象が存在しない。 中断 |
| 上記いずれでもない | その `spec_path` と `test_outputs` を使う |

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
// MODULE と LAYER を渡す。 省くと spec 側から読めなかった時に module が空文字、
// layer が既定の `unit` になり、 どの層を観測した dashboard か判らなくなる
// (実測 = contract layer の観測が `layer: unit` と記録された、 #1896)。
const gaps = [
  analyzeSpecCoverage({ specMarkdown: specMd, testCode, module: MODULE, defaultLayer: LAYER }),
];

const dashboard = renderDashboard({ history, flaky, gaps });
await mkdir(dirname(OUT_PATH), { recursive: true });
await writeFile(OUT_PATH, dashboard, 'utf8');
console.log(`dashboard written to ${OUT_PATH}`);
```

`LAYER` に渡せるのは `analyzeSpecCoverage` の `defaultLayer` が受ける 8 値 (`contract` / `unit` / `integration` / `e2e` / `api` / `ui` / `data` / `cli`) だけ。 `docs/layers.json` の 20 layer はこれより多いので、 **受けない値なら渡さず、 dashboard の本文に layer 名を書く**。 型に合わない値を渡すと解析側が落ちる。

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
