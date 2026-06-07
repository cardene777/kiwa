---
name: kiwa-hardhat
description: |
  /kiwa-design (Layer 1) が出力した `.context/spec/contract/test-spec-{module}.md` を入力に、 Hardhat の `test/*.test.ts` を Write して `npx hardhat test` で動作確認する Layer 2 contract test skill。
  10 観点 (正常系 / 異常系 / 境界値 / 状態遷移 / 権限 / 入力バリデーション / 冪等性 / 並行処理 / 性能 / セキュリティ) を chai matchers / fast-check / Promise.all race / hardhat-gas-reporter / hardhat-coverage に変換し、 line coverage 評価まで一気通貫。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-hardhat — Layer 2 Hardhat contract test skill

`/kiwa-design` (Layer 1) が出力した仕様書を Hardhat の `test/*.test.ts` に変換し、 `npx hardhat test` で動作確認、 `hardhat-coverage` で line coverage を評価する。

Foundry 並立 (Phase E-4) と並ぶ Layer 2 contract test skill。 JS/TS 中心の dApp 開発 workflow をカバーする。

## 前提

- Hardhat インストール済 (`npx hardhat --version` で確認)
- `@nomicfoundation/hardhat-toolbox` または `hardhat-chai-matchers` がインストール済 (custom error / time helper のため)
- 対象 contract が `contracts/` 配下に存在 (`hardhat.config.ts` の `paths.sources` 経由でも可)
- `npx hardhat compile` が PASS する状態

## ユーザーのリクエスト

$ARGUMENTS

## オプション

- `--module {name}` — Layer 1 spec の module 名 (`.context/spec/contract/test-spec-{name}.md` を Read)
- `--spec-path {path}` — Layer 1 spec の path を明示 (`--module` の代替)
- `--contract {name}` — 対象 contract 名 (省略時は spec の「対象機能」section から推定)
- `--gas-report` — `hardhat-gas-reporter` で gas 測定込みで実行
- `--coverage-threshold {N}` — `solidity-coverage` の line coverage 目標 (default 80%)
- `--no-tests` — `npx hardhat test` 実行をスキップ (Write のみ)

## 実行フロー

5 段階で Layer 1 spec → `.test.ts` → 実行 → 評価まで進む。

### Step 1: Layer 1 spec 読込

`--module` または `--spec-path` で指定された Layer 1 spec を Read し、 以下を抽出:

| 抽出対象 | source section |
|---|---|
| 対象 contract 名 / function 一覧 / error 一覧 | `## 対象機能` / `## 仕様の要約` § API 契約 |
| 優先度別ケース一覧 | `## テストケース一覧` の 9 column 表 |
| 観点別 grouping | `### 観点 N: {name}` サブセクション |

spec が存在しない場合は「Layer 1 spec が未生成、 `/kiwa-design --layer contract --module {name}` を先に起動」と return してエラー停止。

### Step 2: contract 実体確認

```bash
ls contracts/ src/ 2>/dev/null
grep -E "function |event |error |modifier " contracts/*.sol src/*.sol 2>/dev/null
npx hardhat compile 2>&1 | tail -10
```

spec の function / error が実 contract に存在しなければ「不足している仕様」として記録、 Step 3 に進む前にユーザーに報告。

### Step 3: 観点別 Hardhat helper 変換

Layer 1 spec の各ケース行を 観点別に Hardhat helper へ変換 (詳細マッピングは `references/hardhat-mapping.md`)。

| Layer 1 観点 | Hardhat helper | 関数命名規約 |
|---|---|---|
| 1. 正常系 | `it('...')` 通常 | `it('{TC-ID} {summary}')` |
| 2. 異常系 | `await expect(...).to.be.revertedWithCustomError(c, '{ActualError}')` | `it('{TC-ID} reverts when ...')` |
| 3. 境界値 | `fast-check` property test | `it('{TC-ID} fuzz boundary')` |
| 4. 状態遷移 | `beforeEach` で state seed + `describe.each(states)` | `describe('state transition')` |
| 5. 権限 | `await c.connect(signer).fn(...)` | `it('{TC-ID} only authorized')` |
| 6. 入力バリデーション | `fast-check` + revert assertion | `it('{TC-ID} rejects invalid input')` |
| 7. 冪等性 | 2 回 call → 2 回目 expect revert | `it('{TC-ID} rejects replay')` |
| 8. 並行処理 | `Promise.all([tx1, tx2])` race | `it('{TC-ID} race condition')` |
| 9. 性能 | `hardhat-gas-reporter` 設定 + per-fn 比較 | `it('{TC-ID} gas under {Budget}')` |
| 10. セキュリティ | signature recovery + role assertion + reentrancy attacker contract | `it('{TC-ID} {security check}')` |

