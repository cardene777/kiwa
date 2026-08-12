---
name: kiwa-forge
description: |
  /kiwa-design (Layer 1) が出力した `tests/spec/contract/test-spec-{module}.md` を入力に、 Foundry の `test/*.t.sol` を Write して `forge test` で動作確認する Layer 2 contract test skill。
  11 観点 (正常系 / 異常系 / 境界値 / 状態遷移 / 権限 / 入力バリデーション / 冪等性 / 並行処理 / 性能 / セキュリティ / 回帰) を forge の helper (fuzz / invariant / vm.prank / vm.expectRevert / vm.warp / forge --gas-report) に変換し、 `forge coverage` で line coverage 評価まで一気通貫。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-forge — Layer 2 Foundry contract test skill

`/kiwa-design` (Layer 1) が出力した仕様書を Foundry の `test/*.t.sol` に変換し、 `forge test` で動作確認、 `forge coverage` で line coverage を評価する。

`/kiwa-design --layer contract` で生成した spec を消費する経路、 もしくは既存 contract に対し直接適用する経路の 2 種を提供。

## 前提

- Foundry インストール済 (`forge --version` で確認、 未導入なら `curl -L https://foundry.paradigm.xyz | bash && foundryup`)
- 対象 contract が `contracts/` 配下に存在 (`foundry.toml` の `src` 設定経由でも可)
- `forge build` が PASS する状態

## ユーザーのリクエスト

$ARGUMENTS

## オプション

- `--module {name}` — Layer 1 spec の module 名。 path は § 入力 spec の path は CLI から受け取る で解決する
- `--spec-path {path}` — Layer 1 spec の path を明示 (`--module` の代替)
- `--contract {name}` — 対象 contract 名 (省略時は spec の「対象機能」section から推定)
- `--gas-report` — `forge test --gas-report` で gas 測定込みで実行
- `--coverage-threshold {N}` — `forge coverage` の全 metric 共通 threshold (default 100%、 production target のみ評価対象)
- `--coverage-lines {N}` / `--coverage-statements {N}` / `--coverage-branches {N}` / `--coverage-funcs {N}` — metric 別 threshold override (指定時は `--coverage-threshold` より優先)
- `--lang {ja|en|<ISO 639-1>}` — spec の言語と coverage report の生成言語 (省略時は起動元が渡した値、 単体起動なら `ja`)
- `--no-tests` — `forge test` 実行をスキップ (Write のみ、 dry-run 用途)
- `--no-review` — Step 6 の kiwa-review 自動呼出 (test-review) を skip (CI / 自動化用)

### 入力 spec の path は CLI から受け取る

`--spec-path` を省略した時、 **自前で組み立てず `kiwa layers` に訊く**。 本 skill が扱う layer は `contract` の 1 つ。

```bash
pnpm exec kiwa layers --json --layer contract --lang "$DOC_LANG" --module "$MODULE"
```

返る `spec_path` は言語と module 名まで解決済 (`packages/cli/src/detect/layers.ts` の `withLangSuffix` / `withModule`)。 skill 側で `sed` を挟まない = module 名に separator が入ると path が spec directory の外を指す (`test-spec-../../etc/passwd.ui.md` を実測)。 CLI が `[a-z0-9-]` 1-32 字を強制して弾く。

`$DOC_LANG` は skill 引数の `--lang`。 **`LANG` を使わない** = shell の locale 変数で `ja_JP.UTF-8` 等が入っており、 CLI が ISO 639-1 でないとして拒否する。 `--lang` 省略時の既定は起動元が渡した値、 単体起動なら `ja`。

`$MODULE` は skill 引数の `--module`。 必須で、 推測しない。

`kiwa-hardhat` は同じ `contract` layer を消費する。 runner が違うだけで spec は 1 つなので、 `/kiwa-test --runner both` の経路では両 skill が同じ path を受け取る。

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
| 上記いずれでもない | その `spec_path` を使う |

