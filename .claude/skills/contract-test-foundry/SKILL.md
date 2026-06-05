---
name: contract-test-foundry
description: |
  /test-design (Layer 1) が出力した `.context/spec/contract/test-spec-{module}.md` を入力に、 Foundry の `test/*.t.sol` を Write して `forge test` で動作確認する Layer 2 contract test skill。
  10 観点 (正常系 / 異常系 / 境界値 / 状態遷移 / 権限 / 入力バリデーション / 冪等性 / 並行処理 / 性能 / セキュリティ) を forge の helper (fuzz / invariant / vm.prank / vm.expectRevert / vm.warp / forge --gas-report) に変換し、 `forge coverage` で line coverage 評価まで一気通貫。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /contract-test-foundry — Layer 2 Foundry contract test skill

`/test-design` (Layer 1) が出力した仕様書を Foundry の `test/*.t.sol` に変換し、 `forge test` で動作確認、 `forge coverage` で line coverage を評価する。

`/test-design --layer contract` で生成した spec を消費する経路、 もしくは既存 contract に対し直接適用する経路の 2 種を提供。

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

spec が存在しない場合は「Layer 1 spec が未生成、 `/test-design --layer contract --module {name}` を先に起動」と return してエラー停止 (Step 2 へ進まない)。

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

### Step 5: `forge coverage` 評価

`--coverage-threshold` で指定された line coverage 目標 (default 80%) を満たしているか評価:

```bash
forge coverage --report summary 2>&1 | tail -10
```

| 結果 | アクション |
|---|---|
| coverage >= threshold | 完了、 `test-passed` marker を Write |
| coverage < threshold | 「不足している仕様」 section に「coverage {N}% < {threshold}% で不足」を追記、 Layer 1 spec に新規ケース追加を提案 |
| `forge coverage` 失敗 | `forge test` は PASS していれば完了 (coverage は warn のみ、 `verify-passed` には影響しない) |

## 完了条件

- Layer 1 spec の「自動化すべきテスト」リストの全ケースが `test/{Contract}.t.sol` に Write 済
- `forge build` が exit 0
- `forge test` で全関数 PASS (failure 0 件)
- `forge coverage` line coverage が `--coverage-threshold` 以上 (default 80%)
- 観点別 grouping (`// 観点 N: {name}` コメント) が spec と一致

## references

- `references/foundry-mapping.md` — 10 観点 → forge helper の完全マッピング + Code snippet
- `references/fuzz-invariant-patterns.md` — `forge fuzz` / `forge invariant` の実装パターン詳細 (vm.assume / handler 設計 / target contract 設定)

## examples

- `examples/example-token-gating.t.sol` — `examples/nextjs-token-gating/contracts/GatedContent.sol` ベースの完全な .t.sol サンプル (TC-001 〜 TC-013 の 10 観点 4 grouping を網羅)

## 関連 link

- 仕様書 SSOT: `docs/SKILL-DESIGN.md` / `docs/SKILL-DESIGN.ja.md`
- Layer 1 skill: `.claude/skills/test-design/SKILL.md` (`--layer contract` で本 skill 用 spec を生成)
- 並立 Layer 2: `.claude/skills/contract-test-hardhat/SKILL.md` (Hardhat 用)、 `.claude/skills/dapp-e2e-test/SKILL.md` (Playwright e2e 用)