各観点の Hardhat 実装例 (Code snippet) は `references/hardhat-mapping.md` § Hardhat helper 詳細 を Read。

### Step 4: `.test.ts` Write + `npx hardhat test` 実行

`test/{Contract}.test.ts` を Write し、 `npx hardhat test` を実行する。

```typescript
// test/{Contract}.test.ts (自動生成、 Layer 1 spec ベース)
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture, time } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import fc from 'fast-check';

describe('{Contract}', () => {
  async function deployFixture() {
    const [owner, user, otherUser] = await ethers.getSigners();
    const Contract = await ethers.getContractFactory('{Contract}');
    const target = await Contract.deploy({constructor args});
    return { target, owner, user, otherUser };
  }

  describe('観点 1: 正常系', () => {
    it('TC-001 {summary}', async () => {
      const { target, owner } = await loadFixture(deployFixture);
      // Layer 1 spec の「前提条件」「入力値」「操作手順」「期待結果」を実装
    });
  });

  describe('観点 2: 異常系', () => {
    it('TC-NNN reverts when invalid', async () => {
      const { target, user } = await loadFixture(deployFixture);
      await expect(target.connect(user).fn(invalidArgs))
        .to.be.revertedWithCustomError(target, '{ActualErrorName}');
    });
  });

  describe('観点 3: 境界値', () => {
    it('TC-NNN fuzz boundary', async () => {
      const { target, owner } = await loadFixture(deployFixture);
      await fc.assert(
        fc.asyncProperty(fc.bigUintN(64), async (value) => {
          if (value === 0n || value > MAX) return;
          const result = await target.fn(value);
          expect(result).to.equal(/* expected */);
        }),
        { numRuns: 100 }
      );
    });
  });
});
```

実行:

```bash
npx hardhat compile 2>&1 | tail -10
npx hardhat test 2>&1 | tail -30
```

failure があれば spec の「期待結果」と実 contract behavior の整合確認 (`rules/quality.md` § 実装整合性確認)、 Layer 1 spec の「不足している仕様」に追加項目として記録。

### Step 5: `solidity-coverage` 評価 + auto loop (production target 100% or 「不可能」判定まで無制限 loop)

**本 step は省略不可**。 `npx hardhat test` PASS だけでは test-passed marker を作らず、 coverage 計測 + auto loop + report 生成まで通って初めて完了とみなす (`rules/quality.md` § テスト品質 と整合)。

solidity-coverage 未インストールの場合は **install を強制** (skip 不可):

```bash
npm ls solidity-coverage >/dev/null 2>&1 || pnpm add --save-dev solidity-coverage
```

#### Step 5a: coverage 計測 + file 分類

```bash
npx hardhat coverage 2>&1 | tee .context/reports/contract/coverage-{module}.log
cat coverage/coverage-summary.json 2>/dev/null || cat coverage/lcov.info
```

solidity-coverage 出力 (json / lcov) を file path で分類 (rule SSOT は `references/coverage-classify.md`):

| file path pattern | カテゴリ | threshold 対象? |
|---|---|---|
| `contracts/**/*.sol` / `src/**/*.sol` | production | ✅ 対象 |
| `test/**/*.sol` | test 自身 | ❌ 対象外 |
| `test/helpers/**/*.sol` / `test/mocks/**/*.sol` | mock helper | ❌ 対象外 |
| `script/**/*.sol` | deploy script | ❌ 対象外 |

threshold は **production target に対してのみ** 適用。 default は 100%:

| metric | default threshold | 引数 override |
|---|---|---|
| Statements | 100% | `--coverage-statements {N}` |
| Branches | 100% | `--coverage-branches {N}` (短絡評価 / unreachable で下回る場合は Step 5b 判定で「不可能」分類) |
| Functions | 100% | `--coverage-functions {N}` |
| Lines | 100% | `--coverage-lines {N}` |

#### Step 5b: auto loop (production target threshold 未達時)

production target で threshold 未達なら以下を **上限なし** で loop。

1. uncovered line / branch を抽出
2. 各 uncovered を 5 分類 (rule SSOT `references/coverage-classify.md`):
   - **削除候補** — `test/helpers/**` の未使用 API (他 test から grep ヒット 0)
   - **defensive code** — `require(false, "...")` / `revert "INVARIANT"` / 到達不能な assert
   - **外部依存** — `block.timestamp` 特定値 / `blockhash` / chain-specific opcode 依存で test 再現困難
   - **計測除外** — `solidity-coverage` の skipFiles / contract.skip 経路、 もしくは `--no-tags` 等で除外されている test
   - **真の未踏** — 上記いずれにも該当しない、 追加 test で cover 可能
