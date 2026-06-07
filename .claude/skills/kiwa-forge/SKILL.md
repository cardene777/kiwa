---
name: kiwa-forge
description: |
  /kiwa-design (Layer 1) が出力した `.context/spec/contract/test-spec-{module}.md` を入力に、 Foundry の `test/*.t.sol` を Write して `forge test` で動作確認する Layer 2 contract test skill。
  10 観点 (正常系 / 異常系 / 境界値 / 状態遷移 / 権限 / 入力バリデーション / 冪等性 / 並行処理 / 性能 / セキュリティ) を forge の helper (fuzz / invariant / vm.prank / vm.expectRevert / vm.warp / forge --gas-report) に変換し、 `forge coverage` で line coverage 評価まで一気通貫。
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

- `--module {name}` — Layer 1 spec の module 名 (`.context/spec/contract/test-spec-{name}.md` を Read)
- `--spec-path {path}` — Layer 1 spec の path を明示 (`--module` の代替)
- `--contract {name}` — 対象 contract 名 (省略時は spec の「対象機能」section から推定)
- `--gas-report` — `forge test --gas-report` で gas 測定込みで実行
- `--coverage-threshold {N}` — `forge coverage` の line coverage 目標 (default 80%)
- `--no-tests` — `forge test` 実行をスキップ (Write のみ、 dry-run 用途)

## 実行フロー

5 段階で Layer 1 spec → `.t.sol` → 実行 → 評価まで進む。

### Step 1: Layer 1 spec 読込

`--module` または `--spec-path` で指定された Layer 1 spec を Read し、 以下を抽出:

| 抽出対象 | source section |
|---|---|
| 対象 contract 名 / function 一覧 / error 一覧 | `## 対象機能` / `## 仕様の要約` § API 契約 |
| 優先度別ケース一覧 | `## テストケース一覧` の 9 column 表 |
| 観点別 grouping | `### 観点 N: {name}` サブセクション |
| 自動化対象 | `## 自動化すべきテスト` (優先度順) |
| 手動確認テスト | `## 手動確認でよいテスト` (skip 対象) |

spec が存在しない場合は「Layer 1 spec が未生成、 `/kiwa-design --layer contract --module {name}` を先に起動」と return してエラー停止 (Step 2 へ進まない)。

### Step 2: contract 実体確認

Layer 1 spec の「対象機能」section の path (`contracts/*.sol`) を Read し、 spec の function / error 名と実コードを突き合わせる (`rules/quality.md` § 実装整合性確認)。

```bash
ls contracts/ src/ 2>/dev/null
grep -E "function |event |error |modifier " contracts/*.sol src/*.sol 2>/dev/null
forge build 2>&1 | tail -10
```

spec の function / error が実 contract に存在しなければ「不足している仕様」として記録、 Step 3 に進む前にユーザーに報告。

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
forge coverage --report lcov 2>&1 | tee .context/reports/contract/coverage-{module}.lcov
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
   - Layer 1 spec (`.context/spec/contract/test-spec-{module}.md`) の「テストケース一覧」に新規 TC-NNN として追記
   - Layer 2 で `test/{Contract}.t.sol` に新規 test 関数を Write (既存関数を上書きしない)
   - 観点コメント (`// 観点 N: {name}`) を spec と一致させる
4. 再 `forge test` + `forge coverage` で計測、 round 別 report を `.context/reports/contract/coverage-report-{module}-round-{N}.md` に Write
5. loop 終了条件 (いずれか):
   - production target 全 4 metric 100% 到達 → Step 5c へ
   - 残 uncovered (production 側) が全て「削除候補 / defensive / 外部依存」分類 → Step 5c へ (production 100% は理論不能と確定)
   - 前 round からの coverage delta 0 が **2 round 連続** → 「停滞」判定で Step 5c へ + report に停滞理由

**loop 上限なし**。 user 介入なしで自律 loop する。

#### Step 5c: coverage report Write (canonical)

`.context/reports/contract/coverage-report-{module}.md` を 4 section format で Write (template SSOT `references/coverage-report-template.md`)。

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

## 完了条件

- Layer 1 spec の「自動化すべきテスト」リストの全ケースが `test/{Contract}.t.sol` に Write 済
- `forge build` が exit 0
- `forge test` で全関数 PASS (failure 0 件)
- `forge coverage` で **production target (contracts/ 配下) 全 4 metric 100% 到達** もしくは 「残 uncovered が全て不可能分類」 と report で明示
- `.context/reports/contract/coverage-report-{module}.md` が 4 section format で Write 済 (final + round 別)
- 観点別 grouping (`// 観点 N: {name}` コメント) が spec と一致
- 「停滞」判定や `forge coverage` 失敗時は test-passed marker を作らず、 report Section 1 に理由を明示してユーザーに報告

## references

- `references/foundry-mapping.md` — 10 観点 → forge helper の完全マッピング + Code snippet
- `references/fuzz-invariant-patterns.md` — `forge fuzz` / `forge invariant` の実装パターン詳細 (vm.assume / handler 設計 / target contract 設定)
- `references/coverage-classify.md` — file 分類 rule (production / test / mock / script) + uncovered 5 分類 (削除候補 / defensive / 外部依存 / 計測除外 / 真の未踏)
- `references/coverage-report-template.md` — coverage report 4 section format の完全 template (`.context/reports/contract/coverage-report-{module}.md` 生成用)

## examples

- `examples/example-token-gating.t.sol` — `examples/nextjs-token-gating/contracts/GatedContent.sol` ベースの完全な .t.sol サンプル (TC-001 〜 TC-013 の 10 観点 4 grouping を網羅)

## 関連 link

- 仕様書 SSOT: `docs/SKILL-DESIGN.md` / `docs/SKILL-DESIGN.ja.md`
- Layer 1 skill: `.claude/skills/kiwa-design/SKILL.md` (`--layer contract` で本 skill 用 spec を生成)
- 並立 Layer 2: `.claude/skills/kiwa-hardhat/SKILL.md` (Hardhat 用)、 `.claude/skills/kiwa-play/SKILL.md` (Playwright e2e 用)