`.layers[] | select(.id == "<layer>")` で先に絞ってから、 取れた 1 件を見る。

`jq` が無い環境では `--json` の出力をそのまま読む。 `jq` は整形の手段であって、 解決の一部ではない。

#### 解決した値を下流に渡す

Step の最後で `/kiwa-review` を呼ぶ時、 **同じ layer と同じ `--lang` を渡す**。 渡さないと review が別の spec を読み、 生成した test と突き合わせる相手が変わる。

自前で suffix を組むと 2 経路になり、 CLI 側の規約が変わった時に取り残される。 `--lang ja` を付けると Layer 1 が書いた file を Layer 2 が探せなかったのがこの形 (#1855 / #1861)。

本 SKILL.md 内の spec path 表記は説明のための例示で、 解決の指示ではない。

## 実行フロー

5 段階で Layer 1 spec → `.t.sol` → 実行 → 評価まで進む。

### Step 0: 文書生成言語の決定 (skill 起動時 1 回)

`--lang` が渡っていればそれを使う。 渡っていなければ **起動元が渡した値、 単体起動なら `ja`** を既定にする (option 宣言と同じ規則)。

`/kiwa-app` や `/kiwa-test` から起動される経路では常に値が渡るため、 尋ねる契機は単体起動に限られる。 その場合も既定があるので **AskUserQuestion は出さない** = 既定が決まっている問いを毎回聞くと chain が止まる。

確定後の言語 `$DOC_LANG` は入力 spec の解決と Step 5c (coverage report Write) の両方で参照する。 coverage report の出力 path (Issue #341 lang suffix SSOT、 `/kiwa-design` § lang suffix 規約 と整合):

- ja → `tests/reports/contract/coverage-report-{module}.ja.md` (+ round 別)
- en → `tests/reports/contract/coverage-report-{module}.md`
- その他 → `tests/reports/contract/coverage-report-{module}.{lang_code}.md`

### Step 1: Layer 1 spec 読込

`--spec-path` が渡っていればその path、 無ければ § 入力 spec の path は CLI から受け取る で解決した path を Read し、 以下を抽出:

| 抽出対象 | source section |
|---|---|
| 対象 contract 名 / function 一覧 / error 一覧 | `## 対象機能` / `## 仕様の要約` § API 契約 |
| 優先度別ケース一覧 | `## テストケース一覧` の 9 column 表 |
| 観点別 grouping | `### 観点 N: {name}` サブセクション |
| 自動化対象 | `## 自動化すべきテスト` (優先度順) |
| 手動確認テスト | `## 手動確認でよいテスト` (skip 対象) |

spec が存在しない場合は「Layer 1 spec が未生成、 `/kiwa-design --layer contract --module {name} --lang $DOC_LANG` を先に起動」と return してエラー停止 (Step 2 へ進まない)。

### Step 2: contract 実体確認

Layer 1 spec の「対象機能」section の path (`contracts/*.sol`) を Read し、 spec の function / error 名と実コードを突き合わせる (`rules/quality.md` § 実装整合性確認)。

```bash
ls contracts/ src/ 2>/dev/null
grep -E "function |event |error |modifier " contracts/*.sol src/*.sol 2>/dev/null
forge build 2>&1 | tail -10
```

spec の function / error が実 contract に存在しなければ「不足している仕様」として記録、 Step 3 に進む前にユーザーに報告。

#### Step 2b: spec 期待結果 ↔ contract logic 矛盾検出 (改善 1 / Issue #226)

Step 2 で contract source を Read した後、 Layer 1 spec の各 TC の「期待結果」 column が contract の実 logic と矛盾しないかを **grep ベース** で比較する。 PR #223 で TC-013 の「expiry + 1 でも grantor 保有なら hasAccess = true」 と contract の早期 return false が矛盾していたケースを skill 規約で検出可能にする。

判定 logic。

1. spec の「期待結果」 column から条件 + 期待値の pair を抽出 (例「expiry + 1 で hasAccess = true」「未 mint で revert("NoAccess")」)
2. contract 該当 function を `grep -A 20 "function {name}" contracts/**/*.sol` で抽出し、 以下の矛盾 pattern を検出:
   - `if (X) return false;` / `if (X) revert {Error};` の early return が spec の期待値と逆
   - `require(X, "...")` の require 条件が spec の前提条件と矛盾
   - event emit の order / 引数が spec と異なる
3. 矛盾検出時はそれぞれ report Section 4「Layer 1 spec への書き戻し提案」 に bullet 追加:

format。

- `TC-{NNN} 矛盾検出 — spec 期待結果「{spec_expectation}」 ⇄ contract 実 logic「{contract_behavior}」 (file: {path}:{line})。 spec 修正 or contract 修正のどちらが正しいか user 判断必要`

検出時は **test code 生成を継続** し (期待結果を spec ではなく contract 側に合わせて test を Write)、 report に書き戻し提案を残す。 user が後から spec を訂正できる経路を担保する。

### Step 3: 観点別 forge helper 変換

Layer 1 spec の各ケース行を 観点別に forge helper へ変換 (詳細マッピングは `references/foundry-mapping.md`)。

| Layer 1 観点 | forge helper | 関数命名規約 |
|---|---|---|
| 1. 正常系 | `function test_*` (通常 test) | `test_{Function}_HappyPath` |
| 2. 異常系 | `vm.expectRevert({ErrorName}.selector)` | `test_{Function}_Reverts_When_{Condition}` |
| 3. 境界値 | `function testFuzz_*` (fuzz test) | `testFuzz_{Function}_{Parameter}` |
| 4. 状態遷移 | `function invariant_*` (invariant test) | `invariant_{State}NeverReverts` |
| 5. 権限 | `vm.prank({role})` + role 別 test | `test_{Function}_OnlyAuthorized` |
| 6. 入力バリデーション | `function testFuzz_*` + revert assertion | `testFuzz_{Function}_RejectsInvalidInput` |
| 7. 冪等性 | 2 回 call → 2 回目 `vm.expectRevert` | `test_{Function}_RejectsReplay` |
| 8. 並行処理 | (Solidity 同期実行のため tx ordering test に置換) | `test_{Function}_OrderingMatters` |
| 9. 性能 | `forge test --gas-report` で gas 測定 | `test_{Function}_GasUnder{Budget}` |
| 10. セキュリティ | `function invariant_*` + reentrancy / signature recovery | `invariant_NoReentrancy` / `test_{Function}_RejectsForgedSignature` |

各観点の Foundry 実装例 (Code snippet) は `references/foundry-mapping.md` § Foundry helper 詳細 を Read。

### Step 4: `.t.sol` Write + `forge test` 実行

`test/{Contract}.t.sol` を Write し、 `forge test` を実行する。

```solidity
// test/{Contract}.t.sol (自動生成、 Layer 1 spec ベース)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/{Contract}.sol";

contract {Contract}Test is Test {
    {Contract} public target;
    address public owner = address(0x1);
    address public user = address(0x2);

    function setUp() public {
        target = new {Contract}({constructor args});
    }

    // 観点 1: 正常系
    function test_{Function}_HappyPath() public {
        // {Layer 1 spec の「前提条件」「入力値」「操作手順」「期待結果」を実装}
    }

    // 観点 2: 異常系
    function test_{Function}_Reverts_When_{Condition}() public {
        vm.expectRevert({Contract}.{ErrorName}.selector);
        target.{function}({invalid args});
    }

    // 観点 3: 境界値 (fuzz)
    function testFuzz_{Function}_{Parameter}(uint256 x) public {
        vm.assume(x > 0 && x < type(uint256).max);
        // {境界値 fuzz の実装}
    }

    // ... 残りの観点
}
```

実行:

```bash
forge build 2>&1 | tail -10
forge test 2>&1 | tail -20
```

failure があれば spec の「期待結果」と実 contract behavior の整合確認 (`rules/quality.md` § 実装整合性確認)、 Layer 1 spec の「不足している仕様」に追加項目として記録。

### Step 5: `forge coverage` 評価 + auto loop (production target 100% or 「不可能」判定まで無制限 loop)

**本 step は省略不可**。 `forge test` PASS だけでは test-passed marker を作らず、 coverage 計測 + auto loop + report 生成まで通って初めて完了とみなす (`rules/quality.md` § テスト品質 と整合)。

#### Step 5a: coverage 計測 + file 分類

```bash
forge coverage --report lcov 2>&1 | tee tests/reports/contract/coverage-{module}.lcov
forge coverage --report summary 2>&1 | tail -10
```

lcov 出力を file path で分類 (rule SSOT は `references/coverage-classify.md`):

| file path pattern | カテゴリ | threshold 対象? |
|---|---|---|
| `contracts/**/*.sol` / `src/**/*.sol` | production | ✅ 対象 |
| `test/**/*.t.sol` | test 自身 | ❌ 対象外 |
| `test/helpers/**/*.sol` / `test/mocks/**/*.sol` | mock helper | ❌ 対象外 |
| `script/**/*.sol` | deploy script | ❌ 対象外 |

threshold は **production target に対してのみ** 適用。 default は 100% (OSS 公開水準 + 自動 loop で到達可能性高い):

| metric | default threshold | 引数 override |
|---|---|---|
| Lines | 100% | `--coverage-lines {N}` |
| Statements | 100% | `--coverage-statements {N}` |
| Branches | 100% | `--coverage-branches {N}` (短絡評価 / unreachable で下回る場合は Step 5b 判定で「不可能」分類) |
| Funcs | 100% | `--coverage-funcs {N}` |

#### Step 5b: auto loop (production target threshold 未達時)

production target で threshold 未達なら以下を **上限なし** で loop。

1. uncovered line / branch を抽出
2. 各 uncovered を 5 分類 (rule SSOT `references/coverage-classify.md`):
   - **削除候補** — `test/helpers/**` の未使用 API (他 test から grep ヒット 0)
   - **defensive code** — `require(false, "...")` / `revert "INVARIANT"` / 到達不能な assert
   - **外部依存** — `block.timestamp` 特定値 / `blockhash` / chain-specific opcode 依存で test 再現困難
   - **計測除外** — `invariant_*` test 関数 (`--no-match-test 'invariant_'` で除外されている場合)
   - **真の未踏** — 上記いずれにも該当しない、 追加 test で cover 可能
3. **真の未踏** に対して test 追加生成:
   - Layer 1 spec (`tests/spec/contract/test-spec-{module}.md`) の「テストケース一覧」に新規 TC-NNN として追記
   - Layer 2 で `test/{Contract}.t.sol` に新規 test 関数を Write (既存関数を上書きしない)
   - 観点コメント (`// 観点 N: {name}`) を spec と一致させる
4. 再 `forge test` + `forge coverage` で計測、 round 別 report を `tests/reports/contract/coverage-report-{module}-round-{N}.md` に Write
5. loop 終了条件 (いずれか):
   - production target 全 4 metric 100% 到達 → Step 5c へ
   - 残 uncovered (production 側) が全て「削除候補 / defensive / 外部依存」分類 → Step 5c へ (production 100% は理論不能と確定)
   - 前 round からの coverage delta 0 が **2 round 連続** → 「停滞」判定で Step 5c へ + report に停滞理由

**loop 上限なし**。 user 介入なしで自律 loop する。

#### Step 5c: coverage report Write (canonical)

`tests/reports/contract/coverage-report-{module}.md` を 4 section format で Write (template SSOT `references/coverage-report-template.md`)。

```markdown
# Contract Coverage Report — {module}

Generated: {ISO8601}
Skill: /kiwa-forge | Run: round {N} (final)
Loop terminated: {production_100_achieved | residual_uncoverable | stalled_2round}

## 1. 判定サマリ

| 結果 | production target | Total |
|---|---|---|
| Lines | ✅/❌ {pct}% ({covered}/{total}) | {pct}% ({covered}/{total}) |
| Statements | ... | ... |
| Branches | ... | ... |
| Functions | ... | ... |

**判定 — ✅ PASS / ❌ FAIL** ({reason})

## 2. file 別 coverage 内訳 (production / test / mock 分類)

| File | カテゴリ | Lines | Stmts | Branches | Funcs | threshold 対象? |
|---|---|---|---|---|---|---|
| {path} | {production / test 自身 / mock helper / deploy script} | ... | ... | ... | ... | ✅/❌ |

## 3. 未到達 line の分類と判断

### {file_path} - {N} line uncovered

- L{line_range} {function_name} — 分類: {削除候補 | defensive | 外部依存 | 計測除外 | 真の未踏}
  - **判断**: {具体理由}

(全 uncovered を file ごとに集約して列挙)

## 4. Layer 1 spec への書き戻し提案

| 項目 | 反映先 section | 形式 |
|---|---|---|
| coverage 除外スコープ (production target のみ threshold 対象) | 「不足している仕様」 | bullet 追加 |
| invariant 計測時の handler coverage 変動 | 「テスト観点一覧」§ 10 セキュリティ補足 | bullet 追加 |
| mock 未使用 API (削除候補) | 「不足している仕様」 | bullet 追加 (cleanup PR の余地) |
| 追加 test TC-{NNN} (auto loop で追加) | 「テストケース一覧」§ 観点 {N} | 9 column 表に追加 |
| **runner 差異 (Foundry only branch)** | **「不足している仕様」§ runner 差異** | **bullet 自動追加 (Hardhat 制約検出時)** |

### runner 差異 bullet の自動追加 logic (改善 4 / Issue #227)

Step 5c の Section 4 で未踏 branch を判定する際、 以下のいずれかが Foundry only で cover されている branch に該当する場合、 spec の「不足している仕様 > runner 差異」 セクションに bullet 追加を提案する (実書き戻しは user 手動 or `/kiwa-design --mode update`)。

| 検出 trigger | format |
|---|---|
| `vm.warp(0)` 等で `block.timestamp = 0` を再現している branch | `{branch_path} は Foundry vm.warp(0) でのみ再現可能、 Hardhat は block.timestamp 巻き戻し不可制約により未踏 (許容)` |
| `vm.warp(<過去>)` で時刻巻き戻しを使う branch | `{branch_path} は Foundry vm.warp 過去時刻のみ再現可能、 Hardhat 制約により未踏 (許容)` |
| `forge fuzz` の random 入力で再現する branch (Hardhat 側に同等 fuzz が無い場合) | `{branch_path} は Foundry forge fuzz でのみ再現可能、 Hardhat 側未踏 (許容、 fast-check 等で類似化検討余地)` |

> 注 — 本 skill (Layer 2) は spec を **書き換えず**、 上記提案を report に列挙のみ。 spec への反映は user 手動 or `/kiwa-design --mode update` (別 Issue 検討予定)。
```

round 別 report は `coverage-report-{module}-round-{N}.md` として累積保存、 final round の内容を canonical `coverage-report-{module}.md` に複製。

#### Step 5d: test-passed marker 作成

以下のいずれかで marker 作成:

| 条件 | アクション |
|---|---|
| production target 全 4 metric 100% 到達 | `test-passed` marker を Write |
| production 未達だが残 uncovered が全て「不可能」分類 (削除候補 / defensive / 外部依存) | `test-passed` marker を Write (理由を report Section 1 に明示) |
| 「停滞」判定 (delta 0 が 2 round 連続) | marker を **作らず**、 report Section 1 に「停滞、 manual review 推奨」 を明示してユーザーに報告 |
| `forge coverage` 失敗 (lcov 生成エラー等) | marker を **作らず**、 原因を報告 (silent skip 禁止) |

### Step 6: kiwa-review 自動呼出 (test-review mode)

Step 5d で test-passed marker 作成成功後、 `--no-review` 未指定なら生成 test の品質を独立 review する。 `/kiwa-review --mode test-review --module {module} --layer contract --lang $DOC_LANG --producer kiwa-forge --project-root .` を内部呼出し、 spec vs test 整合 / 観点別 cover 率 / 追加 test 提案 を 5 軸で判定。

呼出例:
```text
/kiwa-review --mode test-review --module nft-marketplace --layer contract --lang $DOC_LANG --producer kiwa-forge --project-root .
```

review 結果:
- PASS (weighted_score >= 7.0) → user に summary + report path を return
- CONDITIONAL (未生成 TC あり) → 未検証の観点と次の手を summary に載せて先へ進む (`skills/kiwa-review/SKILL.md` § Step 4)
- FAIL critical なし → review 指摘 (追加 test 提案 / assertion 抽象化箇所) を表示、 user に「修正して再生成 / そのまま完了」 を選択
- FAIL critical あり → spec TC 大幅実装漏れ or assertion 信頼性無し、 user に「test 再生成必須」 警告

report 出力先: `tests/reports/review/test-review-{module}.{$DOC_LANG}.md`

`--no-review` 引数で skip 可能 (CI 用)。

## 完了条件

- Layer 1 spec の「自動化すべきテスト」リストの全ケースが `test/{Contract}.t.sol` に Write 済
- `forge build` が exit 0
- `forge test` で全関数 PASS (failure 0 件)
- `forge coverage` で **production target (contracts/ 配下) 全 4 metric 100% 到達** もしくは 「残 uncovered が全て不可能分類」 と report で明示
- `tests/reports/contract/coverage-report-{module}.md` が 4 section format で Write 済 (final + round 別)
- 観点別 grouping (`// 観点 N: {name}` コメント) が spec と一致
- 「停滞」判定や `forge coverage` 失敗時は test-passed marker を作らず、 report Section 1 に理由を明示してユーザーに報告

## references

- `references/foundry-mapping.md` — 11 観点 → forge helper の完全マッピング + Code snippet
- `references/fuzz-invariant-patterns.md` — `forge fuzz` / `forge invariant` の実装パターン詳細 (vm.assume / handler 設計 / target contract 設定)
- `references/coverage-classify.md` — file 分類 rule (production / test / mock / script) + uncovered 5 分類 (削除候補 / defensive / 外部依存 / 計測除外 / 真の未踏)
- `references/coverage-report-template.md` — coverage report 4 section format の完全 template (`tests/reports/contract/coverage-report-{module}.md` 生成用)
- `references/doc-language-selection.md` — Step 0 文書生成言語選択 共通 SSOT (ja / en / その他 ISO 639-1)、 4 skill 共用

## examples

- `examples/example-token-gating.t.sol` — `examples/nextjs-token-gating/contracts/GatedContent.sol` ベースの完全な .t.sol サンプル (TC-001 〜 TC-013 の 11 観点 4 grouping を網羅)

## 関連 link

- 仕様書 SSOT: `docs/SKILL-DESIGN.md` / `docs/SKILL-DESIGN.ja.md`
- Layer 1 skill: `.claude/skills/kiwa-design/SKILL.md` (`--layer contract` で本 skill 用 spec を生成)
- 並立 Layer 2: `.claude/skills/kiwa-hardhat/SKILL.md` (Hardhat 用)、 `.claude/skills/kiwa-play/SKILL.md` (Playwright e2e 用)