3. **真の未踏** に対して test 追加生成:
   - Layer 1 spec (`.context/spec/contract/test-spec-{module}.md`) の「テストケース一覧」に新規 TC-NNN として追記
   - Layer 2 で `test/{Contract}.test.ts` に新規 it block を追記 (既存 it block を上書きしない)
   - 観点 describe (`describe('観点 N: {name}', () => {...})`) を spec と一致させる
4. 再 `npx hardhat test` + `npx hardhat coverage` で計測、 round 別 report を `.context/reports/contract/coverage-report-{module}-round-{N}.md` に Write
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
Skill: /kiwa-hardhat | Run: round {N} (final)
Loop terminated: {production_100_achieved | residual_uncoverable | stalled_2round}

## 1. 判定サマリ

| 結果 | production target | Total |
|---|---|---|
| Statements | ✅/❌ {pct}% ({covered}/{total}) | {pct}% ({covered}/{total}) |
| Branches | ... | ... |
| Functions | ... | ... |
| Lines | ... | ... |

**判定 — ✅ PASS / ❌ FAIL** ({reason})

## 2. file 別 coverage 内訳 (production / test / mock 分類)

| File | カテゴリ | Stmts | Branches | Funcs | Lines | threshold 対象? |
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
| mock 未使用 API (削除候補) | 「不足している仕様」 | bullet 追加 (cleanup PR の余地) |
| 追加 test TC-{NNN} (auto loop で追加) | 「テストケース一覧」§ 観点 {N} | 9 column 表に追加 |

> 注 — 本 skill (Layer 2) は spec を **書き換えず**、 上記提案を report に列挙のみ。 spec への反映は user 手動 or `/kiwa-design --mode update` (別 Issue 検討予定)。
```

round 別 report は `coverage-report-{module}-round-{N}.md` として累積保存、 final round の内容を canonical `coverage-report-{module}.md` に複製。 path / format は `/kiwa-forge` と統一 (skill 違いを吸収して同じ report format)。

#### Step 5d: test-passed marker 作成

以下のいずれかで marker 作成:

| 条件 | アクション |
|---|---|
| production target 全 4 metric 100% 到達 | `test-passed` marker を Write |
| production 未達だが残 uncovered が全て「不可能」分類 (削除候補 / defensive / 外部依存) | `test-passed` marker を Write (理由を report Section 1 に明示) |
| 「停滞」判定 (delta 0 が 2 round 連続) | marker を **作らず**、 report Section 1 に「停滞、 manual review 推奨」 を明示してユーザーに報告 |
| `hardhat coverage` 失敗 (json / lcov 生成エラー等) | marker を **作らず**、 原因を報告 (silent skip 禁止) |

## 完了条件

- Layer 1 spec の「自動化すべきテスト」リストの全ケースが `test/{Contract}.test.ts` に Write 済
- `npx hardhat compile` が exit 0
- `npx hardhat test` で全 it block PASS (failure 0 件)
- `npx hardhat coverage` で **production target (contracts/ 配下) 全 4 metric 100% 到達** もしくは 「残 uncovered が全て不可能分類」 と report で明示
- `.context/reports/contract/coverage-report-{module}.md` が 4 section format で Write 済 (final + round 別)
- 観点別 grouping (`describe('観点 N: {name}', () => {...})`) が spec と一致
- 「停滞」判定や `hardhat coverage` 失敗時は test-passed marker を作らず、 report Section 1 に理由を明示してユーザーに報告

## references

- `references/hardhat-mapping.md` — 10 観点 → Hardhat helper の完全マッピング + Code snippet + hardhat-toolbox helper 早見表
- `references/fast-check-patterns.md` — `fast-check` property test の実装パターン詳細 (asyncProperty / fc.bigUintN / fc.constantFrom / shrinking 戦略)
- `references/coverage-classify.md` — file 分類 rule (production / test / mock / script) + uncovered 5 分類 (kiwa-forge と共用 SSOT)
- `references/coverage-report-template.md` — coverage report 4 section format の完全 template (kiwa-forge と共用 SSOT、 `.context/reports/contract/coverage-report-{module}.md` 生成用)

## examples

- `examples/example-token-gating.test.ts` — `examples/nextjs-token-gating/contracts/GatedContent.sol` ベースの完全な .test.ts サンプル (TC-001 〜 TC-013 の 6 観点 grouping、 chai matchers + fast-check 込み)

## 関連 link

- 仕様書 SSOT: `docs/SKILL-DESIGN.md` / `docs/SKILL-DESIGN.ja.md`
- Layer 1 skill: `.claude/skills/kiwa-design/SKILL.md` (`--layer contract` で本 skill 用 spec を生成)
- 並立 Layer 2: `.claude/skills/kiwa-forge/SKILL.md` (Foundry 用)、 `.claude/skills/kiwa-play/SKILL.md` (Playwright e2e 用)
